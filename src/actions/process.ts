'use server';

import { prisma } from '@/lib/db';
import { ProposalStatus } from '@/generated/prisma/client';

export async function processProposal(proposalId: string) {
  const start = Date.now();
  console.log(`[START] ${proposalId} at ${new Date().toISOString()}`);

  // Minimal DB touch (this is important)
  const proposal = await prisma.proposal.findUnique({
    where: { id: proposalId },
    select: { id: true, status: true },
  });

  if (!proposal) {
    console.log(`[MISSING] ${proposalId}`);
    return { success: false };
  }

  await prisma.proposal.update({
    where: { id: proposalId },
    data: { status: ProposalStatus.PROCESSING },
  });

  // Simulate Gemini / external API wait
  await new Promise((r) => setTimeout(r, 10_000));

  await prisma.proposal.update({
    where: { id: proposalId },
    data: { status: ProposalStatus.COMPLETED },
  });

  const end = Date.now();
  console.log(
    `[END] ${proposalId} duration=${((end - start) / 1000).toFixed(1)}s`
  );

  return { success: true };
}
