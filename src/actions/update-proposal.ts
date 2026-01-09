'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { ConfidenceLevel, ExtractionSource } from '@/generated/prisma/client';

export async function updateProposal(
  proposalId: string,
  data: Record<string, string | null>
) {
  try {
    await prisma.$transaction(async (tx) => {
      for (const [name, value] of Object.entries(data)) {
        // Upsert the field with user override metadata
        await tx.extractionField.upsert({
          where: {
            proposalId_name: {
              proposalId,
              name,
            },
          },
          update: {
            value,
            confidence: ConfidenceLevel.HIGH,
            source: ExtractionSource.USER,
            reasoning: 'Manual user edit',
          },
          create: {
            proposalId,
            name,
            value,
            confidence: ConfidenceLevel.HIGH,
            source: ExtractionSource.USER,
            reasoning: 'Manual user edit',
          },
        });
      }
    });

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Update Proposal Error:', error);
    return { success: false, error: 'Failed to update proposal' };
  }
}
