import { getDb } from '~/db'
import { createCookieHeader, getSessionCookieOptions, signJWT } from '~/lib/auth'
import { verifyPassword } from '~/lib/password'

export async function POST({ request }: { request: Request }) {
  try {
      const body = (await request.json()) as {
        email?: string
        password?: string
      }
      const { email, password } = body

      if (!email || !password) {
        return new Response(
          JSON.stringify({ error: 'Email and password are required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      }

      const db = await getDb()
      const lowerEmail = email.toLowerCase()

      const stmt = db.prepare(
        'SELECT id, email, password_hash, display_name, avatar_url FROM users WHERE email = ?'
      )
      stmt.bind([lowerEmail])

      if (!stmt.step()) {
        stmt.free()
        return new Response(
          JSON.stringify({ error: 'Invalid email or password' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        )
      }

      const row = stmt.getAsObject() as Record<string, unknown>
      stmt.free()

      const userId = row.id as string
      const userEmail = row.email as string
      const passwordHash = row.password_hash as string
      const displayName = (row.display_name as string) ?? null
      const avatarUrl = (row.avatar_url as string) ?? null

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
}
