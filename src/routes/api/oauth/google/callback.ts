import { createFileRoute } from '@tanstack/react-router'
import { db } from '~/db'
import { cloudConnections } from '~/db/schema'
import {
  exchangeGoogleCode,
  getGoogleUserInfo,
  getOrCreateBookamazeFolder,
} from '~/integrations/cloud/google-drive'

interface OAuthState {
  userId: string
  provider: string
}

async function handler({ request }: { request: Request }) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const error = url.searchParams.get('error')

  // Handle OAuth errors
  if (error) {
    return new Response(null, {
      status: 302,
      headers: {
        Location: `/settings/storage?error=${encodeURIComponent(error)}`,
      },
    })
  }

  if (!code || !state) {
    return new Response(null, {
      status: 302,
      headers: {
        Location: '/settings/storage?error=missing_params',
      },
    })
  }

  try {
    // Decode state
    const stateData: OAuthState = JSON.parse(
      Buffer.from(state, 'base64').toString()
    )

    const baseUrl = process.env.VITE_APP_URL ?? 'http://localhost:3000'
    const redirectUri = `${baseUrl}/api/oauth/google/callback`

    // Exchange code for tokens
    const tokens = await exchangeGoogleCode(code, redirectUri)

    // Get user info from Google
    const userInfo = await getGoogleUserInfo(tokens.access_token)

    // Create Bookamaze folder in user's Drive
    const folderId = await getOrCreateBookamazeFolder(tokens.access_token)

    // Calculate token expiry
    const tokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000)

    // Save connection to database
    await db.insert(cloudConnections).values({
      userId: stateData.userId,
      provider: 'google_drive',
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      tokenExpiresAt,
      accountEmail: userInfo.email,
      accountId: userInfo.id,
      rootFolderId: folderId,
      isActive: true,
    })

    // Redirect to settings page with success
    return new Response(null, {
      status: 302,
      headers: {
        Location: '/settings/storage?success=google_connected',
      },
    })
  } catch (err) {
    console.error('Google OAuth error:', err)
    return new Response(null, {
      status: 302,
      headers: {
        Location: `/settings/storage?error=${encodeURIComponent('connection_failed')}`,
      },
    })
  }
}

export const Route = createFileRoute('/api/oauth/google/callback')({
  // @ts-expect-error server property not in route types yet
  server: {
    handlers: {
      GET: handler,
    },
  },
})
