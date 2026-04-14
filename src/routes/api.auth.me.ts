import { createAPIFileRoute } from '@tanstack/react-start/api'
import { getDb } from '~/db'
import { clearCookieHeader, parseCookies, verifyJWT } from '~/lib/auth'

export const Route = createAPIFileRoute('/api/auth/me')({
  GET: async ({ request }) => {
    try {
      const cookieHeader = request.headers.get('cookie')
      const cookies = parseCookies(cookieHeader)
      const token = cookies['bookamaze_session']

      if (!token) {
        return new Response(
          JSON.stringify({ user: null }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      }

      const payload = await verifyJWT(token)
      if (!payload) {
        return new Response(
          JSON.stringify({ user: null }),
          { 
            status: 200, 
            headers: { 
              'Content-Type': 'application/json',
              'Set-Cookie': clearCookieHeader('bookamaze_session', '/'),
            } 
          } 
        )
      }

      const db = await getDb()
      const stmt = db.prepare(
        'SELECT id, email, display_name, avatar_url FROM users WHERE id = ?'
      )
      stmt.bind([payload.userId])

      if (!stmt.step()) {
        stmt.free()
        return new Response(
          JSON.stringify({ user: null }),
          { 
            status: 200, 
            headers: { 
              'Content-Type': 'application/json',
              'Set-Cookie': clearCookieHeader('bookamaze_session', '/'),
            } 
          } 
        )
      }

      const row = stmt.getAsObject() as Record<string, unknown>
      stmt.free()

      return new Response(
        JSON.stringify({ 
          user: { 
            id: row.id as string, 
            email: row.email as string, 
            displayName: (row.display_name as string) ?? null,
            avatarUrl: (row.avatar_url as string) ?? null,
          }
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    } catch (error) {
      console.error('Me error:', error)
      return new Response(
        JSON.stringify({ user: null }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }
  },
})
