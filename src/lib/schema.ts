import { z } from 'zod'

// This forces the AI to make a hard choice, not a fuzzy number.
export const ConfidenceLevel = z.enum(['HIGH', 'MEDIUM', 'LOW'])

// Every piece of data needs a value, a confidence score, and a reason.
const FieldSchema = z.object({
  value: z
    .string()
    .nullable()
    .describe('The extracted value. Return null if not found.'),
  confidence: ConfidenceLevel.describe(
    'HIGH: Found clearly in Image AND Text. MEDIUM: Found in Text but Image is blurry. LOW: Inferred or guessed.'
  ),
  reasoning: z
    .string()
    .describe(
      "Short explanation (1 sentence). E.g. 'Found in Page 1 Header', 'Inferred from email domain', 'Text was garbled'."
    ),
})

export const ExtractionSchema = z.object({
  companyName: FieldSchema.describe(
    'The legal name of the subcontractor company.'
  ),
  contactName: FieldSchema.describe(
    'The full name of the primary contact person.'
  ),
  email: FieldSchema.describe('The email address for the contact.'),
  phone: FieldSchema.describe('The phone number for the contact.'),
  trade: FieldSchema.describe(
    "The specific trade or scope of work (e.g. 'Plumbing', 'HVAC', 'Electrical')."
  ),
})

export type ExtractionResult = z.infer<typeof ExtractionSchema>
