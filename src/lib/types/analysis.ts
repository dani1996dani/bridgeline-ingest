export type Analysis = {
  value: string | null;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW' | null;
  reasoning: string | null;
};
