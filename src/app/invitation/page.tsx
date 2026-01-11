import { getProposals } from '@/actions/fetch-proposals'; // Use your main fetcher
import { ApprovalStatus } from '@/generated/prisma/client';
import { InvitationDashboard } from '@/components/invitation-dashboard';
import { FileText } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function InvitationPage() {
  // Fetch only APPROVED proposals
  const proposals = await getProposals({
    approvalStatus: ApprovalStatus.APPROVED,
  });

  if (proposals.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="bg-zinc-100 rounded-full p-4 inline-flex mb-4">
            <FileText className="h-8 w-8 text-zinc-400" />
          </div>
          <h2 className="text-xl font-semibold text-zinc-900">
            No approved proposals
          </h2>
          <p className="text-zinc-500 mt-1 max-w-sm mx-auto">
            Once proposals are approved in the dashboard, they will appear here
            for invitation management.
          </p>
        </div>
      </div>
    );
  }

  return <InvitationDashboard proposals={proposals} />;
}
