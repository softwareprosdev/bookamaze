import React, { Component, ReactNode } from 'react'
import * as Sentry from '@sentry/react'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

class ErrorBoundary extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
    })
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-red-400 mb-4">
              Oops! Something went wrong
            </h1>
            <p className="text-gray-300 mb-6">
              Please refresh the page or try again later.
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-medium"
            >
              Go Home
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Wrap app with Sentry
const SentryErrorBoundary = Sentry.withErrorBoundary(ErrorBoundary, {
  fallback: <div>Error occurred</div>,
  showDialog: false,
})

export { ErrorBoundary, SentryErrorBoundary }