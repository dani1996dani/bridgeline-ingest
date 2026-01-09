import { Analysis } from '@/types/analysis';

export interface Proposal {
  id: string;
  fileName: string;
  fileUrl?: string | null;
  status: string;
  isVerified: boolean;
  companyName?: string | null;
  trade?: string | null;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  reviewNeeded: boolean;
  overallConfidence?: string;
  analysis?: Record<string, Analysis> | null;
  createdAt?: Date | string;
}
