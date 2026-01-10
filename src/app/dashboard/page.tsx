import { getProposals } from '@/actions/fetch-proposals';
import { DashboardTable } from '@/components/dashboard-table';
import { UploadCloud } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const proposals = await getProposals();

  if (proposals.length === 0) {
    return (
      <div className="flex items-center justify-center">
        <div className="text-center">
          <div className="bg-zinc-100 rounded-full p-4 inline-flex mb-4">
            <UploadCloud className="h-8 w-8 text-zinc-400" />
          </div>
          <h2 className="text-xl font-semibold text-zinc-900">
            No proposals found
          </h2>
          <p className="text-zinc-500 mt-1 max-w-sm mx-auto">
            Upload your first proposal to get started with automated extraction.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="">
      <div className="container max-w-8xl mx-auto py-10">
        <DashboardTable initialProposals={proposals} />
      </div>
    </div>
  );
}
