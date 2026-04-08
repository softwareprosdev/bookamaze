import { createFileRoute } from '@tanstack/react-router'
import { createAPIFileRoute } from '@tanstack/react-start/server'
import { getDb } from '~/db'
import { users } from '~/db/schema'
import { eq } from 'drizzle-orm'
import { hashPassword } from '~/lib/password'
import { signJWT, getSessionCookieOptions, createCookieHeader } from '~/lib/auth'
import { randomUUID } from 'crypto'

export const Route = createAPIFileRoute('/api/auth/register')({
  POST: async ({ request }) => {
    try {
      const body = await request.json()
      const { email, password, displayName } = body

      if (!email || !password) {
        return new Response(
          JSON.stringify({ error: 'Email and password are required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      }

      if (password.length < 6) {
        return new Response(
          JSON.stringify({ error: 'Password must be at least 6 characters' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      }

      const db = getDb()
      
      // Check if user exists
      const existing = db.select().from(users).where(eq(users.email, email.toLowerCase())).get()
      if (existing) {
        return new Response(
          JSON.stringify({ error: 'Email already registered' }),
          { status: 409, headers: { 'Content-Type': 'application/json' } }
        )
      }

      // Create user
      const passwordHash = await hashPassword(password)
      const userId = randomUUID()
      
      db.insert(users).values({
        id: userId,
        email: email.toLowerCase(),
        passwordHash,
        displayName: displayName || email.split('@')[0],
        createdAt: new Date(),
      }).run()

      // Create session
      const token = await signJWT({ userId, email: email.toLowerCase() })
      const cookieOptions = getSessionCookieOptions()
      const cookie = createCookieHeader({ ...cookieOptions, value: token })

      return new Response(
        JSON.stringify({ 
          success: true, 
          user: { id: userId, email: email.toLowerCase(), displayName } 
        }),
        { 
          status: 201,
          headers: { 
            'Content-Type': 'application/json',
            'Set-Cookie': cookie,
          } 
        }
      )
    } catch (error) {
      console.error('Register error:', error)
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }
  },
})
