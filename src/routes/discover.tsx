import { createFileRoute } from '@tanstack/react-router'
import { FormEvent, useMemo, useState } from 'react'
import { DiscoverBook, saveBook } from '~/lib/books'

export const Route = createFileRoute('/discover')({
  component: DiscoverPage,
})

function DiscoverPage() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [results, setResults] = useState<DiscoverBook[]>([])
  const [savedIds, setSavedIds] = useState<Record<string, boolean>>({})

  const hasResults = useMemo(() => results.length > 0, [results])

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return

    setLoading(true)
    setError('')

    try {
      const res = await fetch(`/api/books/search?q=${encodeURIComponent(trimmed)}&limit=24`)
      const data = (await res.json()) as { books?: DiscoverBook[]; error?: string }

      if (!res.ok) {
        setError(data.error || 'Search failed')
        setResults([])
        return
      }

      setResults(data.books || [])
    } catch {
      setError('Search failed. Please try again.')
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleSave = (book: DiscoverBook) => {
    saveBook(book)
    setSavedIds((current) => ({ ...current, [book.id]: true }))
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="mx-auto max-w-6xl rounded-3xl border border-slate-800 bg-slate-900/90 p-10 shadow-2xl">
        <h1 className="text-4xl font-bold text-white mb-4">Discover Books</h1>
        <p className="text-slate-400 mb-6">Search Open Library and save books to your personal library.</p>

        <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row sm:items-center mb-8">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by title, author, or keyword"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-white hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>

        {error ? (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">{error}</div>
        ) : null}

        {!hasResults && !loading ? (
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950 p-8 text-center text-slate-500">
            <p className="text-lg">Try a search like "Dune", "Tolstoy", or "Computer Science".</p>
          </div>
        ) : null}

        {hasResults ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((book) => (
              <article key={book.id} className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                <div className="mb-3 aspect-[2/3] overflow-hidden rounded-lg bg-slate-800">
                  {book.coverUrl ? (
                    <img src={book.coverUrl} alt={book.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-slate-500">No cover</div>
                  )}
                </div>

                <p className="mb-1 text-xs uppercase tracking-wide text-cyan-400">Open Library</p>
                <h2 className="text-lg font-semibold text-white">{book.title}</h2>
                <p className="text-sm text-slate-300">{book.author}</p>
                <p className="mb-4 text-xs text-slate-500">{book.year ? `First published ${book.year}` : 'Year unknown'}</p>

                <div className="flex flex-wrap gap-2">
                  <a
                    href={book.readUrl || book.openLibraryUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg bg-cyan-500 px-3 py-2 text-sm font-medium text-white hover:bg-cyan-600"
                  >
                    {book.readUrl ? 'Read / Preview' : 'Open Book'}
                  </a>
                  <button
                    type="button"
                    onClick={() => handleSave(book)}
                    disabled={!!savedIds[book.id]}
                    className="rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savedIds[book.id] ? 'Saved' : 'Save'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </main>
  )
}
