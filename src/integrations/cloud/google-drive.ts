// Google Drive OAuth and API integration
import { serverConfig } from '~/config'

const GOOGLE_CLIENT_ID = serverConfig.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = serverConfig.GOOGLE_CLIENT_SECRET

export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/userinfo.email',
]

export interface GoogleTokens {
  access_token: string
  refresh_token?: string
  expires_in: number
  token_type: string
  scope: string
}

export interface GoogleUserInfo {
  id: string
  email: string
  name?: string
  picture?: string
}

export function getGoogleAuthUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: GOOGLE_SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    state,
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`
}

export async function exchangeGoogleCode(
  code: string,
  redirectUri: string
): Promise<GoogleTokens> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID!,
      client_secret: GOOGLE_CLIENT_SECRET!,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to exchange code: ${error}`)
  }

  return response.json()
}

export async function refreshGoogleToken(
  refreshToken: string
): Promise<GoogleTokens> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID!,
      client_secret: GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to refresh token: ${error}`)
  }

  return response.json()
}

export async function getGoogleUserInfo(
  accessToken: string
): Promise<GoogleUserInfo> {
  const response = await fetch(
    'https://www.googleapis.com/oauth2/v2/userinfo',
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error('Failed to get user info')
  }

  return response.json()
}

// Create the Bookamaze folder in user's Drive if it doesn't exist
export async function getOrCreateBookamazeFolder(
  accessToken: string
): Promise<string> {
  // Search for existing folder
  const searchParams = new URLSearchParams({
    q: "name='Bookamaze' and mimeType='application/vnd.google-apps.folder' and trashed=false",
    fields: 'files(id,name)',
  })

  const searchResponse = await fetch(
    `https://www.googleapis.com/drive/v3/files?${searchParams}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  if (!searchResponse.ok) {
    throw new Error('Failed to search for folder')
  }

  const searchResult = await searchResponse.json()

  if (searchResult.files && searchResult.files.length > 0) {
    return searchResult.files[0].id
  }

  // Create new folder
  const createResponse = await fetch(
    'https://www.googleapis.com/drive/v3/files',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Bookamaze',
        mimeType: 'application/vnd.google-apps.folder',
      }),
    }
  )

  if (!createResponse.ok) {
    throw new Error('Failed to create folder')
  }

  const folder = await createResponse.json()
  return folder.id
}

// Upload a PDF file to Google Drive
export async function uploadToGoogleDrive(
  accessToken: string,
  folderId: string,
  file: ArrayBuffer,
  filename: string
): Promise<{ id: string; name: string; webViewLink: string }> {
  const metadata = {
    name: filename,
    parents: [folderId],
    mimeType: 'application/pdf',
  }

  // Create multipart request
  const boundary = '-------314159265358979323846'
  const delimiter = `\r\n--${boundary}\r\n`
  const closeDelimiter = `\r\n--${boundary}--`

  const metadataString = JSON.stringify(metadata)

  // Build the multipart body
  const bodyParts = [
    delimiter,
    'Content-Type: application/json; charset=UTF-8\r\n\r\n',
    metadataString,
    delimiter,
    'Content-Type: application/pdf\r\n',
    'Content-Transfer-Encoding: base64\r\n\r\n',
    btoa(String.fromCharCode(...new Uint8Array(file))),
    closeDelimiter,
  ]

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: bodyParts.join(''),
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to upload file: ${error}`)
  }

  return response.json()
}

// Get a download URL for a file (signed URL that expires)
export async function getGoogleDriveDownloadUrl(
  accessToken: string,
  fileId: string
): Promise<string> {
  // For PDFs, we can use the direct download URL with access token
  // This URL will work as long as the access token is valid
  return `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&access_token=${accessToken}`
}

// Download a file from Google Drive
export async function downloadFromGoogleDrive(
  accessToken: string,
  fileId: string
): Promise<ArrayBuffer> {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error('Failed to download file')
  }

  return response.arrayBuffer()
}

// Delete a file from Google Drive
export async function deleteFromGoogleDrive(
  accessToken: string,
  fileId: string
): Promise<void> {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  if (!response.ok && response.status !== 404) {
    throw new Error('Failed to delete file')
  }
}

// Get file metadata
export async function getGoogleDriveFileMetadata(
  accessToken: string,
  fileId: string
): Promise<{ id: string; name: string; size: string; mimeType: string }> {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,size,mimeType`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error('Failed to get file metadata')
  }

  return response.json()
}
