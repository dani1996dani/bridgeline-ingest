'use client';

import { UploadZone } from '@/components/upload-zone';

export function UploadPageContent() {
  return (
    <div className="flex flex-col items-center justify-center w-full max-w-5xl mx-auto py-24 gap-8">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Upload Subcontractor Proposals
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          AI will automatically extract contact info and trade scope from your
          documents.
        </p>
      </div>

      <div className="w-full">
        <UploadZone />
      </div>
    </div>
  );
}
