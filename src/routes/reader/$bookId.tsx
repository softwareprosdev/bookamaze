import { useState, useEffect, useCallback } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useAuth } from '@workos-inc/authkit-react'
import {
  ArrowLeft,
  BookOpen,
  Bookmark,
  BookmarkPlus,
  Info,
  Loader2,
  AlertCircle,
  X,
} from 'lucide-react'
import { trpc } from '~/integrations/trpc/client'
import { PdfViewer } from '~/components/reader/PdfViewer'

export const Route = createFileRoute('/reader/$bookId')({
  component: ReaderPage,
})

function ReaderPage() {
  const { bookId } = Route.useParams()
  const search = Route.useSearch() as { page?: number }
  const navigate = useNavigate()
  const { user, isLoading: authLoading, signIn } = useAuth()
  const [showBookmarks, setShowBookmarks] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const [currentPage, setCurrentPage] = useState(search.page ?? 1)
  const [totalPages, setTotalPages] = useState(0)

  const {
    data: book,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['book', bookId],
    queryFn: () => trpc.books.get.query({ bookId }),
    enabled: !!user,
  })

  const progressMutation = useMutation({
    mutationFn: (data: { currentPage: number; totalPages?: number }) =>
      trpc.books.updateProgress.mutate({
        bookId,
        ...data,
      }),
  })

  const bookmarkMutation = useMutation({
    mutationFn: (data: { page: number; title?: string }) =>
      trpc.books.addBookmark.mutate({
        bookId,
        ...data,
      }),
  })

  // Restore reading position
  useEffect(() => {
    if (book?.readingProgress?.currentPage && !search.page) {
      setCurrentPage(book.readingProgress.currentPage)
    }
  }, [book, search.page])

  // Debounced progress save
  const saveProgress = useCallback(
    (page: number, total: number) => {
      setCurrentPage(page)
      setTotalPages(total)
    },
    []
  )

  // Save progress periodically
  useEffect(() => {
    if (!currentPage || !totalPages) return

    const timer = setTimeout(() => {
      progressMutation.mutate({
        currentPage,
        totalPages,
      })
    }, 2000)

    return () => clearTimeout(timer)
  }, [currentPage, totalPages, progressMutation])

  // Save progress on unmount
  useEffect(() => {
    return () => {
      if (currentPage && totalPages) {
        progressMutation.mutate({
          currentPage,
          totalPages,
        })
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const addBookmark = () => {
    if (!currentPage) return

    const title = prompt('Bookmark title (optional):')
    bookmarkMutation.mutate({
      page: currentPage,
      title: title || undefined,
    })
  }

  if (authLoading) {
    return (
      <div className="h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
        <BookOpen className="w-16 h-16 text-cyan-400 mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Sign In Required</h1>
        <p className="text-gray-400 mb-6 text-center">
          Sign in to read your books
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
      <div className="h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    )
  }

  if (error || !book) {
    return (
      <div className="h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
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

  // For now, use a placeholder URL - in production this would be a signed URL from cloud storage
  const pdfUrl = `/api/pdf/${bookId}`

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700 z-10">
        <div className="flex items-center gap-4">
          <Link
            to="/library/$bookId"
            params={{ bookId }}
            className="p-2 text-gray-400 hover:text-white transition-colors"
            title="Back to book details"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="hidden sm:block">
            <h1 className="text-white font-medium truncate max-w-xs">
              {book.title}
            </h1>
            {book.author && (
              <p className="text-sm text-gray-400 truncate">{book.author}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={addBookmark}
            className="p-2 text-gray-400 hover:text-cyan-400 transition-colors"
            title="Add bookmark"
          >
            <BookmarkPlus className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowBookmarks(!showBookmarks)}
            className={`p-2 transition-colors ${showBookmarks ? 'text-cyan-400' : 'text-gray-400 hover:text-white'}`}
            title="Show bookmarks"
          >
            <Bookmark className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowInfo(!showInfo)}
            className={`p-2 transition-colors ${showInfo ? 'text-cyan-400' : 'text-gray-400 hover:text-white'}`}
            title="Book info"
          >
            <Info className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* PDF Viewer */}
        <div className="flex-1">
          <PdfViewer
            pdfUrl={pdfUrl}
            initialPage={currentPage}
            onPageChange={saveProgress}
          />
        </div>

        {/* Bookmarks panel */}
        {showBookmarks && (
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-gray-800 border-l border-gray-700 overflow-y-auto z-10 md:relative">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h2 className="font-medium text-white">Bookmarks</h2>
              <button
                onClick={() => setShowBookmarks(false)}
                className="p-1 text-gray-400 hover:text-white md:hidden"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {book.bookmarks && book.bookmarks.length > 0 ? (
              <div className="p-2 space-y-1">
                {book.bookmarks.map((bookmark) => (
                  <button
                    key={bookmark.id}
                    onClick={() => setCurrentPage(bookmark.page)}
                    className="w-full p-3 text-left bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-white text-sm">
                        {bookmark.title || `Page ${bookmark.page}`}
                      </span>
                      <span className="text-xs text-gray-400">
                        p. {bookmark.page}
                      </span>
                    </div>
                    {bookmark.note && (
                      <p className="text-xs text-gray-400 mt-1 truncate">
                        {bookmark.note}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center">
                <Bookmark className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No bookmarks yet</p>
                <p className="text-xs text-gray-500 mt-1">
                  Press the bookmark button to add one
                </p>
              </div>
            )}
          </div>
        )}

        {/* Info panel */}
        {showInfo && (
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-gray-800 border-l border-gray-700 overflow-y-auto z-10 md:relative">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h2 className="font-medium text-white">Book Info</h2>
              <button
                onClick={() => setShowInfo(false)}
                className="p-1 text-gray-400 hover:text-white md:hidden"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              {book.coverUrl && (
                <img
                  src={book.coverUrl}
                  alt={book.title}
                  className="w-full aspect-[2/3] object-cover rounded-lg"
                />
              )}
              <div>
                <h3 className="font-medium text-white">{book.title}</h3>
                {book.author && (
                  <p className="text-sm text-gray-400">by {book.author}</p>
                )}
              </div>
              {book.description && (
                <p className="text-sm text-gray-300">{book.description}</p>
              )}
              <div className="text-sm text-gray-400 space-y-1">
                {book.pageCount && <p>Pages: {book.pageCount}</p>}
                {book.isbn && <p>ISBN: {book.isbn}</p>}
              </div>
              <Link
                to="/library/$bookId"
                params={{ bookId }}
                className="block w-full py-2 text-center bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                View Full Details
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
