'use client';

import {
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronRight,
  FileText,
  RotateCcw,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ConfidenceBadge } from '@/components/confidence-badge';
import { Proposal } from '@/types/Proposal';
import { useProposalQueue } from '@/hooks/use-proposal-queue';
import { useState } from 'react';
import { ProposalDetailSheet } from '@/components/proposal-detail-sheet';

export function DashboardTable({
  initialProposals,
}: {
  initialProposals: Proposal[];
}) {
  const { proposals, handleRetry } = useProposalQueue(initialProposals);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(
    null
  );
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // stats
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
                onClick={() => {
                  setSelectedProposal(item);
                  setIsSheetOpen(true);
                }}
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
                  <div className="space-y-2">
                    {item.status === 'COMPLETED' ? (
                      item.companyName || (
                        <span className="text-muted-foreground italic">
                          Unknown Company
                        </span>
                      )
                    ) : (
                      <Skeleton className="h-4 w-[180px]" />
                    )}
                    <span className="text-xs text-muted-foreground flex items-center gap-1 font-normal">
                      <FileText className="h-3 w-3" /> {item.fileName}
                    </span>
                  </div>
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
                  <ConfidenceBadge
                    status={item.status}
                    confidence={item.overallConfidence}
                  />
                </TableCell>

                <TableCell className="text-right">
                  {item.status === 'COMPLETED' ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-zinc-800 hover:text-black hover:bg-zinc-100 font-medium h-8"
                    >
                      Review <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  ) : null}
                  {item.status === 'FAILED' ? (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="font-medium h-8"
                      onClick={(e) => {
                        e.stopPropagation(); // Stop row click
                        handleRetry(item.id);
                      }}
                    >
                      Retry <RotateCcw className="ml-1.5 h-4 w-4" />
                    </Button>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <ProposalDetailSheet
        proposal={selectedProposal}
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
      />
    </div>
  );
}
