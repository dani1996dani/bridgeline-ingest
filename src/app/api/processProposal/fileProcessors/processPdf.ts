import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { geminiSchema } from '@/lib/gemini-schema';
import { EXTRACTION_SYSTEM_PROMPT } from '@/lib/extraction-system-prompt';
import { ExtractedAIResult } from './types';
import {
  getGeminiClient,
  getGoogleFileManager,
  MODEL_NAME,
} from '@/lib/gemini';

const genAI = getGeminiClient();
const fileManager = getGoogleFileManager();

export async function processPdf(
  buffer: Buffer,
  fileName: string,
  hash: string
): Promise<ExtractedAIResult> {
  const ext = path.extname(fileName) || '.pdf';
  const tempPath = path.join(os.tmpdir(), `${hash}${ext}`);

  try {
    await fs.writeFile(tempPath, buffer);

    const uploadResult = await fileManager.uploadFile(tempPath, {
      mimeType: 'application/pdf',
      displayName: fileName,
    });

    const googleFile = uploadResult.file;

    let fileState = await fileManager.getFile(googleFile.name);
    while (fileState.state === 'PROCESSING') {
      await new Promise((r) => setTimeout(r, 1000));
      fileState = await fileManager.getFile(googleFile.name);
    }

    if (fileState.state === 'FAILED') {
      throw new Error('Google File Processing Failed');
    }

    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: geminiSchema,
      },
    });

    const result = await model.generateContent([
      { fileData: { mimeType: googleFile.mimeType, fileUri: googleFile.uri } },
      { text: EXTRACTION_SYSTEM_PROMPT },
    ]);

    await fileManager.deleteFile(googleFile.name);

    return JSON.parse(result.response.text());
  } finally {
    try {
      await fs.unlink(tempPath);
    } catch {}
  }
}
