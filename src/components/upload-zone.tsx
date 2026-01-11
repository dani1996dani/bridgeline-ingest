'use client';

import { useState } from 'react';
import { uploadProposals } from '@/actions/upload';
import { toast } from 'sonner';
import { Upload, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
];

export function UploadZone() {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const processFiles = async (files: File[]) => {
    // Validation (Size Limit)
    const validFiles = files.filter((file) => {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`File too large: ${file.name} (Max 10MB)`);
        return false;
      }
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error(`Unsupported file type: ${file.name}`);
        return false;
      }
      return true;
    });

    const filesCount = validFiles.length;
    if (filesCount === 0) return;

    setIsUploading(true);

    const toastId = toast.loading(
      `Uploading ${filesCount} ${filesCount > 1 ? 'files' : 'file'}...`
    );

    try {
      const formData = new FormData();
      validFiles.forEach((file) => {
        formData.append('files', file);
      });

      const result = await uploadProposals(formData);

      // Handle the result
      if (result.success) {
        const fileCount = result.results?.length || 0;
        toast.success(
          `Uploaded ${fileCount} ${fileCount > 1 ? 'files' : 'file'}`,
          {
            id: toastId,
          }
        );
        router.push('/dashboard');
      }
    } catch (error) {
      console.error(error);
      toast.error('Upload failed', { id: toastId });
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) {
      await processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      await processFiles(Array.from(e.target.files));
    }
  };

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
        accept=".pdf,.xlsx,.xls"
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
              ? 'Uploading documents...'
              : 'Drop Subcontractor Proposals (PDF, Excel)'}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Max file size: 10MB
          </p>
        </div>

        {!isUploading && (
          <Button
            variant="outline"
            className="mt-4 gap-2 text-zinc-700 dark:text-zinc-300"
            onClick={(e) => {
              e.stopPropagation();
              document.getElementById('file-upload')?.click();
            }}
          >
            <Upload className="h-4 w-4" />
            Select Files
          </Button>
        )}
      </div>
    </div>
  );
}
