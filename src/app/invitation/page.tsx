import { getProposals } from '@/actions/fetch-proposals'; // Use your main fetcher
import { ApprovalStatus } from '@/generated/prisma/client';
import { InvitationDashboard } from '@/components/invitation-dashboard';

export const dynamic = 'force-dynamic';

export default async function InvitationPage() {
  // Fetch only APPROVED proposals
  const proposals = await getProposals({
    approvalStatus: ApprovalStatus.APPROVED,
  });

  return <InvitationDashboard proposals={proposals} />;
}
