'use client'

import { useState, useCallback } from 'react'
import { extractProposal } from '@/actions/extract-proposal'
import { toast } from 'sonner'
import { Upload, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export function UploadZone() {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length === 0) return

    await processFiles(files)
  }, [])

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        const files = Array.from(e.target.files)
        await processFiles(files)
      }
    },
    []
  )

  const processFiles = async (files: File[]) => {
    setIsUploading(true)
    let successCount = 0
    let errorCount = 0

    // Process one by one for now (or Promise.all)
    for (const file of files) {
      const formData = new FormData()
      formData.append('file', file)

      const toastId = toast.loading(`Processing ${file.name}...`)

      try {
        const result = await extractProposal(formData)
        if (result.success) {
          if (result.isDuplicate) {
            toast.success(`Duplicate: ${file.name}`, { id: toastId })
          } else {
            toast.success(`Extracted: ${file.name}`, { id: toastId })
          }
          successCount++
        }
      } catch (error) {
        console.error(error)
        toast.error(`Failed: ${file.name}`, { id: toastId })
        errorCount++
      }
    }

    setIsUploading(false)
  }

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

        {!isUploading && (
          <Button
            variant="outline"
            className="mt-4 gap-2 text-zinc-700 dark:text-zinc-300"
            onClick={(e) => {
              e.stopPropagation()
              document.getElementById('file-upload')?.click()
            }}
          >
            <Upload className="h-4 w-4" />
            Select Files
          </Button>
        )}
      </div>
    </div>
  )
}
