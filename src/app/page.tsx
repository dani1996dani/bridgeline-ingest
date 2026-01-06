import { UploadZone } from '@/components/upload-zone'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-zinc-50 dark:bg-zinc-950">
      <div className="z-10 w-full max-w-5xl items-center justify-center font-mono text-sm lg:flex flex-col gap-8">
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
    </main>
  )
}
