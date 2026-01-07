'use client';

import { useState, useCallback } from 'react';
import { extractProposal } from '@/actions/extract-proposal';
import { toast } from 'sonner';
import { Upload, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import * as pdfjsLib from 'pdfjs-dist';

// IMPORTANT: Load worker from CDN to avoid Next.js build errors
pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@5.4.530/build/pdf.worker.min.mjs`;

export function UploadZone() {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // --- NEW: Client-Side PDF Renderer ---
  const convertPdfToImage = async (file: File): Promise<string | null> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
      const page = await pdf.getPage(1); // Get Page 1

      const viewport = page.getViewport({ scale: 2.0 }); // High Res
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      if (!context) return null;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await page.render({ canvasContext: context, viewport } as any).promise;
      return canvas.toDataURL('image/png'); // Returns Base64 string
    } catch (e) {
      console.error('Client rendering failed:', e);
      return null;
    }
  };

  const processFiles = async (files: File[]) => {
    setIsUploading(true);

    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);

      const toastId = toast.loading(`Processing ${file.name}...`);
      let clientBase64: string | null = null;

      try {
        // 1. Render Image on Client (if PDF)
        if (file.type === 'application/pdf') {
          toast.loading(`Scanning Document...`, { id: toastId });
          clientBase64 = await convertPdfToImage(file);
        }

        // 2. Send to Server (File + Image String)
        const result = await extractProposal(formData, clientBase64);
        console.log('debugz result', result);

        if (result.success) {
          result.isDuplicate
            ? toast.success(`Duplicate: ${file.name}`, { id: toastId })
            : toast.success(`Extracted: ${file.name}`, { id: toastId });
        } else {
          toast.error('Extraction failed', { id: toastId });
        }
      } catch (error) {
        console.error(error);
        toast.error(`Failed: ${file.name}`, { id: toastId });
      }
    }

    setIsUploading(false);
  };

  // ... (Keep existing drag/drop handlers below) ...
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length)
      await processFiles(Array.from(e.dataTransfer.files));
  }, []);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.length)
        await processFiles(Array.from(e.target.files));
    },
    []
  );

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        'relative flex flex-col items-center justify-center w-full max-w-2xl mx-auto min-h-[300px] p-12 transition-all border-2 border-dashed rounded-xl cursor-pointer bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800',
        isDragging
          ? 'border-zinc-400 bg-zinc-50'
          : 'border-zinc-200 dark:border-zinc-800',
        isUploading && 'pointer-events-none opacity-50'
      )}
      onClick={() => document.getElementById('file-upload')?.click()}
    >
      <input
        id="file-upload"
        type="file"
        multiple
        accept=".pdf,.xlsx,.xls,.csv,.txt"
        className="hidden"
        onChange={handleFileSelect}
      />
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="p-4 rounded-full bg-zinc-100 dark:bg-zinc-800">
          {isUploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
          ) : (
            <Upload className="h-6 w-6 text-zinc-500" />
          )}
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-medium text-zinc-900 dark:text-zinc-50">
            {isUploading
              ? 'Processing files...'
              : 'Drop Subcontractor Proposals (PDF, Excel)'}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            AI will automatically extract contact info and trade scope
          </p>
        </div>
      </div>
    </div>
  );
}
