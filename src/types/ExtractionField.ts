import { ConfidenceLevel } from './Confidence';

export interface ExtractionField {
  value: string | null;
  confidence: ConfidenceLevel;
  reasoning: string;
}
