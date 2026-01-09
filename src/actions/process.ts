'use server';

import { prisma } from '@/lib/db';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import { revalidatePath } from 'next/cache';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { ProposalStatus } from '@/generated/prisma/client';
import { geminiSchema } from '@/lib/gemini-schema';
import { EXTRACTION_SYSTEM_PROMPT } from '@/lib/extraction-system-prompt';

// Init Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);
const fileManager = new GoogleAIFileManager(
  process.env.GOOGLE_GENERATIVE_AI_API_KEY!
);

export async function processProposal(proposalId: string) {
  // Fetch from DB
  const proposal = await prisma.proposal.findUnique({
    where: { id: proposalId },
  });

  if (!proposal) {
    return { success: false, error: 'Proposal not found' };
  }

  if (!proposal.fileUrl) {
    return { success: false, error: 'File URL missing in database' };
  }

  if (proposal.status === 'COMPLETED') return { success: true };

  // Set Processing
  await prisma.proposal.update({
    where: { id: proposalId },
    data: { status: ProposalStatus.PROCESSING },
  });

  let tempPath = '';
  let googleFile = null;

  try {
    // Download from Supabase to Temp File
    const response = await fetch(proposal.fileUrl);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    tempPath = path.join(os.tmpdir(), `${proposal.hash}.pdf`);
    await fs.writeFile(tempPath, buffer);

    // Upload to Google
    const uploadResult = await fileManager.uploadFile(tempPath, {
      mimeType: 'application/pdf',
      displayName: proposal.fileName,
    });
    googleFile = uploadResult.file;

    // Wait for file to be active on Google's side
    let fileState = await fileManager.getFile(googleFile.name);
    while (fileState.state === 'PROCESSING') {
      await new Promise((r) => setTimeout(r, 1000));
      fileState = await fileManager.getFile(googleFile.name);
    }

    if (fileState.state === 'FAILED') {
      throw new Error('Google File Processing Failed');
    }

    // Generate Data
    const model = genAI.getGenerativeModel({
      //todo: change back to gemini-2.5-flash
      model: 'gemini-2.5-flash-lite',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: geminiSchema,
      },
    });

    const result = await model.generateContent([
      { fileData: { mimeType: googleFile.mimeType, fileUri: googleFile.uri } },
      {
        text: EXTRACTION_SYSTEM_PROMPT,
      },
    ]);

    const jsonText = result.response.text();
    const aiData = JSON.parse(jsonText);

    // Cleanup Google File
    await fileManager.deleteFile(googleFile.name);

    // Calculate Confidence & Review Status
    // We do this here so the Frontend just renders the result
    const fieldList = [
      aiData.companyName,
      aiData.contactName,
      aiData.email,
      aiData.phone,
      aiData.trade,
    ];

    let overallConfidence = 'HIGH';
    let reviewNeeded = false;

    // Check if ANY field is LOW
    const hasLow = fieldList.some((f) => f?.confidence === 'LOW');
    // Check if ANY field is MEDIUM
    const hasMedium = fieldList.some((f) => f?.confidence === 'MEDIUM');

    if (hasLow) {
      overallConfidence = 'LOW';
      reviewNeeded = true;
    } else if (hasMedium) {
      overallConfidence = 'MEDIUM';
      reviewNeeded = true;
    }

    // Save to DB
    // Create Extraction Record
    await prisma.extraction.create({
      data: {
        proposalId: proposalId,
        companyName: aiData.companyName?.value || null,
        contactName: aiData.contactName?.value || null,
        email: aiData.email?.value || null,
        phone: aiData.phone?.value || null,
        trade: aiData.trade?.value || null,
        analysis: aiData,
      },
    });

    // Update Proposal
    await prisma.proposal.update({
      where: { id: proposalId },
      data: {
        status: ProposalStatus.COMPLETED,
      },
    });

    revalidatePath('/dashboard');

    // Return Flattened Data for UI
    return {
      success: true,
      data: {
        companyName: aiData.companyName?.value,
        trade: aiData.trade?.value,
        contactName: aiData.contactName?.value,
        email: aiData.email?.value,
        phone: aiData.phone?.value,
        reviewNeeded,
        overallConfidence,
        analysis: aiData,
      },
    };
  } catch (error) {
    console.error('Extraction Process Error:', error);
    await prisma.proposal.update({
      where: { id: proposalId },
      data: { status: ProposalStatus.FAILED },
    });
    return { success: false, error: 'AI Processing Failed' };
  } finally {
    // Clean up local temp file
    if (tempPath) {
      try {
        await fs.unlink(tempPath);
      } catch {}
    }
  }
}
