import { createFileRoute } from '@tanstack/react-router'
import { createAPIFileRoute } from '@tanstack/react-start/server'
import { getDb } from '~/db'
import { users } from '~/db/schema'
import { eq } from 'drizzle-orm'
import { verifyPassword } from '~/lib/password'
import { signJWT, getSessionCookieOptions, createCookieHeader } from '~/lib/auth'

export const Route = createAPIFileRoute('/api/auth/login')({
  POST: async ({ request }) => {
    try {
      const body = await request.json()
      const { email, password } = body

      if (!email || !password) {
        return new Response(
          JSON.stringify({ error: 'Email and password are required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      }

      const db = getDb()
      
      // Find user
      const user = db.select().from(users).where(eq(users.email, email.toLowerCase())).get()
      if (!user) {
        return new Response(
          JSON.stringify({ error: 'Invalid email or password' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        )
      }

      // Verify password
      const valid = await verifyPassword(password, user.passwordHash)
      if (!valid) {
        return new Response(
          JSON.stringify({ error: 'Invalid email or password' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        )
      }

      // Create session
      const token = await signJWT({ userId: user.id, email: user.email })
      const cookieOptions = getSessionCookieOptions()
      const cookie = createCookieHeader({ ...cookieOptions, value: token })

      return new Response(
        JSON.stringify({ 
          success: true, 
          user: { 
            id: user.id, 
            email: user.email, 
            displayName: user.displayName,
            avatarUrl: user.avatarUrl,
          } 
        }),
        { 
          status: 200,
          headers: { 
            'Content-Type': 'application/json',
            'Set-Cookie': cookie,
          } 
        }
      )
    } catch (error) {
      console.error('Login error:', error)
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }
  },
})
