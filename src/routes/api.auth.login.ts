import { createFileRoute } from '@tanstack/react-router'
import { createAPIFileRoute } from '@tanstack/react-start/server'
import { getDb } from '~/db'
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

      const db = await getDb()
      const lowerEmail = email.toLowerCase()
      
      const result = db.exec(`SELECT id, email, password_hash, display_name, avatar_url FROM users WHERE email = '${lowerEmail}'`)
      if (result.length === 0 || result[0].values.length === 0) {
        return new Response(
          JSON.stringify({ error: 'Invalid email or password' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        )
      }

      const row = result[0].values[0]
      const userId = row[0] as string
      const userEmail = row[1] as string
      const passwordHash = row[2] as string
      const displayName = row[3] as string | null
      const avatarUrl = row[4] as string | null

      const valid = await verifyPassword(password, passwordHash)
      if (!valid) {
        return new Response(
          JSON.stringify({ error: 'Invalid email or password' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        )
      }

      const token = await signJWT({ userId, email: userEmail })
      const cookieOptions = getSessionCookieOptions()
      const cookie = createCookieHeader({ ...cookieOptions, value: token })

      return new Response(
        JSON.stringify({ 
          success: true, 
          user: { 
            id: userId, 
            email: userEmail, 
            displayName,
            avatarUrl,
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
