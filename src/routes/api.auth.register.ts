import { randomUUID } from 'crypto'
import { createFileRoute } from '@tanstack/react-router'
import { getDb, saveDb } from '~/db'
import { createCookieHeader, getSessionCookieOptions, signJWT } from '~/lib/auth'
import { hashPassword } from '~/lib/password'

export const Route = createFileRoute('/api/auth/register')({})

export async function POST({ request }: { request: globalThis.Request }) {
  try {
      const body = (await request.json()) as {
        email?: string
        password?: string
        displayName?: string
      }
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

      const existingStmt = db.prepare('SELECT id FROM users WHERE email = ?')
      existingStmt.bind([lowerEmail])
      const alreadyRegistered = existingStmt.step()
      existingStmt.free()

      if (alreadyRegistered) {
        return new Response(
          JSON.stringify({ error: 'Email already registered' }),
          { status: 409, headers: { 'Content-Type': 'application/json' } }
        )
      }

      const passwordHash = await hashPassword(password)
      const userId = randomUUID()
      const display = displayName || email.split('@')[0] || email
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
}
