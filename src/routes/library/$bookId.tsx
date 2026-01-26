import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@workos-inc/authkit-react'
import {
  ArrowLeft,
  BookOpen,
  Trash2,
  ExternalLink,
  Calendar,
  FileText,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { trpc } from '~/integrations/trpc/client'

export const Route = createFileRoute('/library/$bookId')({
  component: BookDetailPage,
})

function BookDetailPage() {
  const { bookId } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, isLoading: authLoading, signIn } = useAuth()

  const {
    data: book,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['book', bookId],
    queryFn: () => trpc.books.get.query({ bookId }),
    enabled: !!user,
  })

  const deleteMutation = useMutation({
    mutationFn: () => trpc.books.delete.mutate({ bookId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] })
      navigate({ to: '/library' })
    },
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
        <h1 className="text-2xl font-bold text-white mb-2">Sign In Required</h1>
        <p className="text-gray-400 mb-6 text-center">
          Sign in to view book details
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    )
  }

  if (error || !book) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
        <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Book Not Found</h1>
        <p className="text-gray-400 mb-6">
          This book doesn't exist or you don't have access to it.
        </p>
        <Link
          to="/library"
          className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-medium transition-colors"
        >
          Back to Library
        </Link>
      </div>
    )
  }

  const handleDelete = () => {
    if (
      confirm(
        'Are you sure you want to delete this book? This will also remove it from your cloud storage.'
      )
    ) {
      deleteMutation.mutate()
    }
  }

  const formatDate = (date: string | Date | null) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Back button */}
        <Link
          to="/library"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Library
        </Link>

        <div className="bg-gray-800 rounded-xl overflow-hidden">
          <div className="md:flex">
            {/* Cover */}
            <div className="md:w-1/3 p-6">
              <div className="aspect-[2/3] bg-gray-700 rounded-lg overflow-hidden">
                {book.coverUrl ? (
                  <img
                    src={book.coverUrl}
                    alt={book.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-600 to-gray-700">
                    <BookOpen className="w-16 h-16 text-gray-500" />
                  </div>
                )}
              </div>
            </div>

            {/* Details */}
            <div className="md:w-2/3 p-6">
              <h1 className="text-2xl font-bold text-white mb-2">
                {book.title}
              </h1>
              {book.author && (
                <p className="text-lg text-gray-300 mb-4">by {book.author}</p>
              )}

              {/* Progress */}
              {book.readingProgress && (
                <div className="mb-6">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-400">Reading Progress</span>
                    <span className="text-white">
                      {book.readingProgress.percentComplete ?? 0}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-500 transition-all"
                      style={{
                        width: `${book.readingProgress.percentComplete ?? 0}%`,
                      }}
                    />
                  </div>
                  {book.readingProgress.currentPage && (
                    <p className="text-sm text-gray-400 mt-1">
                      Page {book.readingProgress.currentPage}
                      {book.readingProgress.totalPages &&
                        ` of ${book.readingProgress.totalPages}`}
                    </p>
                  )}
                </div>
              )}

              {/* Description */}
              {book.description && (
                <div className="mb-6">
                  <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-2">
                    Description
                  </h2>
                  <p className="text-gray-300 leading-relaxed">
                    {book.description}
                  </p>
                </div>
              )}

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-400 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Added
                  </p>
                  <p className="text-white">{formatDate(book.addedAt)}</p>
                </div>
                {book.pageCount && (
                  <div>
                    <p className="text-sm text-gray-400 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Pages
                    </p>
                    <p className="text-white">{book.pageCount}</p>
                  </div>
                )}
                {book.isbn && (
                  <div>
                    <p className="text-sm text-gray-400">ISBN</p>
                    <p className="text-white">{book.isbn}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-400">File Size</p>
                  <p className="text-white">
                    {formatFileSize(book.fileSizeBytes)}
                  </p>
                </div>
              </div>

              {/* Source */}
              {book.sourceUrl && (
                <div className="mb-6">
                  <p className="text-sm text-gray-400 mb-1">Source</p>
                  <a
                    href={book.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300"
                  >
                    {book.source === 'open_library'
                      ? 'Open Library'
                      : book.source === 'internet_archive'
                        ? 'Internet Archive'
                        : 'External Link'}
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/reader/$bookId"
                  params={{ bookId: book.id }}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-medium transition-colors"
                >
                  <BookOpen className="w-5 h-5" />
                  {book.readingProgress?.currentPage
                    ? 'Continue Reading'
                    : 'Start Reading'}
                </Link>
                <button
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {deleteMutation.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Trash2 className="w-5 h-5" />
                  )}
                  Delete
                </button>
              </div>
            </div>
          </div>

          {/* Bookmarks */}
          {book.bookmarks && book.bookmarks.length > 0 && (
            <div className="border-t border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">
                Bookmarks ({book.bookmarks.length})
              </h2>
              <div className="space-y-2">
                {book.bookmarks.map((bookmark) => (
                  <Link
                    key={bookmark.id}
                    to="/reader/$bookId"
                    params={{ bookId: book.id }}
                    search={{ page: bookmark.page }}
                    className="block p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-white">
                        {bookmark.title || `Page ${bookmark.page}`}
                      </span>
                      <span className="text-sm text-gray-400">
                        Page {bookmark.page}
                      </span>
                    </div>
                    {bookmark.note && (
                      <p className="text-sm text-gray-400 mt-1">
                        {bookmark.note}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
