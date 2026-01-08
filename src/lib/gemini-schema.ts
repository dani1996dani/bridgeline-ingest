import { SchemaType, type Schema } from '@google/generative-ai';

export const geminiSchema: Schema = {
  description: 'Construction data',
  type: SchemaType.OBJECT,
  properties: {
    companyName: {
      type: SchemaType.OBJECT,
      properties: {
        value: { type: SchemaType.STRING, nullable: true },
        confidence: { type: SchemaType.STRING, nullable: false },
        reasoning: { type: SchemaType.STRING, nullable: false },
      },
      required: ['confidence', 'reasoning'],
    },
    contactName: {
      type: SchemaType.OBJECT,
      properties: {
        value: { type: SchemaType.STRING, nullable: true },
        confidence: { type: SchemaType.STRING, nullable: false },
        reasoning: { type: SchemaType.STRING, nullable: false },
      },
      required: ['confidence', 'reasoning'],
    },
    email: {
      type: SchemaType.OBJECT,
      properties: {
        value: { type: SchemaType.STRING, nullable: true },
        confidence: { type: SchemaType.STRING, nullable: false },
        reasoning: { type: SchemaType.STRING, nullable: false },
      },
      required: ['confidence', 'reasoning'],
    },
    phone: {
      type: SchemaType.OBJECT,
      properties: {
        value: { type: SchemaType.STRING, nullable: true },
        confidence: { type: SchemaType.STRING, nullable: false },
        reasoning: { type: SchemaType.STRING, nullable: false },
      },
      required: ['confidence', 'reasoning'],
    },
    trade: {
      type: SchemaType.OBJECT,
      properties: {
        value: { type: SchemaType.STRING, nullable: true },
        confidence: { type: SchemaType.STRING, nullable: false },
        reasoning: { type: SchemaType.STRING, nullable: false },
      },
      required: ['confidence', 'reasoning'],
    },
  },
  required: ['companyName', 'contactName', 'email', 'phone', 'trade'],
};
