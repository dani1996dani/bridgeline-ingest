'use client';

import { useEffect, useState, useRef } from 'react';
import { processProposal } from '@/actions/process';
import {
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronRight,
  FileText,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import pLimit from 'p-limit';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Analysis } from '@/lib/types/analysis';

const limit = pLimit(3);

interface Proposal {
  id: string;
  fileName: string;
  status: string;
  isVerified: boolean;
  companyName?: string | null;
  trade?: string | null;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  reviewNeeded: boolean;
  overallConfidence?: string;
  analysis?: Record<string, Analysis> | null;
}

export function DashboardTable({
  initialProposals,
}: {
  initialProposals: Proposal[];
}) {
  const router = useRouter();
  const [proposals, setProposals] = useState<Proposal[]>(initialProposals);

  // Track if we are currently processing to prevent duplicate runs
  const isProcessingRef = useRef(false);

  // --- FIX 1: Sync new uploads, but preserve local progress ---
  useEffect(() => {
    // Only update if the SERVER has more items than us (new upload happened)
    if (initialProposals.length > proposals.length) {
      setProposals(initialProposals);
    }
  }, [initialProposals, proposals.length]);

  // --- STATS CALCULATION ---
  const totalCount = proposals.length;
  const processingCount = proposals.filter(
    (p) => p.status === 'PENDING' || p.status === 'PROCESSING'
  ).length;
  const needsReviewCount = proposals.filter(
    (p) => p.status === 'COMPLETED' && p.reviewNeeded
  ).length;
  const readyCount = proposals.filter(
    (p) => p.status === 'COMPLETED' && !p.reviewNeeded
  ).length;

  // --- CLIENT ORCHESTRATOR LOOP ---
  useEffect(() => {
    const processQueue = async () => {
      const pendingItems = proposals.filter((p) => p.status === 'PENDING');

      // Stop if nothing to do or already running
      if (pendingItems.length === 0 || isProcessingRef.current) return;

      isProcessingRef.current = true;

      const tasks = pendingItems.map((item) => {
        return limit(async () => {
          // 1. Optimistic Update (UI goes Blue immediately)
          setProposals((prev) =>
            prev.map((p) =>
              p.id === item.id ? { ...p, status: 'PROCESSING' } : p
            )
          );

          try {
            // 2. Call Server Action
            const result = await processProposal(item.id);

            if (result.success && result.data) {
              const data = result.data;

              // 3. Update Local State (UI goes Green)
              setProposals((prev) =>
                prev.map((p) =>
                  p.id === item.id
                    ? {
                        ...p,
                        status: 'COMPLETED',
                        companyName: data.companyName,
                        trade: data.trade,
                        contactName: data.contactName,
                        email: data.email,
                        phone: data.phone,
                        reviewNeeded: data.reviewNeeded,
                        overallConfidence: data.overallConfidence,
                        analysis: data.analysis,
                      }
                    : p
                )
              );

              // FIX 2: REMOVED router.refresh() from here.
              // We rely on local state updates to show progress.
            }
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

      // FIX 3: Refresh ONLY after everything is done to ensure DB sync
      isProcessingRef.current = false;
      router.refresh();
    };

    processQueue();
  }, [proposals]); // Run whenever state changes (to catch new PENDING items)

  // --- HELPER: Confidence Badge ---
  const getConfidenceBadge = (status: string, overallConfidence?: string) => {
    if (status !== 'COMPLETED')
      return <Skeleton className="h-5 w-16 rounded-full" />;

    if (overallConfidence === 'LOW')
      return (
        <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200 shadow-none">
          Low Confidence
        </Badge>
      );
    if (overallConfidence === 'MEDIUM')
      return (
        <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-yellow-200 shadow-none">
          Medium
        </Badge>
      );
    return (
      <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 shadow-none">
        High
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
            Proposal Dashboard
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Automated extraction for subcontractor bids.
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          {processingCount > 0 && (
            <div className="flex items-center gap-2 text-xs font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full animate-pulse border border-blue-100">
              <Loader2 className="h-3 w-3 animate-spin" />
              Processing {processingCount} remaining...
            </div>
          )}

          <p className="text-sm text-zinc-500">
            <span className="font-medium text-zinc-900">{totalCount}</span>{' '}
            extracted <span className="mx-1 text-zinc-300">|</span>
            <span className="text-green-600 font-medium">
              {readyCount} ready
            </span>{' '}
            <span className="mx-1 text-zinc-300">|</span>
            <span className="text-amber-600 font-medium">
              {needsReviewCount} need review
            </span>
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-zinc-50/50">
            <TableRow>
              <TableHead className="w-[100px]">Status</TableHead>
              <TableHead className="w-[400px]">Company Name</TableHead>
              <TableHead className="w-[400px]">Trade</TableHead>
              <TableHead className="w-[350px]">Contact Info</TableHead>
              <TableHead>Confidence</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {proposals.map((item) => (
              <TableRow
                key={item.id}
                className="cursor-pointer hover:bg-zinc-50 transition-colors group"
                onClick={() => console.log('Open Sheet for', item.id)}
              >
                <TableCell>
                  {item.status === 'PENDING' || item.status === 'PROCESSING' ? (
                    <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                  ) : item.status === 'FAILED' ? (
                    <XCircle className="h-5 w-5 text-red-500" />
                  ) : item.reviewNeeded ? (
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  )}
                </TableCell>

                <TableCell className="font-medium text-zinc-900">
                  {item.status === 'COMPLETED' ? (
                    item.companyName || (
                      <span className="text-muted-foreground italic">
                        Unknown Company
                      </span>
                    )
                  ) : (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[180px]" />
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <FileText className="h-3 w-3" /> {item.fileName}
                      </span>
                    </div>
                  )}
                </TableCell>

                <TableCell>
                  {item.status === 'COMPLETED' ? (
                    item.trade ? (
                      <div className="inline-flex items-center rounded-md border border-zinc-200 px-2.5 py-0.5 text-xs font-semibold text-zinc-700 bg-zinc-50">
                        {item.trade}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )
                  ) : (
                    <Skeleton className="h-6 w-[100px] rounded-md" />
                  )}
                </TableCell>

                <TableCell>
                  {item.status === 'COMPLETED' ? (
                    <div className="flex flex-col gap-0.5">
                      {item.contactName ? (
                        <span className="text-sm font-medium text-zinc-900">
                          {item.contactName}
                        </span>
                      ) : (
                        <span className="text-xs italic text-zinc-400">
                          No Name
                        </span>
                      )}
                      <div className="flex flex-col text-xs text-zinc-500">
                        <span>{item.email || '-'}</span>
                        <span>{item.phone || '-'}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-[120px]" />
                      <Skeleton className="h-3 w-[140px]" />
                    </div>
                  )}
                </TableCell>

                <TableCell>
                  {getConfidenceBadge(item.status, item.overallConfidence)}
                </TableCell>

                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-zinc-800 hover:text-black hover:bg-zinc-100 font-medium h-8"
                  >
                    Review <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
