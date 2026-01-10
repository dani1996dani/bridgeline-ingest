import {
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  RotateCcw,
} from 'lucide-react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfidenceBadge } from '@/components/confidence-badge';
import { ApprovalActions } from '@/components/approval-actions';
import { Proposal } from '@/types/Proposal';
import { ProposalStatus } from '@/types/ProposalStatus';
import { ProposalApprovalStatus } from '@/types/ProposalApprovalStatus';
import { cn } from '@/lib/utils';

interface ProposalRowProps {
  proposal: Proposal;
  onSelect: (proposal: Proposal) => void;
  onRetry: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Proposal>) => void;
}

export const ProposalTableRow = ({
  proposal,
  onSelect,
  onRetry,
  onUpdate,
}: ProposalRowProps) => {
  const isCompleted = proposal.status === ProposalStatus.COMPLETED;
  const isRejected =
    proposal.approvalStatus === ProposalApprovalStatus.REJECTED;

  return (
    <TableRow
      className={cn(
        'cursor-pointer hover:bg-zinc-50 transition-colors group',
        isRejected && 'opacity-50 grayscale'
      )}
      onClick={() => onSelect(proposal)}
    >
      {/* Status Icon */}
      <TableCell>
        {proposal.status === ProposalStatus.PENDING ||
        proposal.status === ProposalStatus.PROCESSING ? (
          <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
        ) : proposal.status === ProposalStatus.FAILED ? (
          <XCircle className="h-5 w-5 text-red-500" />
        ) : proposal.reviewNeeded ? (
          <AlertTriangle className="h-5 w-5 text-amber-500" />
        ) : (
          <CheckCircle2 className="h-5 w-5 text-green-500" />
        )}
      </TableCell>

      {/* Company */}
      <TableCell className="font-medium text-zinc-900">
        <div className="space-y-2">
          {isCompleted ? (
            proposal.companyName || (
              <span className="text-muted-foreground italic">
                Unknown Company
              </span>
            )
          ) : (
            <Skeleton className="h-4 w-[180px]" />
          )}
          <span className="text-xs text-muted-foreground flex items-center gap-1 font-normal">
            <FileText className="h-3 w-3" /> {proposal.fileName}
          </span>
        </div>
      </TableCell>

      {/* Trade */}
      <TableCell>
        {isCompleted ? (
          proposal.trade ? (
            <div className="inline-flex items-center rounded-md border border-zinc-200 px-2.5 py-0.5 text-xs font-semibold text-zinc-700 bg-zinc-50">
              {proposal.trade}
            </div>
          ) : (
            <span className="text-xs text-muted-foreground italic">
              Unknown Trade
            </span>
          )
        ) : (
          <Skeleton className="h-6 w-[100px] rounded-md" />
        )}
      </TableCell>

      {/* Contact */}
      <TableCell>
        {isCompleted ? (
          <div className="flex flex-col gap-0.5">
            {proposal.contactName ? (
              <span className="text-sm font-medium text-zinc-900">
                {proposal.contactName}
              </span>
            ) : (
              <span className="text-xs italic text-zinc-400">No Name</span>
            )}
            <div className="flex flex-col text-xs text-zinc-500">
              {proposal.email ? (
                <span>{proposal.email}</span>
              ) : (
                <span className="italic text-zinc-400">No Email</span>
              )}
              {proposal.phone ? (
                <span>{proposal.phone}</span>
              ) : (
                <span className="italic text-zinc-400">No Phone</span>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-[120px]" />
            <Skeleton className="h-3 w-[140px]" />
          </div>
        )}
      </TableCell>

      {/* Confidence */}
      <TableCell>
        <ConfidenceBadge
          status={proposal.status}
          confidence={proposal.overallConfidence}
        />
      </TableCell>

      {/* Actions */}
      <TableCell className="text-right">
        {isCompleted ? (
          <ApprovalActions proposal={proposal} onUpdate={onUpdate} />
        ) : null}

        {proposal.status === ProposalStatus.FAILED ? (
          <Button
            variant="destructive"
            size="sm"
            className="font-medium h-8"
            onClick={(e) => {
              e.stopPropagation();
              onRetry(proposal.id);
            }}
          >
            Retry <RotateCcw className="ml-1.5 h-4 w-4" />
          </Button>
        ) : null}
      </TableCell>
    </TableRow>
  );
};
