import { getProposals } from '@/actions/fetch-proposals';
import { DashboardTable } from '@/components/dashboard-table';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const proposals = await getProposals();

  return (
    <div className="min-h-screen bg-zinc-50/50">
      <div className="container max-w-7xl mx-auto py-10">
        <DashboardTable initialProposals={proposals} />
      </div>
    </div>
  );
}
