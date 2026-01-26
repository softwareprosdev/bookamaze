import { createFileRoute, useSearch } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@workos-inc/authkit-react'
import {
  Cloud,
  Plus,
  Trash2,
  Loader2,
  CheckCircle,
  AlertCircle,
  X,
} from 'lucide-react'
import { trpc } from '~/integrations/trpc/client'

export const Route = createFileRoute('/settings/storage')({
  component: StorageSettingsPage,
})

function StorageSettingsPage() {
  const queryClient = useQueryClient()
  const { user, isLoading: authLoading, signIn } = useAuth()
  const searchParams = useSearch({ from: '/settings/storage' }) as {
    success?: string
    error?: string
  }

  const {
    data: connections,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['storage-connections'],
    queryFn: () => trpc.storage.connections.query(),
    enabled: !!user,
  })

  const connectMutation = useMutation({
    mutationFn: (provider: 'google_drive' | 'dropbox') =>
      trpc.storage.connect.mutate({ provider }),
    onSuccess: (data) => {
      // Redirect to OAuth URL
      window.location.href = data.authUrl
    },
  })

  const disconnectMutation = useMutation({
    mutationFn: (connectionId: string) =>
      trpc.storage.disconnect.mutate({ connectionId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storage-connections'] })
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
        <Cloud className="w-16 h-16 text-cyan-400 mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Cloud Storage</h1>
        <p className="text-gray-400 mb-6 text-center">
          Sign in to manage your cloud storage connections
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

  const getProviderIcon = (provider: string) => {
    // Simple provider icons - in production use actual brand icons
    if (provider === 'google_drive') {
      return (
        <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
          <span className="text-blue-400 font-bold">G</span>
        </div>
      )
    }
    return (
      <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
        <span className="text-blue-400 font-bold">D</span>
      </div>
    )
  }

  const getProviderName = (provider: string) => {
    return provider === 'google_drive' ? 'Google Drive' : 'Dropbox'
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-2">Cloud Storage</h1>
        <p className="text-gray-400 mb-6">
          Connect your cloud storage accounts to store and sync your books
        </p>

        {/* Success/Error messages */}
        {searchParams.success && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <p className="text-green-200">
                {searchParams.success === 'google_connected'
                  ? 'Google Drive connected successfully!'
                  : searchParams.success === 'dropbox_connected'
                    ? 'Dropbox connected successfully!'
                    : 'Account connected successfully!'}
              </p>
            </div>
          </div>
        )}

        {searchParams.error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-red-200">
                {searchParams.error === 'connection_failed'
                  ? 'Failed to connect. Please try again.'
                  : searchParams.error}
              </p>
            </div>
          </div>
        )}

        {/* Connected accounts */}
        <div className="bg-gray-800 rounded-xl overflow-hidden mb-6">
          <div className="p-4 border-b border-gray-700">
            <h2 className="font-medium text-white">Connected Accounts</h2>
          </div>
          <div className="p-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
              </div>
            ) : error ? (
              <p className="text-red-400 text-center py-4">
                Failed to load connections
              </p>
            ) : connections?.length === 0 ? (
              <div className="text-center py-8">
                <Cloud className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No accounts connected</p>
                <p className="text-sm text-gray-500 mt-1">
                  Connect a cloud storage account to get started
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {connections?.map((conn) => (
                  <div
                    key={conn.id}
                    className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {getProviderIcon(conn.provider)}
                      <div>
                        <p className="font-medium text-white">
                          {getProviderName(conn.provider)}
                        </p>
                        <p className="text-sm text-gray-400">
                          {conn.accountEmail}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => disconnectMutation.mutate(conn.id)}
                      disabled={disconnectMutation.isPending}
                      className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                      title="Disconnect"
                    >
                      {disconnectMutation.isPending ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Trash2 className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Add new connection */}
        <div className="bg-gray-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-gray-700">
            <h2 className="font-medium text-white">Add Connection</h2>
          </div>
          <div className="p-4 space-y-3">
            <button
              onClick={() => connectMutation.mutate('google_drive')}
              disabled={connectMutation.isPending}
              className="w-full flex items-center justify-between p-4 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                {getProviderIcon('google_drive')}
                <div className="text-left">
                  <p className="font-medium text-white">Google Drive</p>
                  <p className="text-sm text-gray-400">
                    Store books in your Google Drive
                  </p>
                </div>
              </div>
              {connectMutation.isPending &&
              connectMutation.variables === 'google_drive' ? (
                <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
              ) : (
                <Plus className="w-5 h-5 text-gray-400" />
              )}
            </button>

            <button
              onClick={() => connectMutation.mutate('dropbox')}
              disabled={connectMutation.isPending}
              className="w-full flex items-center justify-between p-4 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                {getProviderIcon('dropbox')}
                <div className="text-left">
                  <p className="font-medium text-white">Dropbox</p>
                  <p className="text-sm text-gray-400">
                    Store books in your Dropbox
                  </p>
                </div>
              </div>
              {connectMutation.isPending &&
              connectMutation.variables === 'dropbox' ? (
                <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
              ) : (
                <Plus className="w-5 h-5 text-gray-400" />
              )}
            </button>
          </div>
        </div>

        {connectMutation.error && (
          <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-red-200">{connectMutation.error.message}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
