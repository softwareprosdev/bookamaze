import { clearCookieHeader } from '~/lib/auth'

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
