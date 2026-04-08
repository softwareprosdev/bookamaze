import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        setIsAuthenticated(!!data.user)
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-72px)] bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <p style={{ color: 'white' }}>Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-72px)] bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
      <div className="text-center px-4">
        <h1 className="text-5xl font-bold text-white mb-4">
          Welcome to Bookamaze
        </h1>
        <p className="text-xl text-gray-300 mb-8">
          Your free PDF book library with cloud sync
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          {isAuthenticated ? (
            <a
              href="/dashboard"
              className="px-6 py-3 bg-cyan-500 text-white rounded-lg font-medium hover:bg-cyan-600 transition-colors"
            >
              Go to Dashboard
            </a>
          ) : (
            <>
              <a
                href="/login"
                className="px-6 py-3 bg-cyan-500 text-white rounded-lg font-medium hover:bg-cyan-600 transition-colors"
              >
                Login
              </a>
              <a
                href="/register"
                className="px-6 py-3 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors"
              >
                Register
              </a>
            </>
          )}
        </div>
        <div style={{ marginTop: '3rem', color: '#9ca3af', fontSize: '0.875rem' }}>
          <p>Features:</p>
          <ul style={{ listStyle: 'none', padding: 0, marginTop: '0.5rem' }}>
            <li>Upload PDFs or import from URLs</li>
            <li>Search Open Library and Internet Archive</li>
            <li>Read with progress sync across devices</li>
            <li>Share books with friends</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
