'use client';

import { Mail, Phone, User, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Proposal } from '@/types/Proposal';

interface InvitationRowProps {
  item: Proposal;
  isSelected: boolean;
  onToggle: (id: string) => void;
}

export const InvitationRow = ({
  item,
  isSelected,
  onToggle,
}: InvitationRowProps) => {
  const hasEmail = !!item.email;

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 transition-colors',
        !hasEmail ? 'bg-zinc-50/50' : 'hover:bg-zinc-50',
        isSelected && 'bg-blue-50/20'
      )}
    >
      <div className="flex items-start gap-4">
        <Checkbox
          checked={isSelected}
          disabled={!hasEmail}
          onCheckedChange={() => onToggle(item.id)}
          className="mt-1"
        />

        <div className="flex flex-col gap-0.5">
          <span
            className={cn(
              'text-sm font-medium',
              !hasEmail ? 'text-zinc-400' : 'text-zinc-900'
            )}
          >
            {item.companyName || 'Unknown Company'}
          </span>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
            {/* Contact */}
            <span className="flex items-center gap-1">
              <User className="h-3 w-3 text-zinc-400" />
              {item.contactName || 'No Contact'}
            </span>

            {/* Email with Conditional Tooltip */}
            <TooltipProvider>
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <span
                    className={cn(
                      'flex items-center gap-1 cursor-default',
                      !hasEmail && 'text-red-600 font-medium'
                    )}
                  >
                    {hasEmail ? (
                      <>
                        <Mail className="h-3 w-3 text-zinc-400" /> {item.email}
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-3 w-3" /> Missing Email
                      </>
                    )}
                  </span>
                </TooltipTrigger>
                {!hasEmail && (
                  <TooltipContent>
                    <p>Go back to Dashboard to add an email address</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>

            {/* Phone */}
            {item.phone && (
              <>
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3 text-zinc-400" /> {item.phone}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Ready Indicator */}
      {hasEmail && (
        <div className="hidden sm:flex items-center text-[10px] font-medium text-green-700 bg-green-50 border border-green-100 px-2 py-0.5 rounded-full">
          <CheckCircle2 className="h-3 w-3 mr-1" /> Ready
        </div>
      )}
    </div>
  );
};
