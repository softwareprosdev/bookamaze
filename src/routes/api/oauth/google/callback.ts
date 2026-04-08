import { createFileRoute } from '@tanstack/react-router'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '~/db'
import { cloudConnections, users } from '~/db/schema'
import { serverConfig } from '~/config'
import { encryptToken } from '~/utils/crypto'
import {
  exchangeGoogleCode,
  getGoogleUserInfo,
  getOrCreateBookamazeFolder,
} from '~/integrations/cloud/google-drive'

const OAuthStateSchema = z.object({
  userId: z.string().uuid(),
  provider: z.enum(['google_drive', 'dropbox']),
})

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
    // Parse and validate state
    let stateData: z.infer<typeof OAuthStateSchema>
    try {
      const decoded = JSON.parse(Buffer.from(state, 'base64').toString())
      stateData = OAuthStateSchema.parse(decoded)
    } catch (err) {
      if (err instanceof z.ZodError) {
        console.error('Invalid OAuth state schema:', err.errors)
      } else {
        console.error('Failed to decode OAuth state:', err)
      }
      return new Response(null, {
        status: 302,
        headers: {
          Location: '/settings/storage?error=invalid_state',
        },
      })
    }

    // Verify user exists and hasn't been deleted
    const user = await db.query.users.findFirst({
      where: eq(users.id, stateData.userId),
    })

    if (!user) {
      return new Response(null, {
        status: 302,
        headers: {
          Location: '/settings/storage?error=user_not_found',
        },
      })
    }

    const baseUrl = serverConfig.VITE_APP_URL
    const redirectUri = `${baseUrl}/api/oauth/google/callback`

    // Exchange code for tokens
    const tokens = await exchangeGoogleCode(code, redirectUri)

    // Get user info from Google
    const userInfo = await getGoogleUserInfo(tokens.access_token)

    // Create Bookamaze folder in user's Drive
    const folderId = await getOrCreateBookamazeFolder(tokens.access_token)

    // Calculate token expiry
    const tokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000)

    // Encrypt tokens before storing
    const encryptedAccessToken = encryptToken(tokens.access_token)
    const encryptedRefreshToken = tokens.refresh_token 
      ? encryptToken(tokens.refresh_token) 
      : null

    // Save connection to database
    await db.insert(cloudConnections).values({
      userId: stateData.userId,
      provider: 'google_drive',
      accessToken: tokens.access_token, // Keep plaintext for backward compatibility
      accessTokenEncrypted: encryptedAccessToken,
      refreshToken: tokens.refresh_token,
      refreshTokenEncrypted: encryptedRefreshToken,
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
