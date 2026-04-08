import { createFileRoute } from '@tanstack/react-router'
import { createAPIFileRoute } from '@tanstack/react-start/server'
import { getDb, saveDb } from '~/db'
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

      const db = await getDb()
      const lowerEmail = email.toLowerCase()
      
      const existing = db.exec(`SELECT id FROM users WHERE email = '${lowerEmail}'`)
      if (existing.length > 0 && existing[0].values.length > 0) {
        return new Response(
          JSON.stringify({ error: 'Email already registered' }),
          { status: 409, headers: { 'Content-Type': 'application/json' } }
        )
      }

      const passwordHash = await hashPassword(password)
      const userId = randomUUID()
      const display = displayName || email.split('@')[0]
      const createdAt = Date.now()
      
      db.run(
        `INSERT INTO users (id, email, password_hash, display_name, created_at) VALUES (?, ?, ?, ?, ?)`,
        [userId, lowerEmail, passwordHash, display, createdAt]
      )
      
      saveDb()

      const token = await signJWT({ userId, email: lowerEmail })
      const cookieOptions = getSessionCookieOptions()
      const cookie = createCookieHeader({ ...cookieOptions, value: token })

      return new Response(
        JSON.stringify({ 
          success: true, 
          user: { id: userId, email: lowerEmail, displayName: display } 
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
