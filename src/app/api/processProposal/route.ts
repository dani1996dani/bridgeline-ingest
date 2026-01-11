import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { ConfidenceLevel, ProposalStatus } from '@/generated/prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { processPdf } from '@/app/api/processProposal/fileProcessors/processPdf';
import { processExcel } from '@/app/api/processProposal/fileProcessors/processExcel';
import { resolveFileType } from '@/lib/resolveFileType';
import { FileType } from '@/types/FileType';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const proposalId: string = body.proposalId;

  // Fetch from DB
  const proposal = await prisma.proposal.findUnique({
    where: { id: proposalId },
  });

  if (!proposal) {
    return NextResponse.json({ success: false, error: 'Proposal not found' });
  }

  if (!proposal.fileUrl) {
    return NextResponse.json({
      success: false,
      error: 'File URL missing in database',
    });
  }

  if (proposal.status === ProposalStatus.COMPLETED)
    return NextResponse.json({ success: true });

  // Set Processing
  await prisma.proposal.update({
    where: { id: proposalId },
    data: { status: ProposalStatus.PROCESSING },
  });

  try {
    // Download from Supabase to Temp File
    const response = await fetch(proposal.fileUrl);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const fileType = resolveFileType(proposal.fileName, proposal.mimeType);

    let aiData;

    switch (fileType) {
      case FileType.PDF:
        aiData = await processPdf(buffer, proposal.fileName, proposal.hash);
        break;

      case FileType.EXCEL:
        aiData = await processExcel(buffer);
        break;

      default:
        throw new Error('Unsupported file type');
    }

    const { companyName, contactName, email, phone, trade } = aiData;

    // Calculate Confidence & Review Status
    const fieldList = [companyName, contactName, email, phone, trade];

    let overallConfidence: ConfidenceLevel = ConfidenceLevel.HIGH;
    let reviewNeeded = false;

    const hasLow = fieldList.some((f) => f?.confidence === ConfidenceLevel.LOW);
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
        data: { status: ProposalStatus.COMPLETED },
      });
    });

    revalidatePath('/dashboard');

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
        { value: string | null; confidence: ConfidenceLevel; reasoning: string }
      >
    );

    return NextResponse.json({
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
    });
  } catch (error) {
    console.error('Extraction Process Error:', error);
    await prisma.proposal.update({
      where: { id: proposalId },
      data: { status: ProposalStatus.FAILED },
    });
    return NextResponse.json({ success: false, error: 'AI Processing Failed' });
  }
}
