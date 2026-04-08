import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/shared/$shareToken')({
  component: DisabledShare,
})

function DisabledShare() {
  return (
    <div className="min-h-[calc(100vh-72px)] flex items-center justify-center p-8 bg-slate-950 text-slate-100">
      <div className="max-w-2xl rounded-3xl border border-white/10 bg-slate-900/95 p-10 shadow-lg shadow-slate-900/40">
        <h1 className="text-4xl font-semibold mb-4">Share route disabled</h1>
        <p className="text-lg leading-8 text-slate-300">
          Public sharing is no longer available via this route. Sharing now happens internally between registered users.
        </p>
      </div>
    </div>
  )
}