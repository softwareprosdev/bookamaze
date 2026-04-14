import { createServerEntry } from '@tanstack/react-start/server-entry'
import { createStartHandler, defaultStreamHandler } from '@tanstack/react-start/server'
import { randomUUID } from 'crypto'
import { getDb, saveDb } from '~/db'
import {
  clearCookieHeader,
  createCookieHeader,
  getSessionCookieOptions,
  parseCookies,
  signJWT,
  verifyJWT,
} from '~/lib/auth'
import { hashPassword, verifyPassword } from '~/lib/password'

const appFetch = createStartHandler(defaultStreamHandler)

function json(body: unknown, init?: globalThis.ResponseInit) {
  return new globalThis.Response(JSON.stringify(body), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })
}

function toOpenLibraryCover(coverId: number | undefined): string | null {
  if (!coverId) return null
  return `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`
}

function toOpenLibraryReadUrl(editionKeys: unknown): string | null {
  if (!Array.isArray(editionKeys) || editionKeys.length === 0) return null
  const first = editionKeys[0]
  if (typeof first !== 'string') return null
  return `https://openlibrary.org/books/${first}`
}

async function handleAuthApi(request: globalThis.Request): Promise<globalThis.Response | null> {
  const url = new globalThis.URL(request.url)
  const { pathname } = url
  const method = request.method.toUpperCase()

  if (pathname === '/api/auth/register' && method === 'POST') {
    try {
      const body = (await request.json()) as {
        email?: string
        password?: string
        displayName?: string
      }
      const { email, password, displayName } = body

      if (!email || !password) return json({ error: 'Email and password are required' }, { status: 400 })
      if (password.length < 6) return json({ error: 'Password must be at least 6 characters' }, { status: 400 })

      const db = await getDb()
      const lowerEmail = email.toLowerCase()
      const existingStmt = db.prepare('SELECT id FROM users WHERE email = ?')
      existingStmt.bind([lowerEmail])
      const alreadyRegistered = existingStmt.step()
      existingStmt.free()
      if (alreadyRegistered) return json({ error: 'Email already registered' }, { status: 409 })

      const userId = randomUUID()
      const passwordHash = await hashPassword(password)
      const display = displayName || email.split('@')[0] || email
      db.run(
        `INSERT INTO users (id, email, password_hash, display_name, created_at) VALUES (?, ?, ?, ?, ?)`,
        [userId, lowerEmail, passwordHash, display, Date.now()]
      )
      saveDb()

      const token = await signJWT({ userId, email: lowerEmail })
      const cookie = createCookieHeader({ ...getSessionCookieOptions(), value: token })
      return json(
        { success: true, user: { id: userId, email: lowerEmail, displayName: display } },
        { status: 201, headers: { 'Set-Cookie': cookie } }
      )
    } catch {
      return json({ error: 'Internal server error' }, { status: 500 })
    }
  }

  if (pathname === '/api/auth/login' && method === 'POST') {
    try {
      const body = (await request.json()) as { email?: string; password?: string }
      const { email, password } = body
      if (!email || !password) return json({ error: 'Email and password are required' }, { status: 400 })

      const db = await getDb()
      const stmt = db.prepare('SELECT id, email, password_hash, display_name, avatar_url FROM users WHERE email = ?')
      stmt.bind([email.toLowerCase()])
      if (!stmt.step()) {
        stmt.free()
        return json({ error: 'Invalid email or password' }, { status: 401 })
      }

      const row = stmt.getAsObject() as Record<string, unknown>
      stmt.free()
      const valid = await verifyPassword(password, row.password_hash as string)
      if (!valid) return json({ error: 'Invalid email or password' }, { status: 401 })

      const userId = row.id as string
      const userEmail = row.email as string
      const token = await signJWT({ userId, email: userEmail })
      const cookie = createCookieHeader({ ...getSessionCookieOptions(), value: token })
      return json(
        {
          success: true,
          user: {
            id: userId,
            email: userEmail,
            displayName: (row.display_name as string) ?? null,
            avatarUrl: (row.avatar_url as string) ?? null,
          },
        },
        { status: 200, headers: { 'Set-Cookie': cookie } }
      )
    } catch {
      return json({ error: 'Internal server error' }, { status: 500 })
    }
  }

  if (pathname === '/api/auth/me' && method === 'GET') {
    try {
      const token = parseCookies(request.headers.get('cookie'))['bookamaze_session']
      if (!token) return json({ user: null }, { status: 200 })

      const payload = await verifyJWT(token)
      if (!payload) {
        return json(
          { user: null },
          { status: 200, headers: { 'Set-Cookie': clearCookieHeader('bookamaze_session', '/') } }
        )
      }

      const db = await getDb()
      const stmt = db.prepare('SELECT id, email, display_name, avatar_url FROM users WHERE id = ?')
      stmt.bind([payload.userId])
      if (!stmt.step()) {
        stmt.free()
        return json(
          { user: null },
          { status: 200, headers: { 'Set-Cookie': clearCookieHeader('bookamaze_session', '/') } }
        )
      }

      const row = stmt.getAsObject() as Record<string, unknown>
      stmt.free()
      return json(
        {
          user: {
            id: row.id as string,
            email: row.email as string,
            displayName: (row.display_name as string) ?? null,
            avatarUrl: (row.avatar_url as string) ?? null,
          },
        },
        { status: 200 }
      )
    } catch {
      return json({ user: null }, { status: 200 })
    }
  }

  if (pathname === '/api/auth/logout' && method === 'POST') {
    return json(
      { success: true },
      { status: 200, headers: { 'Set-Cookie': clearCookieHeader('bookamaze_session', '/') } }
    )
  }

  if (pathname === '/api/books/search' && method === 'GET') {
    const query = (url.searchParams.get('q') || '').trim()
    const limit = Math.min(Number(url.searchParams.get('limit') || '20') || 20, 40)

    if (!query) {
      return json({ books: [] }, { status: 200 })
    }

    try {
      const openLibraryUrl = new globalThis.URL('https://openlibrary.org/search.json')
      openLibraryUrl.searchParams.set('q', query)
      openLibraryUrl.searchParams.set('limit', String(limit))

      const response = await globalThis.fetch(openLibraryUrl.toString())
      if (!response.ok) {
        return json({ error: 'Failed to fetch books' }, { status: 502 })
      }

      const data = (await response.json()) as {
        docs?: Array<Record<string, unknown>>
      }

      const books = (data.docs || []).map((doc) => {
        const key = typeof doc.key === 'string' ? doc.key : ''
        const id = key || `ol:${String(doc.cover_edition_key || doc.cover_i || Math.random())}`
        const title = typeof doc.title === 'string' ? doc.title : 'Untitled'
        const authors = Array.isArray(doc.author_name)
          ? doc.author_name.filter((item): item is string => typeof item === 'string')
          : []
        const year = typeof doc.first_publish_year === 'number' ? doc.first_publish_year : null
        const coverId = typeof doc.cover_i === 'number' ? doc.cover_i : undefined
        const openLibraryPath = key ? `https://openlibrary.org${key}` : 'https://openlibrary.org'

        return {
          id,
          title,
          author: authors.length > 0 ? authors.slice(0, 2).join(', ') : 'Unknown author',
          year,
          source: 'openlibrary',
          coverUrl: toOpenLibraryCover(coverId),
          openLibraryUrl: openLibraryPath,
          readUrl: toOpenLibraryReadUrl(doc.edition_key),
          description: null,
        }
      })

      return json({ books }, { status: 200 })
    } catch {
      return json({ error: 'Book search failed' }, { status: 500 })
    }
  }

  return null
}

const fetch = async (request: globalThis.Request) => {
  const authResponse = await handleAuthApi(request)
  if (authResponse) return authResponse
  return appFetch(request)
}

export default createServerEntry({ fetch })