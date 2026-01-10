'use client';

import { useState } from 'react';
import { useProposalQueue } from '@/hooks/use-proposal-queue';
import { Proposal } from '@/types/Proposal';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ProposalDetailSheet } from '@/components/dashboard/proposal-detail-sheet';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { ProposalTableRow } from '@/components/dashboard/proposal-table-row';

export function DashboardTable({
  initialProposals,
}: {
  initialProposals: Proposal[];
}) {
  const { proposals, handleRetryProposalProcess, updateProposalState } =
    useProposalQueue(initialProposals);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(
    null
  );
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <DashboardHeader proposals={proposals} />

      {/* The Table */}
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
              <ProposalTableRow
                key={item.id}
                proposal={item}
                onSelect={(p) => {
                  setSelectedProposal(p);
                  setIsSheetOpen(true);
                }}
                onRetry={handleRetryProposalProcess}
                onUpdate={updateProposalState}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Detail Sheet */}
      <ProposalDetailSheet
        proposal={selectedProposal}
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        onUpdate={updateProposalState}
      />
    </div>
  );
}
