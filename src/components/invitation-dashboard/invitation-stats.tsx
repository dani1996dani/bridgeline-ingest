import { cn } from '@/lib/utils';

export const InvitationStats = ({
  totalTrades,
  totalContractors,
  selectedCount,
}: {
  totalTrades: number;
  totalContractors: number;
  selectedCount: number;
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatCard label="Trade Categories" value={totalTrades} />
      <StatCard label="Total Contractors" value={totalContractors} />
      <StatCard
        label="Selected to Invite"
        value={selectedCount}
        valueColor="text-blue-600"
      />
    </div>
  );
};

const StatCard = ({
  label,
  value,
  valueColor = 'text-zinc-900',
}: {
  label: string;
  value: number;
  valueColor?: string;
}) => {
  return (
    <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
      <div className="text-xs text-zinc-500 font-medium uppercase tracking-wide">
        {label}
      </div>
      <div className={cn('text-2xl font-bold mt-1', valueColor)}>{value}</div>
    </div>
  );
};
