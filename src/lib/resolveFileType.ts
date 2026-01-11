import { FileType } from '@/types/FileType';

export const resolveFileType = (
  fileName: string,
  mimeType?: string | null
): FileType => {
  if (mimeType === 'application/pdf') return FileType.PDF;

  if (
    mimeType ===
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    mimeType === 'application/vnd.ms-excel'
  ) {
    return FileType.EXCEL;
  }

  const lower = fileName.toLowerCase();
  if (lower.endsWith('.pdf')) return FileType.PDF;
  if (lower.endsWith('.xls') || lower.endsWith('.xlsx')) return FileType.EXCEL;

  return FileType.UNSUPPORTED;
};
