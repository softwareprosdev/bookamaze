import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { DiscoverBook, getSavedBooks, removeSavedBook } from '~/lib/books'

export const Route = createFileRoute('/library')({
  component: LibraryPage,
})

function LibraryPage() {
  const [books, setBooks] = useState<DiscoverBook[]>([])

  useEffect(() => {
    setBooks(getSavedBooks())
  }, [])

  const handleRemove = (bookId: string) => {
    removeSavedBook(bookId)
    setBooks((current) => current.filter((book) => book.id !== bookId))
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="mx-auto max-w-6xl rounded-3xl border border-slate-800 bg-slate-900/90 p-10 shadow-2xl">
        <h1 className="text-4xl font-bold text-white mb-4">My Library</h1>
        <p className="text-slate-400 mb-6">Books you saved from discovery searches appear here.</p>

        {books.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950 p-8 text-center text-slate-500">
            <p className="text-lg">No saved books yet. Find titles in Discover and save them here.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {books.map((book) => (
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
                    Read / Open
                  </a>
                  <button
                    type="button"
                    onClick={() => handleRemove(book.id)}
                    className="rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
                  >
                    Remove
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
