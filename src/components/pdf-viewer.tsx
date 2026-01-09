'use client';

import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { Loader2, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Configure worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfViewerProps {
  url: string;
}

export function PdfViewer({ url }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [scale, setScale] = useState<number>(1.5);
  const [loading, setLoading] = useState(true);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setLoading(false);
  }

  return (
    <div className="flex flex-col h-full bg-zinc-100 dark:bg-zinc-800 relative">
      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-white/90 dark:bg-zinc-900/90 backdrop-blur shadow-sm p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setScale((s) => Math.max(0.5, s - 0.2))}
          aria-label="Zoom Out"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="text-xs font-mono w-12 text-center text-zinc-700 dark:text-zinc-300">
          {Math.round(scale * 100)}%
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setScale((s) => Math.min(2.5, s + 0.2))}
          aria-label="Zoom In"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
      </div>

      {/* Document Container */}
      <div className="flex-1 overflow-auto flex justify-center py-8">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={null} // We handle loading state ourselves for better UX
          className="space-y-4" // Add spacing between pages
        >
          {/* RENDER ALL PAGES */}
          {Array.from(new Array(numPages), (el, index) => (
            <Page
              key={`page_${index + 1}`}
              pageNumber={index + 1}
              scale={scale}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              className="shadow-lg bg-white"
            />
          ))}
        </Document>
      </div>
    </div>
  );
}
