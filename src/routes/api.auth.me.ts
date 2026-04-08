import { createFileRoute } from '@tanstack/react-router'
import { createAPIFileRoute } from '@tanstack/react-start/server'
import { getDb } from '~/db'
import { verifyJWT, parseCookies } from '~/lib/auth'

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
        const clearCookie = `bookamaze_session=; Path=/; Max-Age=0; SameSite=lax`
        return new Response(
          JSON.stringify({ user: null }),
          { 
            status: 200, 
            headers: { 
              'Content-Type': 'application/json',
              'Set-Cookie': clearCookie,
            } 
          }
        )
      }

      const db = await getDb()
      const result = db.exec(`SELECT id, email, display_name, avatar_url FROM users WHERE id = '${payload.userId}'`)

      if (result.length === 0 || result[0].values.length === 0) {
        const clearCookie = `bookamaze_session=; Path=/; Max-Age=0; SameSite=lax`
        return new Response(
          JSON.stringify({ user: null }),
          { 
            status: 200, 
            headers: { 
              'Content-Type': 'application/json',
              'Set-Cookie': clearCookie,
            } 
          }
        )
      }

      const row = result[0].values[0]

      return new Response(
        JSON.stringify({ 
          user: { 
            id: row[0] as string, 
            email: row[1] as string, 
            displayName: row[2] as string | null,
            avatarUrl: row[3] as string | null,
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
