'use client';

import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PdfViewer } from '@/components/pdf-viewer';

interface DocumentPreviewProps {
  fileUrl: string | null;
  fileName: string;
}

export const DocumentPreview = ({
  fileUrl,
  fileName,
}: DocumentPreviewProps) => {
  const isPdf = fileName.toLowerCase().endsWith('.pdf');

  if (!fileUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6 text-center bg-zinc-100 dark:bg-zinc-800 border-r">
        <FileText className="h-12 w-12 mb-4 opacity-20" />
        <p>No document preview available.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-zinc-100 dark:bg-zinc-800 border-r relative hidden md:block overflow-hidden h-full">
      {isPdf ? (
        <PdfViewer url={fileUrl} />
      ) : (
        // Non-PDF Fallback (View in browser or Download file, based on file type)
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6 text-center">
          <FileText className="h-16 w-16 mb-4 opacity-20" />
          <p className="mb-4 text-sm font-medium">
            Preview not available for this file type.
          </p>
          <Button variant="outline" asChild>
            <a href={fileUrl} target="_blank" rel="noopener noreferrer">
              View Original File
            </a>
          </Button>
        </div>
      )}

      {!isPdf && (
        <div className="absolute top-4 left-4 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-md border shadow-sm text-xs font-medium flex items-center gap-2">
          <FileText className="h-3.5 w-3.5" />
          {fileName}
        </div>
      )}
    </div>
  );
};
