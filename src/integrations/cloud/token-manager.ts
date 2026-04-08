import { db } from '~/db'
import { cloudConnections } from '~/db/schema'
import { eq } from 'drizzle-orm'
import { refreshGoogleToken } from './google-drive'
import { encryptToken, decryptToken } from '~/utils/crypto'

const TOKEN_EXPIRY_BUFFER_MS = 5 * 60 * 1000 // 5 minutes

export interface CloudConnection {
  id: string
  userId: string
  provider: 'google_drive' | 'dropbox'
  accessToken: string
  refreshToken: string | null
  tokenExpiresAt: Date | null
  rootFolderId: string | null
}

export async function getValidAccessToken(
  connectionId: string
): Promise<string> {
  const connection = await db.query.cloudConnections.findFirst({
    where: eq(cloudConnections.id, connectionId),
  })

  if (!connection) {
    throw new Error('Cloud connection not found')
  }

  if (!connection.isActive) {
    throw new Error('Cloud connection is not active')
  }

  // Check if token needs refresh
  const expiresAt = connection.tokenExpiresAt
  const needsRefresh =
    expiresAt && expiresAt.getTime() - Date.now() < TOKEN_EXPIRY_BUFFER_MS

  if (needsRefresh && connection.refreshToken) {
    try {
      // Decrypt refresh token for use
      const decryptedRefreshToken = connection.refreshTokenEncrypted 
        ? decryptToken(connection.refreshTokenEncrypted)
        : connection.refreshToken

      if (!decryptedRefreshToken) {
        throw new Error('No refresh token available')
      }

      const newTokens = await refreshTokenForProvider(
        connection.provider,
        decryptedRefreshToken
      )

      // Encrypt new tokens before storing
      const encryptedAccessToken = encryptToken(newTokens.accessToken)

      // Update tokens in database
      await db
        .update(cloudConnections)
        .set({
          accessToken: newTokens.accessToken, // Keep plaintext for backward compatibility
          accessTokenEncrypted: encryptedAccessToken,
          tokenExpiresAt: newTokens.expiresAt,
          updatedAt: new Date(),
        })
        .where(eq(cloudConnections.id, connectionId))

      return newTokens.accessToken
    } catch (error) {
      console.error('Failed to refresh token:', error)
      // Mark connection as inactive if refresh fails
      await db
        .update(cloudConnections)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(cloudConnections.id, connectionId))

      throw new Error('Token refresh failed. Please reconnect your account.')
    }
  }

  // Return decrypted access token
  const accessToken = connection.accessTokenEncrypted 
    ? decryptToken(connection.accessTokenEncrypted)
    : connection.accessToken

  return accessToken
}

async function refreshTokenForProvider(
  provider: 'google_drive' | 'dropbox',
  refreshToken: string
): Promise<{ accessToken: string; expiresAt: Date }> {
  if (provider === 'google_drive') {
    const tokens = await refreshGoogleToken(refreshToken)
    return {
      accessToken: tokens.access_token,
      expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
    }
  }

  // Dropbox tokens don't expire by default
  // If we need to refresh, implement here
  throw new Error(`Token refresh not implemented for ${provider}`)
}

export async function getConnectionWithValidToken(
  connectionId: string
): Promise<CloudConnection & { validAccessToken: string }> {
  const connection = await db.query.cloudConnections.findFirst({
    where: eq(cloudConnections.id, connectionId),
  })

  if (!connection) {
    throw new Error('Cloud connection not found')
  }

  const validAccessToken = await getValidAccessToken(connectionId)

  return {
    ...connection,
    validAccessToken,
  } as CloudConnection & { validAccessToken: string }
}
