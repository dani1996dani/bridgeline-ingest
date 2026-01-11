import { ConfidenceLevel } from '@/generated/prisma/client';

type ExtractionField = {
  value: string | null;
  confidence: ConfidenceLevel;
  reasoning: string;
};

export type ExtractedAIResult = {
  companyName?: ExtractionField;
  contactName?: ExtractionField;
  email?: ExtractionField;
  phone?: ExtractionField;
  trade?: ExtractionField;
};
