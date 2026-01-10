'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Proposal } from '@/types/Proposal';
import { InvitationStats } from '@/components/invitation-dashboard/invitation-stats';
import { InvitationRow } from '@/components/invitation-dashboard/invitation-row';

interface InvitationDashboardProps {
  proposals: Proposal[];
}

export function InvitationDashboard({ proposals }: InvitationDashboardProps) {
  const router = useRouter();

  // Initialize selection with ALL valid proposals
  const [selectedIds, setSelectedIds] = useState<string[]>(
    proposals.filter((p) => !!p.email).map((p) => p.id)
  );
  const [isSending, setIsSending] = useState(false);

  // Group by Trade
  const grouped = proposals.reduce(
    (acc, curr) => {
      const trade = curr.trade || 'Uncategorized';
      if (!acc[trade]) acc[trade] = [];
      acc[trade].push(curr);
      return acc;
    },
    {} as Record<string, Proposal[]>
  );

  const handleToggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSend = async () => {
    if (selectedIds.length === 0) return;
    setIsSending(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    toast.success(`Successfully sent invitations!`);
    setIsSending(false);
    router.push('/dashboard');
  };

  return (
    <div className="pb-32">
      <div className="container max-w-5xl mx-auto py-10 space-y-8">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
            Invitation to Bid
          </h1>
          <p className="text-zinc-500">
            Review approved subcontractors and send ITBs.
          </p>
        </div>

        {/* Stats */}
        <InvitationStats
          totalTrades={Object.keys(grouped).length}
          totalContractors={proposals.length}
          selectedCount={selectedIds.length}
        />

        {/* Grouped Lists */}
        <div className="space-y-6">
          {Object.entries(grouped)
            .sort()
            .map(([trade, items]) => (
              <Card
                key={trade}
                className="shadow-sm border border-zinc-200 overflow-hidden p-0 gap-0"
              >
                <CardHeader className="bg-zinc-50/50 border-b border-zinc-100 px-4 py-3 flex flex-col justify-center border-1">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2 text-zinc-800">
                    {trade}
                    <Badge
                      variant="secondary"
                      className="font-normal bg-white border border-zinc-200 text-zinc-500 h-5 px-1.5 min-w-[20px] justify-center shadow-none"
                    >
                      {items.length}{' '}
                      {items.length > 1 ? 'Contractors' : 'Contractor'}
                    </Badge>
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-0 divide-y divide-zinc-100">
                  {items.map((item) => (
                    <InvitationRow
                      key={item.id}
                      item={item}
                      isSelected={selectedIds.includes(item.id)}
                      onToggle={handleToggle}
                    />
                  ))}
                </CardContent>
              </Card>
            ))}
        </div>
      </div>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-zinc-200 z-10">
        <div className="container max-w-5xl mx-auto flex items-center justify-between">
          <div className="text-sm text-zinc-500 font-medium">
            {selectedIds.length} contractors selected
          </div>
          <Button
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm min-w-[140px]"
            disabled={selectedIds.length === 0 || isSending}
            onClick={handleSend}
          >
            {isSending ? (
              'Sending...'
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" /> Send Invitations
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
