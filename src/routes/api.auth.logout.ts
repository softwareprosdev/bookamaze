import { createAPIFileRoute } from '@tanstack/react-start/server'
import { clearCookieHeader } from '~/lib/auth'

export const Route = createAPIFileRoute('/api/auth/logout')({
  POST: async () => {
    const cookie = clearCookieHeader('bookamaze_session', '/')
    
    return new Response(
      JSON.stringify({ success: true }),
      { 
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Set-Cookie': cookie,
        } 
      }
    )
  },
})
