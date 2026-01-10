import { ConfidenceLevel } from '@/types/Confidence';
import { AlertTriangle } from 'lucide-react';

export const ConfidenceAlert = ({
  overallConfidence,
}: {
  overallConfidence: ConfidenceLevel;
}) => {
  const isLowConfidence = [
    ConfidenceLevel.LOW,
    ConfidenceLevel.MEDIUM,
  ].includes(overallConfidence);

  if (!isLowConfidence) return null;

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5" />
        <div>
          <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-500">
            Low confidence detected
          </h4>
          <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
            Some fields may need manual verification. Highlighted fields have
            lower extraction confidence.
          </p>
        </div>
      </div>
    </div>
  );
};
