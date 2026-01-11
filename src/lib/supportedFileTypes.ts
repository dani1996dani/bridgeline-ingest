import { FileType } from '@/types/FileType';

export const SUPPORTED_FILE_TYPE_MAP: Record<string, FileType> = {
  'application/pdf': FileType.PDF,
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
    FileType.EXCEL,
  'application/vnd.ms-excel': FileType.EXCEL,
};

export const SUPPORTED_MIME_TYPES = Object.keys(SUPPORTED_FILE_TYPE_MAP);
