'use server';

import { prisma } from '@/lib/db';
import { Analysis } from '@/lib/types/analysis';

export async function getProposals() {
  const proposals = await prisma.proposal.findMany({
    take: 100,
    orderBy: { createdAt: 'desc' },
    include: {
      extractions: {
        take: 1,
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  return proposals.map((p) => {
    const ext = p.extractions[0];
    const analysis = ext?.analysis as Record<string, Analysis> | null;

    // Calculate Overall Confidence & Review Status
    let reviewNeeded = false;
    let overallConfidence = 'HIGH';

    if (analysis) {
      const fields = [
        analysis.companyName,
        analysis.contactName,
        analysis.email,
        analysis.phone,
        analysis.trade,
      ];

      const hasLow = fields.some((f) => f?.confidence === 'LOW');
      const hasMedium = fields.some((f) => f?.confidence === 'MEDIUM');

      if (hasLow) {
        overallConfidence = 'LOW';
        reviewNeeded = true;
      } else if (hasMedium) {
        overallConfidence = 'MEDIUM';
        reviewNeeded = true;
      }
    } else {
      overallConfidence = 'PENDING';
    }

    return {
      id: p.id,
      fileName: p.fileName,
      fileUrl: p.fileUrl,
      status: p.status,
      isVerified: p.isVerified,

      // Strings for Table
      companyName: ext?.companyName,
      trade: ext?.trade,
      contactName: ext?.contactName,
      email: ext?.email,
      phone: ext?.phone,

      // Meta & Full Object
      reviewNeeded,
      overallConfidence,
      createdAt: p.createdAt,
      analysis,
    };
  });
}
