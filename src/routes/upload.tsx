import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/upload')({
  component: UploadPage,
})

function UploadPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="mx-auto max-w-4xl rounded-3xl border border-slate-800 bg-slate-900/90 p-10 shadow-2xl">
        <h1 className="text-4xl font-bold text-white mb-4">Upload PDF</h1>
        <p className="text-slate-400 mb-6">
          This section is a placeholder for future PDF upload and import features.
          It will let users add PDF books to their library and manage uploads securely.
        </p>
        <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950 p-8 text-center text-slate-500">
          <p className="text-lg">Coming soon: upload, store, and organize your PDF books.</p>
        </div>
      </div>
    </main>
  )
}
