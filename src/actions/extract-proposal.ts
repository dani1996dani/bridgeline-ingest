'use server'

import { prisma } from '@/lib/db'
import { supabase } from '@/lib/supabase'
import { ProposalStatus } from '@/generated/prisma/client'
import { ExtractionSchema } from '@/lib/schema'
import OpenAI from 'openai'
import crypto from 'crypto'
import { PDFParse } from 'pdf-parse'
import { convert } from 'pdf-img-convert'
import * as XLSX from 'xlsx'
import { zodResponseFormat } from 'openai/helpers/zod'
import { revalidatePath } from 'next/cache'

const openai = new OpenAI()

async function processFileContent(
  buffer: Buffer,
  mimeType: string,
  fileName: string
): Promise<{ text: string; imageBase64: string | null }> {
  let text = ''
  let imageBase64: string | null = null

  if (mimeType === 'application/pdf') {
    // PDF Handling
    const parser = new PDFParse(buffer)
    text = (await parser.getText()).text

    // Vision: Page 1 Only
    const imageOutput = await convert(buffer, {
      page_numbers: [1],
      base64: true,
      scale: 2.0,
    })

    if (imageOutput && imageOutput[0]) {
      imageBase64 = imageOutput[0] as unknown as string
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
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const sheetNames = workbook.SheetNames
    sheetNames.forEach((name) => {
      const sheet = workbook.Sheets[name]
      text += `--- Sheet: ${name} ---\n`
      text += XLSX.utils.sheet_to_csv(sheet) + '\n\n'
    })
  } else {
    // Fallback: Try to read as text (text/plain, etc.)
    text = buffer.toString('utf-8')
  }

  return { text, imageBase64 }
}

export async function extractProposal(formData: FormData) {
  const file = formData.get('file') as File
  if (!file) {
    throw new Error('No file provided')
  }

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // Deduplication
  const hash = crypto.createHash('sha256').update(buffer).digest('hex')

  const existingProposal = await prisma.proposal.findUnique({
    where: { hash },
    include: { extractions: true },
  })

  if (existingProposal) {
    const extraction = existingProposal.extractions[0]
    if (extraction) {
      return {
        success: true,
        data: extraction.data,
        proposalId: existingProposal.id,
        status: existingProposal.status,
        isDuplicate: true,
      }
    }
  }

  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const filePath = `${hash}-${sanitizedName}`

  const { error: uploadError } = await supabase.storage
    .from('proposals')
    .upload(filePath, buffer, {
      contentType: file.type || 'application/octet-stream',
      upsert: true,
    })

  if (uploadError) throw new Error('Failed to upload file to Supabase')

  const {
    data: { publicUrl },
  } = supabase.storage.from('proposals').getPublicUrl(filePath)

  const proposal = await prisma.proposal.create({
    data: {
      hash,
      fileName: file.name,
      status: ProposalStatus.PROCESSING,
      fileUrl: publicUrl,
    },
  })

  revalidatePath('/')

  try {
    // Extraction
    const { text: rawText, imageBase64 } = await processFileContent(
      buffer,
      file.type,
      file.name
    )

    // OpenAI call
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const messages: any[] = [
      {
        role: 'system',
        content: `You are an expert construction bid analyst. Your goal is to extract contact and trade information from subcontractor proposals.
          
          You will be provided with the raw text of the document, and potentially an image of the first page.

          Analyze available sources.
          - Use the image (if provided) for accurate contact details (names, phones, emails) which might be corrupted in raw text OCR.
          - Use the raw text to understand the Trade / Scope of work.
          
          Adhere strictly to the confidence scoring rules:
          - HIGH: Found clearly in Image AND Text (or Image is very clear).
          - MEDIUM: Found in Text but Image is blurry/ambiguous/missing.
          - LOW: Inferred or guessed. 
          
          Return valid JSON matching the schema.`,
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Raw Text from Document:\n\n${rawText.slice(0, 30000)}`,
          },
        ],
      },
    ]

    if (imageBase64) {
      messages[1].content.push({
        type: 'image_url',
        image_url: {
          url: `data:image/png;base64,${imageBase64}`,
        },
      })
    }

    const completion = await openai.chat.completions.parse({
      model: 'gpt-4o-2024-08-06',
      messages: messages,
      response_format: zodResponseFormat(ExtractionSchema, 'extraction'),
    })

    const extractionResult = completion.choices[0].message.parsed

    if (!extractionResult) {
      throw new Error('Failed to parse extraction result')
    }

    // Save Results
    await prisma.extraction.create({
      data: {
        proposalId: proposal.id,
        rawText: rawText,
        data: extractionResult,
      },
    })

    const updatedProposal = await prisma.proposal.update({
      where: { id: proposal.id },
      data: { status: ProposalStatus.COMPLETED },
    })

    revalidatePath('/')

    return {
      success: true,
      data: extractionResult,
      proposalId: updatedProposal.id,
      status: updatedProposal.status,
      isDuplicate: false,
    }
  } catch (error) {
    console.error('Extraction Error:', error)
    await prisma.proposal.update({
      where: { id: proposal.id },
      data: { status: ProposalStatus.FAILED },
    })
    revalidatePath('/')
    throw error
  }
}
