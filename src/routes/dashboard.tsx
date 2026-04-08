import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
  beforeLoad: async () => {
    // Check auth on client side
    if (typeof window !== 'undefined') {
      const res = await fetch('/api/auth/me')
      const data = await res.json()
      if (!data.user) {
        throw new Error('UNAUTHORIZED')
      }
    }
  },
})

interface User {
  id: string
  email: string
  displayName: string | null
  avatarUrl: string | null
}

function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user)
        } else {
          window.location.href = '/login'
        }
        setLoading(false)
      })
      .catch(() => {
        window.location.href = '/login'
        setLoading(false)
      })
  }, [])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Loading...</p>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      <nav style={{ backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', padding: '1rem 2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#0891b2' }}>Bookamaze</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ color: '#6b7280' }}>{user.email}</span>
            <button
              onClick={handleLogout}
              style={{ padding: '0.5rem 1rem', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main style={{ maxWidth: '1200px', margin: '2rem auto', padding: '0 2rem' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Welcome, {user.displayName || user.email}!</h2>
          <p style={{ color: '#6b7280', marginBottom: '2rem' }}>Your personal library is ready.</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
            <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>Upload PDF</h3>
              <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1rem' }}>
                Upload your PDF books to your personal library
              </p>
              <Link
                to="/upload"
                style={{ display: 'inline-block', padding: '0.5rem 1rem', backgroundColor: '#0891b2', color: 'white', borderRadius: '4px', textDecoration: 'none' }}
              >
                Get Started
              </Link>
            </div>

            <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>Discover Books</h3>
              <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1rem' }}>
                Search Open Library and Internet Archive
              </p>
              <Link
                to="/discover"
                style={{ display: 'inline-block', padding: '0.5rem 1rem', backgroundColor: '#0891b2', color: 'white', borderRadius: '4px', textDecoration: 'none' }}
              >
                Browse
              </Link>
            </div>

            <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>My Library</h3>
              <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1rem' }}>
                View and manage your saved books
              </p>
              <Link
                to="/library"
                style={{ display: 'inline-block', padding: '0.5rem 1rem', backgroundColor: '#0891b2', color: 'white', borderRadius: '4px', textDecoration: 'none' }}
              >
                Open Library
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
