import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';

export const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-2.5.flash';

const API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

if (!API_KEY) {
  throw new Error('CRITICAL: Missing GOOGLE_GENERATIVE_AI_API_KEY');
}

export const getGeminiClient = () => new GoogleGenerativeAI(API_KEY);
export const getGoogleFileManager = () => new GoogleAIFileManager(API_KEY);
