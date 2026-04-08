import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@workos-inc/authkit-react'
import {
  Share2,
  Trash2,
  Loader2,
  Calendar,
  Mail,
} from 'lucide-react'
import { trpc } from '~/integrations/trpc/client'

export const Route = createFileRoute('/settings/shares')({
  component: SharesSettingsPage,
})

function SharesSettingsPage() {
  const queryClient = useQueryClient()
  const { user, isLoading: authLoading, signIn } = useAuth()

  const {
    data: sharedBooks,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['shared-books'],
    queryFn: () => trpc.books.getSharedBooks.query(),
    enabled: !!user,
  })

  const revokeMutation = useMutation({
    mutationFn: (shareId: string) =>
      trpc.books.revokeShare.mutate({ shareId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shared-books'] })
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
        <Share2 className="w-16 h-16 text-cyan-400 mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Sign In Required</h1>
        <p className="text-gray-400 text-center mb-6">
          Please sign in to manage your shared books.
        </p>
        <button
          onClick={() => signIn()}
          className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-medium"
        >
          Sign In
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Shared Books</h1>
          <p className="text-gray-400">
            Manage books you've shared with others. All sharing is free and helps spread knowledge.
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-400">Failed to load shared books</p>
          </div>
        ) : !sharedBooks || sharedBooks.length === 0 ? (
          <div className="text-center py-12">
            <Share2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">
              No Shared Books
            </h2>
            <p className="text-gray-400 mb-6">
              You haven't shared any books yet. Share books from your library to help others discover great reads.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sharedBooks.map((share) => (
              <div
                key={share.id}
                className="bg-gray-800 rounded-lg p-6 border border-gray-700"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {share.book.title}
                    </h3>
                    {share.book.author && (
                      <p className="text-gray-400 mb-2">{share.book.author}</p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <div className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        {share.sharedWithUser.displayName || share.sharedWithUser.email}
                        {share.sharedWithUser.displayName && (
                          <span className="text-gray-500">({share.sharedWithUser.email})</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(share.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="mt-2 text-sm text-gray-500">
                      Permissions: Read access
                      {share.permissions.canDownload && ' • Download allowed'}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        if (confirm('Revoke this share? The recipient will no longer be able to access the book.')) {
                          revokeMutation.mutate(share.id)
                        }
                      }}
                      className="p-2 text-red-400 hover:text-red-300 transition-colors"
                      title="Revoke share"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}