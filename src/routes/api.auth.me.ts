import { createFileRoute } from '@tanstack/react-router'
import { createAPIFileRoute } from '@tanstack/react-start/server'
import { getDb } from '~/db'
import { users } from '~/db/schema'
import { eq } from 'drizzle-orm'
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
      const user = db.select().from(users).where(eq(users.id, payload.userId)).get()

      if (!user) {
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

      return new Response(
        JSON.stringify({ 
          user: { 
            id: user.id, 
            email: user.email, 
            displayName: user.displayName,
            avatarUrl: user.avatarUrl,
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
