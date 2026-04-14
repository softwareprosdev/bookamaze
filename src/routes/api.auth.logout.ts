import { createFileRoute } from '@tanstack/react-router'
import { clearCookieHeader } from '~/lib/auth'

export const Route = createFileRoute('/api/auth/logout')({})

export async function POST() {
  const cookie = clearCookieHeader('bookamaze_session', '/')

  return new Response(
    JSON.stringify({ success: true }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': cookie,
      },
    }
  )
}
