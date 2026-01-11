import * as XLSX from 'xlsx';
import { geminiSchema } from '@/lib/gemini-schema';
import { EXTRACTION_SYSTEM_PROMPT } from '@/lib/extraction-system-prompt';
import { ExtractedAIResult } from './types';
import { getGeminiClient, MODEL_NAME } from '@/lib/gemini';

const genAI = getGeminiClient();

function extractExcelText(buffer: Buffer): string {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  let text = '';

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
    });

    text += `\nSheet: ${sheetName}\n`;
    text += rows
      .map((row) =>
        row.map((cell) => (cell == null ? '' : String(cell))).join(' | ')
      )
      .join('\n');
  }

  return text;
}

export async function processExcel(buffer: Buffer): Promise<ExtractedAIResult> {
  const extractedText = extractExcelText(buffer);

  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: geminiSchema,
    },
  });

  const result = await model.generateContent([
    {
      text: `Extract proposal data from this spreadsheet:\n\n${extractedText}`,
    },
    { text: EXTRACTION_SYSTEM_PROMPT },
  ]);

  return JSON.parse(result.response.text());
}
