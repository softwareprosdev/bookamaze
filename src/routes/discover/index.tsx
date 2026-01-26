import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Search, BookOpen, ExternalLink, Loader2, Archive } from 'lucide-react'
import { trpc } from '~/integrations/trpc/client'

export const Route = createFileRoute('/discover/')({
  component: DiscoverPage,
})

type SearchSource = 'open_library' | 'internet_archive'

interface OpenLibraryBook {
  key: string
  title: string
  author?: string
  coverId?: number
  firstPublishYear?: number
  isbn?: string
  pageCount?: number
}

interface ArchiveBook {
  identifier: string
  title: string
  author?: string
  description?: string
  publicDate?: string
}

function DiscoverPage() {
  const [query, setQuery] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [source, setSource] = useState<SearchSource>('open_library')
  const [page, setPage] = useState(1)

  const openLibraryQuery = useQuery({
    queryKey: ['discover', 'open_library', searchQuery, page],
    queryFn: () =>
      trpc.discover.searchOpenLibrary.query({
        query: searchQuery,
        page,
        limit: 20,
      }),
    enabled: !!searchQuery && source === 'open_library',
  })

  const archiveQuery = useQuery({
    queryKey: ['discover', 'internet_archive', searchQuery, page],
    queryFn: () =>
      trpc.discover.searchInternetArchive.query({
        query: searchQuery,
        page,
        limit: 20,
      }),
    enabled: !!searchQuery && source === 'internet_archive',
  })

  const currentQuery = source === 'open_library' ? openLibraryQuery : archiveQuery
  const results = currentQuery.data

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      setSearchQuery(query.trim())
      setPage(1)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Discover Books</h1>
          <p className="text-gray-400">
            Search millions of books from Open Library and Internet Archive
          </p>
        </div>

        {/* Search form */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for books, authors, or topics..."
                className="w-full pl-12 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500 text-lg"
              />
            </div>
            <button
              type="submit"
              disabled={!query.trim()}
              className="px-8 py-3 bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              Search
            </button>
          </div>
        </form>

        {/* Source tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => {
              setSource('open_library')
              setPage(1)
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              source === 'open_library'
                ? 'bg-cyan-500 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-5 h-5" />
            Open Library
          </button>
          <button
            onClick={() => {
              setSource('internet_archive')
              setPage(1)
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              source === 'internet_archive'
                ? 'bg-cyan-500 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            <Archive className="w-5 h-5" />
            Internet Archive
          </button>
        </div>

        {/* Results */}
        {!searchQuery ? (
          <div className="text-center py-16">
            <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">
              Enter a search term to find books
            </p>
          </div>
        ) : currentQuery.isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          </div>
        ) : currentQuery.error ? (
          <div className="text-center py-16">
            <p className="text-red-400">Failed to search. Please try again.</p>
          </div>
        ) : results?.items.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No books found</p>
            <p className="text-gray-500 mt-1">Try a different search term</p>
          </div>
        ) : (
          <>
            <p className="text-gray-400 mb-4">
              Found {results?.total.toLocaleString()} results
            </p>

            {source === 'open_library' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(results?.items as OpenLibraryBook[])?.map((book) => (
                  <OpenLibraryCard key={book.key} book={book} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(results?.items as ArchiveBook[])?.map((book) => (
                  <ArchiveCard key={book.identifier} book={book} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {results && results.total > 20 && (
              <div className="flex items-center justify-center gap-4 mt-8">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
                >
                  Previous
                </button>
                <span className="text-gray-400">Page {page}</span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={results.items.length < 20}
                  className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function OpenLibraryCard({ book }: { book: OpenLibraryBook }) {
  const coverUrl = book.coverId
    ? `https://covers.openlibrary.org/b/id/${book.coverId}-M.jpg`
    : null

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-750 transition-colors">
      <div className="flex gap-4 p-4">
        <div className="w-20 h-28 bg-gray-700 rounded overflow-hidden flex-shrink-0">
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={book.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-gray-500" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-white truncate">{book.title}</h3>
          {book.author && (
            <p className="text-sm text-gray-400 truncate">{book.author}</p>
          )}
          {book.firstPublishYear && (
            <p className="text-xs text-gray-500 mt-1">
              First published: {book.firstPublishYear}
            </p>
          )}
          <a
            href={`https://openlibrary.org${book.key}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 mt-2"
          >
            View on Open Library
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  )
}

function ArchiveCard({ book }: { book: ArchiveBook }) {
  const pdfUrl = `https://archive.org/download/${book.identifier}/${book.identifier}.pdf`

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-750 transition-colors">
      <div className="p-4">
        <h3 className="font-medium text-white line-clamp-2">{book.title}</h3>
        {book.author && (
          <p className="text-sm text-gray-400 truncate mt-1">{book.author}</p>
        )}
        {book.description && (
          <p className="text-sm text-gray-500 line-clamp-2 mt-2">
            {book.description}
          </p>
        )}
        <div className="flex items-center gap-4 mt-3">
          <a
            href={`https://archive.org/details/${book.identifier}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300"
          >
            View on Archive.org
            <ExternalLink className="w-3 h-3" />
          </a>
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-green-400 hover:text-green-300"
          >
            Download PDF
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  )
}
