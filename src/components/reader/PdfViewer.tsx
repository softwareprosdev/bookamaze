import { useState, useEffect, useRef, useCallback } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize,
  Loader2,
} from 'lucide-react'

interface PdfViewerProps {
  pdfUrl: string
  initialPage?: number
  onPageChange?: (page: number, totalPages: number) => void
  onError?: (error: string) => void
}

export function PdfViewer({
  pdfUrl,
  initialPage = 1,
  onPageChange,
  onError,
}: PdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [pdf, setPdf] = useState<unknown>(null)
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [totalPages, setTotalPages] = useState(0)
  const [scale, setScale] = useState(1.0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Load PDF.js dynamically
  useEffect(() => {
    const loadPdfJs = async () => {
      try {
        // @ts-expect-error - pdfjs-dist types
        const pdfjs = await import('pdfjs-dist')

        // Set worker source
        pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`

        setIsLoading(true)
        setError(null)

        const loadingTask = pdfjs.getDocument(pdfUrl)
        const pdfDoc = await loadingTask.promise

        setPdf(pdfDoc)
        setTotalPages(pdfDoc.numPages)
        setIsLoading(false)
      } catch (err) {
        console.error('Failed to load PDF:', err)
        setError('Failed to load PDF')
        setIsLoading(false)
        onError?.('Failed to load PDF')
      }
    }

    loadPdfJs()
  }, [pdfUrl, onError])

  // Render current page
  useEffect(() => {
    const renderPage = async () => {
      if (!pdf || !canvasRef.current) return

      try {
        // @ts-expect-error - pdfjs types
        const page = await pdf.getPage(currentPage)
        const canvas = canvasRef.current
        const context = canvas.getContext('2d')

        if (!context) return

        const viewport = page.getViewport({ scale })

        canvas.height = viewport.height
        canvas.width = viewport.width

        await page.render({
          canvasContext: context,
          viewport,
        }).promise

        onPageChange?.(currentPage, totalPages)
      } catch (err) {
        console.error('Failed to render page:', err)
      }
    }

    renderPage()
  }, [pdf, currentPage, scale, totalPages, onPageChange])

  // Fit to width on initial load
  useEffect(() => {
    const fitToWidth = async () => {
      if (!pdf || !containerRef.current) return

      try {
        // @ts-expect-error - pdfjs types
        const page = await pdf.getPage(1)
        const viewport = page.getViewport({ scale: 1 })
        const containerWidth = containerRef.current.clientWidth - 48 // padding
        const newScale = containerWidth / viewport.width

        setScale(Math.min(newScale, 2)) // Max scale of 2
      } catch {
        // Ignore error
      }
    }

    if (pdf) {
      fitToWidth()
    }
  }, [pdf])

  const goToPreviousPage = useCallback(() => {
    setCurrentPage((p) => Math.max(1, p - 1))
  }, [])

  const goToNextPage = useCallback(() => {
    setCurrentPage((p) => Math.min(totalPages, p + 1))
  }, [totalPages])

  const zoomIn = useCallback(() => {
    setScale((s) => Math.min(s + 0.25, 3))
  }, [])

  const zoomOut = useCallback(() => {
    setScale((s) => Math.max(s - 0.25, 0.5))
  }, [])

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }, [])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault()
        goToPreviousPage()
      } else if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault()
        goToNextPage()
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault()
        zoomIn()
      } else if (e.key === '-') {
        e.preventDefault()
        zoomOut()
      } else if (e.key === 'f') {
        e.preventDefault()
        toggleFullscreen()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [goToPreviousPage, goToNextPage, zoomIn, zoomOut, toggleFullscreen])

  // Handle fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () =>
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={`flex flex-col h-full bg-gray-900 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        {/* Page navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={goToPreviousPage}
            disabled={currentPage <= 1}
            className="p-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Previous page (←)"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={totalPages}
              value={currentPage}
              onChange={(e) => {
                const page = parseInt(e.target.value)
                if (page >= 1 && page <= totalPages) {
                  setCurrentPage(page)
                }
              }}
              className="w-16 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-center text-sm"
            />
            <span className="text-gray-400">/ {totalPages}</span>
          </div>
          <button
            onClick={goToNextPage}
            disabled={currentPage >= totalPages}
            className="p-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Next page (→)"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={zoomOut}
            disabled={scale <= 0.5}
            className="p-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Zoom out (-)"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <span className="text-sm text-gray-300 min-w-[4rem] text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={zoomIn}
            disabled={scale >= 3}
            className="p-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Zoom in (+)"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2 text-gray-400 hover:text-white transition-colors ml-2"
            title="Fullscreen (F)"
          >
            <Maximize className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* PDF Canvas */}
      <div className="flex-1 overflow-auto p-6 flex items-start justify-center">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            className="shadow-2xl"
            style={{ maxWidth: '100%', height: 'auto' }}
          />
        )}
      </div>

      {/* Mobile navigation */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-gray-800 border-t border-gray-700">
        <button
          onClick={goToPreviousPage}
          disabled={currentPage <= 1}
          className="px-6 py-2 bg-gray-700 text-white rounded-lg disabled:opacity-50"
        >
          Previous
        </button>
        <span className="text-gray-300">
          {currentPage} / {totalPages}
        </span>
        <button
          onClick={goToNextPage}
          disabled={currentPage >= totalPages}
          className="px-6 py-2 bg-gray-700 text-white rounded-lg disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  )
}
