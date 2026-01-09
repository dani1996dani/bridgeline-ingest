import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface ConfidenceBadgeProps {
  status: string;
  confidence?: string;
}

const BADGE_CONFIG: Record<string, { label: string; style: string }> = {
  LOW: {
    label: 'Low',
    style: 'bg-red-100 text-red-700 border-red-200 hover:bg-red-100',
  },
  MEDIUM: {
    label: 'Medium',
    style:
      'bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-100',
  },
  HIGH: {
    label: 'High',
    style: 'bg-green-100 text-green-700 border-green-200 hover:bg-green-100',
  },
};

export function ConfidenceBadge({ status, confidence }: ConfidenceBadgeProps) {
  if (status !== 'COMPLETED') {
    return <Skeleton className="h-5 w-16 rounded-full" />;
  }

  const variant = BADGE_CONFIG[confidence || 'LOW'];

  return (
    <Badge className={cn('shadow-none border', variant.style)}>
      {variant.label}
    </Badge>
  );
}
