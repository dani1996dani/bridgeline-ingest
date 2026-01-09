'use server';

import { prisma } from '@/lib/db';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import { revalidatePath } from 'next/cache';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { ProposalStatus } from '@/generated/prisma/client';
import { ConfidenceLevel } from '@/types/Confidence';
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
    const { companyName, contactName, email, phone, trade } = aiData;

    // Cleanup Google File
    await fileManager.deleteFile(googleFile.name);

    // Calculate Confidence & Review Status
    // We do this here so the Frontend just renders the result
    const fieldList = [companyName, contactName, email, phone, trade];

    let overallConfidence = ConfidenceLevel.HIGH;
    let reviewNeeded = false;

    // Check if ANY field is LOW
    const hasLow = fieldList.some((f) => f?.confidence === ConfidenceLevel.LOW);
    // Check if ANY field is MEDIUM
    const hasMedium = fieldList.some(
      (f) => f?.confidence === ConfidenceLevel.MEDIUM
    );

    if (hasLow) {
      overallConfidence = ConfidenceLevel.LOW;
      reviewNeeded = true;
    } else if (hasMedium) {
      overallConfidence = ConfidenceLevel.MEDIUM;
      reviewNeeded = true;
    }

    // Save to DB
    const fieldMap = { companyName, contactName, email, phone, trade };

    await prisma.$transaction(async (tx) => {
      for (const [name, data] of Object.entries(fieldMap)) {
        const fieldData = {
          value: data?.value ?? null,
          confidence: data?.confidence || ConfidenceLevel.LOW,
          reasoning: data?.reasoning || '',
        };

        await tx.extractionField.upsert({
          where: {
            proposalId_name: {
              proposalId,
              name,
            },
          },
          update: fieldData,
          create: {
            ...fieldData,
            proposalId,
            name,
          },
        });
      }

      // Update Proposal
      await tx.proposal.update({
        where: { id: proposalId },
        data: {
          status: ProposalStatus.COMPLETED,
        },
      });
    });

    revalidatePath('/dashboard');

    // Construct the fields map for the UI
    const fields = Object.entries(fieldMap).reduce(
      (acc, [name, data]) => {
        acc[name] = {
          value: data?.value ?? null,
          confidence: data?.confidence || ConfidenceLevel.LOW,
          reasoning: data?.reasoning || '',
        };
        return acc;
      },
      {} as Record<
        string,
        {
          value: string | null;
          confidence: ConfidenceLevel;
          reasoning: string;
        }
      >
    );

    // Return Flattened Data for UI
    return {
      success: true,
      data: {
        companyName: companyName?.value,
        trade: trade?.value,
        contactName: contactName?.value,
        email: email?.value,
        phone: phone?.value,
        reviewNeeded,
        overallConfidence,
        fields,
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
