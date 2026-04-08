import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useAuth } from '@workos-inc/authkit-react'
import {
  Search,
  Plus,
  BookOpen,
  Grid,
  List,
  SortAsc,
  SortDesc,
  Loader2,
  Share2,
} from 'lucide-react'
import { trpc } from '~/integrations/trpc/client'

export const Route = createFileRoute('/library/')({
  component: LibraryPage,
})

type SortField = 'title' | 'addedAt' | 'lastOpened'
type SortDir = 'asc' | 'desc'
type ViewMode = 'grid' | 'list'

function LibraryPage() {
  const { user, isLoading: authLoading, signIn } = useAuth()
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortField>('addedAt')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [page, setPage] = useState(1)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [selectedBookForShare, setSelectedBookForShare] = useState<Book | null>(null)

  const {
    data,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['books', search, sort, sortDir, page],
    queryFn: () =>
      trpc.books.list.query({
        search: search || undefined,
        sort,
        sortDir,
        page,
        limit: 20,
      }),
    enabled: !!user,
  })

  const {
    data: sharedBooks,
    isLoading: sharedBooksLoading,
  } = useQuery({
    queryKey: ['shared-books'],
    queryFn: () => trpc.books.getSharedWithMe.query(),
    enabled: !!user,
  })

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
        <BookOpen className="w-16 h-16 text-cyan-400 mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Your Library</h1>
        <p className="text-gray-400 mb-6 text-center">
          Sign in to access your book collection
        </p>
        <button
          onClick={() => signIn()}
          className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-medium transition-colors"
        >
          Sign In
        </button>
      </div>
    )
  }

  const toggleSortDir = () => {
    setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-white">My Library</h1>
          <Link
            to="/upload"
            className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Book
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search books..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortField)}
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="addedAt">Date Added</option>
              <option value="title">Title</option>
              <option value="lastOpened">Last Read</option>
            </select>
            <button
              onClick={toggleSortDir}
              className="p-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"
              title={sortDir === 'asc' ? 'Ascending' : 'Descending'}
            >
              {sortDir === 'asc' ? (
                <SortAsc className="w-5 h-5" />
              ) : (
                <SortDesc className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* View Mode */}
          <div className="flex items-center gap-1 bg-gray-800 border border-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-400">Failed to load books</p>
          </div>
        ) : data?.items.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">
              {search ? 'No books found' : 'Your library is empty'}
            </h2>
            <p className="text-gray-400 mb-6">
              {search
                ? 'Try a different search term'
                : 'Add your first book to get started'}
            </p>
            {!search && (
              <Link
                to="/upload"
                className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-medium transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add Book
              </Link>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {data?.items.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onShare={() => {
                  setSelectedBookForShare(book)
                  setShareDialogOpen(true)
                }}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {data?.items.map((book) => (
              <BookListItem key={book.id} book={book} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
            >
              Previous
            </button>
            <span className="text-gray-400">
              Page {page} of {data.totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
              disabled={page === data.totalPages}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
            >
              Next
            </button>
          </div>
        )}

        {/* Shared with Me Section */}
        {sharedBooks && sharedBooks.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-semibold text-white mb-4">Shared with Me</h2>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {sharedBooks.map((share) => (
                  <SharedBookCard key={share.id} share={share} />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {sharedBooks.map((share) => (
                  <SharedBookListItem key={share.id} share={share} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Share Dialog */}
        {shareDialogOpen && selectedBookForShare && (
          <ShareDialog
            book={selectedBookForShare}
            onClose={() => {
              setShareDialogOpen(false)
              setSelectedBookForShare(null)
            }}
          />
        )}
      </div>
    </div>
  )
}

interface Book {
  id: string
  title: string
  author: string | null
  coverUrl: string | null
  readingProgress: {
    percentComplete: number | null
  } | null
}

function BookCard({ book, onShare }: { book: Book; onShare: () => void }) {
  return (
    <div className="group block relative">
      <Link
        to="/reader/$bookId"
        params={{ bookId: book.id }}
        className="block"
      >
        <div className="aspect-[2/3] bg-gray-800 rounded-lg overflow-hidden mb-2 relative">
          {book.coverUrl ? (
            <img
              src={book.coverUrl}
              alt={book.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800">
              <BookOpen className="w-12 h-12 text-gray-600" />
            </div>
          )}
          {/* Progress bar */}
          {book.readingProgress?.percentComplete != null &&
            book.readingProgress.percentComplete > 0 && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-900/50">
                <div
                  className="h-full bg-cyan-500"
                  style={{ width: `${book.readingProgress.percentComplete}%` }}
                />
              </div>
            )}
        </div>
        <h3 className="text-sm font-medium text-white truncate group-hover:text-cyan-400 transition-colors">
          {book.title}
        </h3>
        {book.author && (
          <p className="text-xs text-gray-400 truncate">{book.author}</p>
        )}
      </Link>

      {/* Share button */}
      <button
        onClick={(e) => {
          e.preventDefault()
          onShare()
        }}
        className="absolute top-2 right-2 p-2 bg-gray-900/80 hover:bg-gray-900 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
        title="Share book"
      >
        <Share2 className="w-4 h-4 text-white" />
      </button>
    </div>
  )
}

function BookListItem({ book }: { book: Book }) {
  return (
    <Link
      to="/reader/$bookId"
      params={{ bookId: book.id }}
      className="flex items-center gap-4 p-3 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors group"
    >
      <div className="w-12 h-16 bg-gray-700 rounded overflow-hidden flex-shrink-0">
        {book.coverUrl ? (
          <img
            src={book.coverUrl}
            alt={book.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-gray-500" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-white truncate group-hover:text-cyan-400 transition-colors">
          {book.title}
        </h3>
        {book.author && (
          <p className="text-sm text-gray-400 truncate">{book.author}</p>
        )}
      </div>
      {book.readingProgress?.percentComplete != null &&
        book.readingProgress.percentComplete > 0 && (
          <div className="text-sm text-gray-400">
            {book.readingProgress.percentComplete}%
          </div>
        )}
    </Link>
  )
}

interface SharedBook {
  id: string
  book: Book
  sharedByUser: {
    displayName: string | null
    email: string
  }
  permissions: {
    canRead: boolean
    canDownload: boolean
  }
}

function SharedBookCard({ share }: { share: SharedBook }) {
  return (
    <div className="group block relative">
      <Link
        to="/reader/$bookId"
        params={{ bookId: share.book.id }}
        className="block"
      >
        <div className="aspect-[2/3] bg-gray-800 rounded-lg overflow-hidden mb-2 relative">
          {share.book.coverUrl ? (
            <img
              src={share.book.coverUrl}
              alt={share.book.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800">
              <BookOpen className="w-12 h-12 text-gray-600" />
            </div>
          )}
          {/* Progress bar */}
          {share.book.readingProgress?.percentComplete != null &&
            share.book.readingProgress.percentComplete > 0 && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-900/50">
                <div
                  className="h-full bg-cyan-500"
                  style={{ width: `${share.book.readingProgress.percentComplete}%` }}
                />
              </div>
            )}
        </div>
        <h3 className="text-sm font-medium text-white truncate group-hover:text-cyan-400 transition-colors">
          {share.book.title}
        </h3>
        {share.book.author && (
          <p className="text-xs text-gray-400 truncate">{share.book.author}</p>
        )}
        <p className="text-xs text-cyan-400 truncate">
          Shared by {share.sharedByUser.displayName || share.sharedByUser.email}
        </p>
      </Link>
    </div>
  )
}

function SharedBookListItem({ share }: { share: SharedBook }) {
  return (
    <Link
      to="/reader/$bookId"
      params={{ bookId: share.book.id }}
      className="flex items-center gap-4 p-3 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors group"
    >
      <div className="w-12 h-16 bg-gray-700 rounded overflow-hidden flex-shrink-0">
        {share.book.coverUrl ? (
          <img
            src={share.book.coverUrl}
            alt={share.book.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-gray-500" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-white truncate group-hover:text-cyan-400 transition-colors">
          {share.book.title}
        </h3>
        {share.book.author && (
          <p className="text-sm text-gray-400 truncate">{share.book.author}</p>
        )}
        <p className="text-xs text-cyan-400 truncate">
          Shared by {share.sharedByUser.displayName || share.sharedByUser.email}
        </p>
      </div>
      {share.book.readingProgress?.percentComplete != null &&
        share.book.readingProgress.percentComplete > 0 && (
          <div className="text-sm text-gray-400">
            {share.book.readingProgress.percentComplete}%
          </div>
        )}
    </Link>
  )
}

function ShareDialog({ book, onClose }: { book: Book; onClose: () => void }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUser, setSelectedUser] = useState<{ id: string; email: string; displayName: string | null } | null>(null)
  const [canDownload, setCanDownload] = useState(false)
  const [isSharing, setIsSharing] = useState(false)

  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['searchUsers', searchQuery],
    queryFn: () => trpc.books.searchUsers.query({ query: searchQuery }),
    enabled: searchQuery.length > 0,
  })

  const shareMutation = useMutation({
    mutationFn: (data: {
      bookId: string
      sharedWithUserId: string
      permissions: { canRead: boolean; canDownload: boolean }
    }) => trpc.books.shareBook.mutate(data),
    onSuccess: () => {
      alert('Book shared successfully!')
      onClose()
    },
    onError: (error) => {
      alert(`Failed to share book: ${error.message}`)
    },
  })

  const handleShare = async () => {
    if (!selectedUser) {
      alert('Please select a user to share with')
      return
    }

    setIsSharing(true)
    try {
      await shareMutation.mutateAsync({
        bookId: book.id,
        sharedWithUserId: selectedUser.id,
        permissions: {
          canRead: true,
          canDownload,
        },
      })
    } finally {
      setIsSharing(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold text-white mb-4">Share "{book.title}"</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Search users
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by email or name..."
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Search Results */}
          {searchQuery && (
            <div className="max-h-40 overflow-y-auto border border-gray-600 rounded-lg">
              {isSearching ? (
                <div className="p-3 text-center text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin mx-auto mb-1" />
                  Searching...
                </div>
              ) : searchResults?.length === 0 ? (
                <div className="p-3 text-center text-gray-400">
                  No users found
                </div>
              ) : (
                searchResults?.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => {
                      setSelectedUser(user)
                      setSearchQuery('')
                    }}
                    className="w-full p-3 text-left hover:bg-gray-700 border-b border-gray-600 last:border-b-0 transition-colors"
                  >
                    <div className="text-white font-medium">
                      {user.displayName || user.email}
                    </div>
                    {user.displayName && (
                      <div className="text-sm text-gray-400">{user.email}</div>
                    )}
                  </button>
                ))
              )}
            </div>
          )}

          {/* Selected User */}
          {selectedUser && (
            <div className="p-3 bg-gray-700 rounded-lg">
              <div className="text-sm text-gray-300 mb-1">Sharing with:</div>
              <div className="text-white font-medium">
                {selectedUser.displayName || selectedUser.email}
              </div>
              {selectedUser.displayName && (
                <div className="text-sm text-gray-400">{selectedUser.email}</div>
              )}
              <button
                onClick={() => setSelectedUser(null)}
                className="text-xs text-red-400 hover:text-red-300 mt-1"
              >
                Remove
              </button>
            </div>
          )}

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={canDownload}
                onChange={(e) => setCanDownload(e.target.checked)}
                className="rounded border-gray-600 text-cyan-500 focus:ring-cyan-500"
              />
              <span className="text-sm text-gray-300">Allow downloading</span>
            </label>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleShare}
            disabled={isSharing || !selectedUser}
            className="flex-1 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            {isSharing ? 'Sharing...' : 'Share'}
          </button>
        </div>
      </div>
    </div>
  )
}
