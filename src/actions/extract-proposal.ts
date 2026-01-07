'use server';

import { prisma } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import { ProposalStatus } from '@/generated/prisma/client'; // Check your prisma path
import { ExtractionSchema } from '@/lib/schema'; // Check your schema path
import OpenAI from 'openai';
import crypto from 'crypto';
import { PDFParse } from 'pdf-parse'; // Standard default import
import * as XLSX from 'xlsx';
import { zodResponseFormat } from 'openai/helpers/zod';
import { revalidatePath } from 'next/cache';

// const openai = new OpenAI();

// Helper: Extract TEXT only (Server side)
// We no longer generate images here. We rely on the client for that.
async function extractRawText(
  url: string,
  mimeType: string,
  fileName: string
): Promise<string> {
  let text = '';

  if (mimeType === 'application/pdf') {
    try {
      // Standard usage: pdf(buffer) returns a Promise with .text
      console.log('debugz url', url);
      const parser = new PDFParse({ url });
      console.log('debugz temp text', (await parser.getText()).text);
      const tableResult = await parser.getTable();

      console.log('debugz pages data', tableResult.pages.length);
      console.log('debugz has tables?', tableResult.pages);
      for (const row of tableResult.mergedTables) {
        console.log('first table data', JSON.stringify(row));
      }
      text = (await parser.getText()).text;
    } catch (e) {
      console.error('PDF Text parsing failed:', e);
      // We continue even if text parsing fails, relying on Vision
    }
  } else if (
    mimeType ===
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    mimeType === 'application/vnd.ms-excel' ||
    mimeType === 'text/csv' ||
    fileName.endsWith('.xlsx') ||
    fileName.endsWith('.xls') ||
    fileName.endsWith('.csv')
  ) {
    // Excel/CSV Handling
    //   try {
    //     const workbook = XLSX.read(buffer, { type: 'buffer' });
    //     const sheetNames = workbook.SheetNames;
    //     sheetNames.forEach((name) => {
    //       const sheet = workbook.Sheets[name];
    //       text += `--- Sheet: ${name} ---\n`;
    //       text += XLSX.utils.sheet_to_csv(sheet) + '\n\n';
    //     });
    //   } catch (e) {
    //     console.error('Excel parsing failed:', e);
    //   }
    // } else {
    //   // Fallback: Try to read as plain text
    //   text = buffer.toString('utf-8');
  }

  return text;
}

// MAIN ACTION
// Now accepts the client-generated image string
export async function extractProposal(
  formData: FormData,
  clientPage1Base64: string | null
) {
  const file = formData.get('file') as File;
  if (!file) {
    throw new Error('No file provided');
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // 1. Deduplication (SHA-256)
  const hash = crypto.createHash('sha256').update(buffer).digest('hex');

  const existingProposal = await prisma.proposal.findUnique({
    where: { hash },
    include: { extractions: true },
  });

  // If duplicate found, return it immediately
  if (existingProposal) {
    const extraction = existingProposal.extractions[0];
    if (extraction) {
      return {
        success: true,
        data: extraction.data,
        proposalId: existingProposal.id,
        status: existingProposal.status,
        isDuplicate: true,
      };
    }
  }

  // 2. Upload to Supabase Storage
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const filePath = `${hash}-${sanitizedName}`;

  const { error: uploadError } = await supabase.storage
    .from('proposals')
    .upload(filePath, buffer, {
      contentType: file.type || 'application/octet-stream',
      upsert: true,
    });

  if (uploadError) {
    console.error('Supabase Upload Error:', uploadError);
    // We continue even if storage fails
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from('proposals').getPublicUrl(filePath);
  const publicPDFUrl = publicUrl;

  // 3. Create Proposal Record
  const proposal = await prisma.proposal.create({
    data: {
      hash,
      fileName: file.name,
      status: ProposalStatus.PROCESSING,
      fileUrl: publicPDFUrl,
    },
  });

  revalidatePath('/');

  try {
    // 4. Extraction Logic (Hybrid)

    // A. Get Raw Text (Server Side)
    const rawText = await extractRawText(publicPDFUrl, file.type, file.name);

    // B. Get Image (From Client) -> clientPage1Base64

    console.log('TEXT LENGTH:', rawText.length);
    console.log('TEXT:', rawText);
    console.log('HAS VISION IMAGE:', !!clientPage1Base64);
    console.log('VISION IMAGE:', clientPage1Base64?.slice(0, 100));

    // 5. OpenAI Call
    /* ---------------- MOCK MODE START ---------------- */
    /*
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const messages: any[] = [
      {
        role: 'system',
        content: `You are an expert construction bid analyst. Your goal is to extract contact and trade information.

          Inputs:
          1. IMAGE of Page 1 (Primary source for layout-dependent contact info).
          2. RAW TEXT of full document (Secondary source for Trade/Scope).

          Confidence Logic:
          - HIGH: Found clearly in Image AND Text.
          - MEDIUM: Found in Text but Image is blurry/missing.
          - LOW: Inferred or guessed.

          Return valid JSON matching the schema.`,
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Raw Text Context (May be messy):\n\n${rawText.slice(0, 30000)}`,
          },
        ],
      },
    ];

    // Inject the Client-Side Image if it exists
    if (clientPage1Base64) {
      messages[1].content.push({
        type: 'image_url',
        image_url: {
          url: clientPage1Base64, // Already formatted as data:image/png;base64,...
        },
      });
    }

    const completion = await openai.chat.completions.parse({
      model: 'gpt-4o-2024-08-06',
      messages: messages,
      response_format: zodResponseFormat(ExtractionSchema, 'extraction'),
    });

    const extractionResult = completion.choices[0].message.parsed;

    if (!extractionResult) {
      throw new Error('Failed to parse extraction result');
    }
    */

    // --- MOCK RESPONSE (Match Zod Schema structure) ---
    const extractionResult = {
      companyName: {
        value: 'Mock Construction Inc.',
        confidence: 'HIGH',
        reasoning: 'Found clearly in header logo (Page 1).',
      },
      contactName: {
        value: 'Bob Builder',
        confidence: 'MEDIUM',
        reasoning: 'Found in email signature, but verified against header.',
      },
      email: {
        value: 'bob@mock-construction.com',
        confidence: 'HIGH',
        reasoning: 'Matches domain pattern.',
      },
      phone: {
        value: '555-0123',
        confidence: 'LOW',
        reasoning: 'Inferred from footer, text was garbled.',
      },
      trade: {
        value: 'Plumbing & HVAC',
        confidence: 'HIGH',
        reasoning: 'Explicitly mentioned in Scope section.',
      },
    };
    /* ---------------- MOCK MODE END ---------------- */

    // 6. Save Results
    await prisma.extraction.create({
      data: {
        proposalId: proposal.id,
        rawText: rawText,
        data: extractionResult,
      },
    });

    const updatedProposal = await prisma.proposal.update({
      where: { id: proposal.id },
      data: { status: ProposalStatus.COMPLETED },
    });

    revalidatePath('/');

    return {
      success: true,
      data: extractionResult,
      proposalId: updatedProposal.id,
      status: updatedProposal.status,
      isDuplicate: false,
    };
  } catch (error) {
    console.error('Extraction Error:', error);
    await prisma.proposal.update({
      where: { id: proposal.id },
      data: { status: ProposalStatus.FAILED },
    });
    revalidatePath('/');
    // Return error state instead of throwing, so UI handles it gracefully
    return { success: false, error: 'Processing Failed' };
  }
}
