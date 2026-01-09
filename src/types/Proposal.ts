import { ApprovalStatus, ProposalStatus } from '@/generated/prisma/client';
import { ExtractionField } from './ExtractionField';
import { ConfidenceLevel } from './Confidence';

export interface Proposal {
  id: string;
  fileName: string;
  fileUrl: string | null;
  status: ProposalStatus;
  approvalStatus: ApprovalStatus;
  createdAt: Date | string;
  updatedAt?: Date | string;

  // Flat Data (derived from ExtractionFields for UI convenience)
  companyName: string | null;
  trade: string | null;
  contactName: string | null;
  email: string | null;
  phone: string | null;

  // UI & Analysis State
  reviewNeeded: boolean;
  overallConfidence: ConfidenceLevel;

  // Full Map of Fields
  fields?: Record<string, ExtractionField>;
}
