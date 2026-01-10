import { Loader2 } from 'lucide-react';
import { Proposal } from '@/types/Proposal';
import { ProposalStatus } from '@/types/ProposalStatus';
import { ProposalApprovalStatus } from '@/types/ProposalApprovalStatus';

export const DashboardHeader = ({ proposals }: { proposals: Proposal[] }) => {
  const totalCount = proposals.length;

  const processingCount = proposals.filter(
    (p) =>
      p.status === ProposalStatus.PENDING ||
      p.status === ProposalStatus.PROCESSING
  ).length;

  const needsReviewCount = proposals.filter(
    (p) =>
      p.status === ProposalStatus.COMPLETED &&
      p.reviewNeeded &&
      p.approvalStatus === ProposalApprovalStatus.PENDING
  ).length;

  const readyCount = proposals.filter(
    (p) =>
      p.status === ProposalStatus.COMPLETED &&
      !p.reviewNeeded &&
      p.approvalStatus !== ProposalApprovalStatus.REJECTED
  ).length;

  return (
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
  );
};
