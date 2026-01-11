'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { processProposal } from '@/actions/process';
import pLimit from 'p-limit';
import { Proposal } from '@/types/Proposal';
import { retryProposal } from '@/actions/retry';

const limit = pLimit(3);

// ARCHITECTURE NOTE:
// In a production environment with persistent infrastructure (e.g. AWS),
// this orchestration would be handled by a background job queue (e.g. RabbitMQ)
// to decouple processing from the client session.
//
// For this Serverless MVP, Client-Side Orchestration ensures we stay within
// Vercel's execution limits without external infrastructure dependencies.
export function useProposalQueue(initialProposals: Proposal[]) {
  const router = useRouter();
  const [proposals, setProposals] = useState<Proposal[]>(initialProposals);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    setProposals(initialProposals);
  }, [initialProposals, proposals.length]);

  useEffect(() => {
    const processQueue = async () => {
      const pendingItems = proposals.filter((p) => p.status === 'PENDING');

      // Stop if nothing to do or already running
      if (pendingItems.length === 0 || isProcessingRef.current) return;

      isProcessingRef.current = true;

      const tasks = pendingItems.map((item) => {
        return limit(async () => {
          // Optimistic Update
          setProposals((prev) =>
            prev.map((p) =>
              p.id === item.id ? { ...p, status: 'PROCESSING' } : p
            )
          );

          try {
            console.log('debugz processProposal');
            console.log(
              `FRONTEND [START] ${item.id} at ${new Date().toISOString()}`
            );
            await processProposal(item.id);
            // const result =

            // if (result.success && result.data) {
            //   const data = result.data;
            //
            //   setProposals((prev) =>
            //     prev.map((p) =>
            //       p.id === item.id
            //         ? {
            //             ...p,
            //             ...data,
            //             status: 'COMPLETED',
            //           }
            //         : p
            //     )
            //   );
            // }
          } catch (e) {
            console.error(e);
            setProposals((prev) =>
              prev.map((p) =>
                p.id === item.id ? { ...p, status: 'FAILED' } : p
              )
            );
          }
        });
      });

      await Promise.all(tasks);

      isProcessingRef.current = false;
      router.refresh();
    };

    processQueue();
  }, [proposals, router]);

  const handleRetryProposalProcess = async (proposalId: string) => {
    // Optimistic Update: Re-queue it locally
    setProposals((prev) =>
      prev.map((p) => (p.id === proposalId ? { ...p, status: 'PENDING' } : p))
    );

    // Server Update
    await retryProposal(proposalId);
  };

  const updateProposalState = (
    proposalId: string,
    updates: Partial<Proposal>
  ) => {
    setProposals((prev) =>
      prev.map((p) => (p.id === proposalId ? { ...p, ...updates } : p))
    );
  };

  return { proposals, handleRetryProposalProcess, updateProposalState };
}
