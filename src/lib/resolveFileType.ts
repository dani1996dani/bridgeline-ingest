import { FileType } from '@/types/FileType';
import { SUPPORTED_FILE_TYPE_MAP } from '@/lib/supportedFileTypes';

export const resolveFileType = (
  fileName: string,
  mimeType?: string | null
): FileType => {
  if (mimeType && SUPPORTED_FILE_TYPE_MAP[mimeType])
    return SUPPORTED_FILE_TYPE_MAP[mimeType];

  const lower = fileName.toLowerCase();
  if (lower.endsWith('.pdf')) return FileType.PDF;
  if (lower.endsWith('.xls') || lower.endsWith('.xlsx')) return FileType.EXCEL;

  return FileType.UNSUPPORTED;
};
