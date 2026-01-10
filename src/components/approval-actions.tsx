'use client';

import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Proposal } from '@/types/Proposal';
import { updateProposal } from '@/actions/update-proposal';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ProposalApprovalStatus } from '@/types/ProposalApprovalStatus';

interface ApprovalActionsProps {
  proposal: Proposal;
  onUpdate: (id: string, updates: Partial<Proposal>) => void;
}

export function ApprovalActions({ proposal, onUpdate }: ApprovalActionsProps) {
  const handleApproval = async (
    e: React.MouseEvent,
    action: ProposalApprovalStatus.APPROVED | ProposalApprovalStatus.REJECTED
  ) => {
    e.stopPropagation();

    // Toggle: If already in that state, revert to PENDING. Otherwise set to action.
    const newStatus =
      proposal.approvalStatus === action
        ? ProposalApprovalStatus.PENDING
        : action;

    // Optimistic Update
    onUpdate(proposal.id, { approvalStatus: newStatus });

    // Server Update
    const result = await updateProposal(proposal.id, {}, newStatus);

    if (!result.success) {
      toast.error('Failed to update approval status');
      onUpdate(proposal.id, { approvalStatus: proposal.approvalStatus });
    }
  };

  return (
    <div className="flex items-center justify-end gap-1">
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          'h-8 w-8 hover:bg-green-100 hover:text-green-700',
          proposal.approvalStatus === ProposalApprovalStatus.APPROVED
            ? 'bg-green-100 text-green-700'
            : 'text-zinc-400'
        )}
        onClick={(e) => handleApproval(e, ProposalApprovalStatus.APPROVED)}
      >
        <Check className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          'h-8 w-8 hover:bg-red-100 hover:text-red-700',
          proposal.approvalStatus === ProposalApprovalStatus.REJECTED
            ? 'bg-red-100 text-red-700'
            : 'text-zinc-400'
        )}
        onClick={(e) => handleApproval(e, ProposalApprovalStatus.REJECTED)}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
