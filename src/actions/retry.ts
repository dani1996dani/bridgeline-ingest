'use server';

import { prisma } from '@/lib/db';
import { ProposalStatus } from '@/generated/prisma/client';
import { revalidatePath } from 'next/cache';

export async function retryProposal(proposalId: string) {
  try {
    await prisma.proposal.update({
      where: { id: proposalId },
      data: { status: ProposalStatus.PENDING },
    });

    // Tell the dashboard to re-fetch and see the new PENDING status
    revalidatePath('/dashboard');

    return { success: true };
  } catch (error) {
    console.error('Retry Error:', error);
    return { success: false };
  }
}
