import { useState, useRef } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@workos-inc/authkit-react'
import {
  Upload,
  Link as LinkIcon,
  Search,
  ArrowLeft,
  Cloud,
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle,
  X,
} from 'lucide-react'
import { trpc } from '~/integrations/trpc/client'

export const Route = createFileRoute('/upload/')({
  component: UploadPage,
})

type UploadMethod = 'file' | 'url' | 'search'

function UploadPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, isLoading: authLoading, signIn } = useAuth()
  const [method, setMethod] = useState<UploadMethod>('file')
  const [error, setError] = useState<string | null>(null)

  // Get cloud connections
  const { data: connections, isLoading: connectionsLoading } = useQuery({
    queryKey: ['storage-connections'],
    queryFn: () => trpc.storage.connections.query(),
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
        <Upload className="w-16 h-16 text-cyan-400 mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Add a Book</h1>
        <p className="text-gray-400 mb-6 text-center">
          Sign in to add books to your library
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

  const hasConnections = connections && connections.length > 0

  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        {/* Back button */}
        <Link
          to="/library"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Library
        </Link>

        <h1 className="text-2xl font-bold text-white mb-6">Add a Book</h1>

        {/* No cloud storage connected */}
        {!connectionsLoading && !hasConnections && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-yellow-200 font-medium">
                  No cloud storage connected
                </p>
                <p className="text-yellow-200/80 text-sm mt-1">
                  Connect your Google Drive or Dropbox to store your books.
                </p>
                <Link
                  to="/settings/storage"
                  className="inline-flex items-center gap-2 text-yellow-400 hover:text-yellow-300 text-sm mt-2"
                >
                  <Cloud className="w-4 h-4" />
                  Connect Storage
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Method tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setMethod('file')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              method === 'file'
                ? 'bg-cyan-500 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            <Upload className="w-5 h-5" />
            Upload File
          </button>
          <button
            onClick={() => setMethod('url')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              method === 'url'
                ? 'bg-cyan-500 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            <LinkIcon className="w-5 h-5" />
            Import URL
          </button>
          <button
            onClick={() => setMethod('search')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              method === 'search'
                ? 'bg-cyan-500 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            <Search className="w-5 h-5" />
            Search
          </button>
        </div>

        {/* Error display */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <p className="text-red-200">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Upload methods */}
        <div className="bg-gray-800 rounded-xl p-6">
          {method === 'file' && (
            <FileUpload
              connections={connections ?? []}
              onError={setError}
              onSuccess={() => {
                queryClient.invalidateQueries({ queryKey: ['books'] })
                navigate({ to: '/library' })
              }}
            />
          )}
          {method === 'url' && (
            <UrlImport
              connections={connections ?? []}
              onError={setError}
              onSuccess={() => {
                queryClient.invalidateQueries({ queryKey: ['books'] })
                navigate({ to: '/library' })
              }}
            />
          )}
          {method === 'search' && (
            <div className="text-center py-8">
              <Search className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">
                Search for books in Open Library and Internet Archive
              </p>
              <Link
                to="/discover"
                className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-medium transition-colors mt-4"
              >
                Go to Discover
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface Connection {
  id: string
  provider: string
  accountEmail: string | null
}

interface FileUploadProps {
  connections: Connection[]
  onError: (error: string) => void
  onSuccess: () => void
}

function FileUpload({ connections, onError, onSuccess }: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedConnection, setSelectedConnection] = useState<string>(
    connections[0]?.id ?? ''
  )
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [uploading, setUploading] = useState(false)

  const addBookMutation = useMutation({
    mutationFn: (data: {
      title: string
      author?: string
      source: 'upload'
      cloudConnectionId: string
      cloudFileId: string
      fileSizeBytes?: number
    }) => trpc.books.add.mutate(data),
    onSuccess: () => {
      onSuccess()
    },
    onError: (err) => {
      onError(err.message)
    },
  })

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type !== 'application/pdf') {
        onError('Please select a PDF file')
        return
      }
      setSelectedFile(file)
      // Auto-fill title from filename
      if (!title) {
        setTitle(file.name.replace(/\.pdf$/i, ''))
      }
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !selectedConnection || !title) {
      onError('Please fill in all required fields')
      return
    }

    setUploading(true)
    try {
      // For now, create a placeholder - actual upload will be implemented with cloud integration
      // In production, this would:
      // 1. Get upload URL from backend
      // 2. Upload file directly to cloud storage
      // 3. Create book record with cloud file ID

      // Placeholder implementation
      addBookMutation.mutate({
        title,
        author: author || undefined,
        source: 'upload',
        cloudConnectionId: selectedConnection,
        cloudFileId: `placeholder-${Date.now()}`,
        fileSizeBytes: selectedFile.size,
      })
    } catch {
      onError('Failed to upload file')
    } finally {
      setUploading(false)
    }
  }

  if (connections.length === 0) {
    return (
      <div className="text-center py-8">
        <Cloud className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <p className="text-gray-400 mb-4">
          Connect a cloud storage account to upload books
        </p>
        <Link
          to="/settings/storage"
          className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-medium transition-colors"
        >
          Connect Storage
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* File drop zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-cyan-500 transition-colors"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileSelect}
          className="hidden"
        />
        {selectedFile ? (
          <div className="flex items-center justify-center gap-3">
            <FileText className="w-8 h-8 text-cyan-400" />
            <div className="text-left">
              <p className="text-white font-medium">{selectedFile.name}</p>
              <p className="text-sm text-gray-400">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setSelectedFile(null)
              }}
              className="p-1 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <>
            <Upload className="w-12 h-12 text-gray-500 mx-auto mb-3" />
            <p className="text-gray-300 mb-1">
              Drop your PDF here or click to browse
            </p>
            <p className="text-sm text-gray-500">Maximum file size: 100MB</p>
          </>
        )}
      </div>

      {/* Book details */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter book title"
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Author
          </label>
          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Enter author name"
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Storage Location *
          </label>
          <select
            value={selectedConnection}
            onChange={(e) => setSelectedConnection(e.target.value)}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
          >
            {connections.map((conn) => (
              <option key={conn.id} value={conn.id}>
                {conn.provider === 'google_drive' ? 'Google Drive' : 'Dropbox'}{' '}
                ({conn.accountEmail})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Upload button */}
      <button
        onClick={handleUpload}
        disabled={!selectedFile || !title || uploading}
        className="w-full py-3 bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
      >
        {uploading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="w-5 h-5" />
            Upload Book
          </>
        )}
      </button>
    </div>
  )
}

interface UrlImportProps {
  connections: Connection[]
  onError: (error: string) => void
  onSuccess: () => void
}

function UrlImport({ connections, onError, onSuccess }: UrlImportProps) {
  const [url, setUrl] = useState('')
  const [selectedConnection, setSelectedConnection] = useState<string>(
    connections[0]?.id ?? ''
  )
  const [title, setTitle] = useState('')
  const [importing, setImporting] = useState(false)

  const addBookMutation = useMutation({
    mutationFn: (data: {
      title: string
      source: 'url'
      sourceUrl: string
      cloudConnectionId: string
      cloudFileId: string
    }) => trpc.books.add.mutate(data),
    onSuccess: () => {
      onSuccess()
    },
    onError: (err) => {
      onError(err.message)
    },
  })

  const handleImport = async () => {
    if (!url || !selectedConnection || !title) {
      onError('Please fill in all required fields')
      return
    }

    if (!url.endsWith('.pdf') && !url.includes('pdf')) {
      onError('URL does not appear to be a PDF')
      return
    }

    setImporting(true)
    try {
      // In production, this would:
      // 1. Validate the URL
      // 2. Fetch the PDF
      // 3. Upload to cloud storage
      // 4. Create book record

      // Placeholder implementation
      addBookMutation.mutate({
        title,
        source: 'url',
        sourceUrl: url,
        cloudConnectionId: selectedConnection,
        cloudFileId: `url-import-${Date.now()}`,
      })
    } catch {
      onError('Failed to import from URL')
    } finally {
      setImporting(false)
    }
  }

  if (connections.length === 0) {
    return (
      <div className="text-center py-8">
        <Cloud className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <p className="text-gray-400 mb-4">
          Connect a cloud storage account to import books
        </p>
        <Link
          to="/settings/storage"
          className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-medium transition-colors"
        >
          Connect Storage
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          PDF URL *
        </label>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/book.pdf"
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Title *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter book title"
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Storage Location *
        </label>
        <select
          value={selectedConnection}
          onChange={(e) => setSelectedConnection(e.target.value)}
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
        >
          {connections.map((conn) => (
            <option key={conn.id} value={conn.id}>
              {conn.provider === 'google_drive' ? 'Google Drive' : 'Dropbox'} (
              {conn.accountEmail})
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={handleImport}
        disabled={!url || !title || importing}
        className="w-full py-3 bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
      >
        {importing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Importing...
          </>
        ) : (
          <>
            <LinkIcon className="w-5 h-5" />
            Import from URL
          </>
        )}
      </button>
    </div>
  )
}
