'use server';

import { prisma } from '@/lib/db';
import { ConfidenceLevel } from '@/types/Confidence';
import { ApprovalStatus } from '@/generated/prisma/client';

export async function getProposals(
  filters: { approvalStatus?: ApprovalStatus } = {}
) {
  const proposals = await prisma.proposal.findMany({
    where: {
      ...filters,
    },
    take: 100,
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    include: {
      fields: true,
    },
  });

  return proposals.map((p) => {
    // Transform fields array to a detailed map for the UI
    const fields = p.fields.reduce(
      (acc, field) => {
        acc[field.name] = {
          value: field.value,
          confidence: field.confidence as ConfidenceLevel,
          reasoning: field.reasoning,
        };
        return acc;
      },
      {} as Record<
        string,
        { value: string | null; confidence: ConfidenceLevel; reasoning: string }
      >
    );

    // Calculate Overall Confidence & Review Status
    let reviewNeeded = false;
    let overallConfidence = ConfidenceLevel.HIGH;

    if (p.fields.length > 0) {
      const hasLow = p.fields.some((f) => f.confidence === ConfidenceLevel.LOW);
      const hasMedium = p.fields.some(
        (f) => f.confidence === ConfidenceLevel.MEDIUM
      );

      if (hasLow) {
        overallConfidence = ConfidenceLevel.LOW;
        reviewNeeded = true;
      } else if (hasMedium) {
        overallConfidence = ConfidenceLevel.MEDIUM;
        reviewNeeded = true;
      }
    } else {
      overallConfidence =
        p.status === 'COMPLETED'
          ? ConfidenceLevel.HIGH
          : ConfidenceLevel.PENDING;
    }

    return {
      id: p.id,
      fileName: p.fileName,
      fileUrl: p.fileUrl,
      status: p.status,
      approvalStatus: p.approvalStatus,

      // Strings for Table (derived from fields map)
      companyName: fields['companyName']?.value || null,
      trade: fields['trade']?.value || null,
      contactName: fields['contactName']?.value || null,
      email: fields['email']?.value || null,
      phone: fields['phone']?.value || null,

      // Meta & Full Object
      reviewNeeded,
      overallConfidence,
      createdAt: p.createdAt,
      fields,
    };
  });
}
