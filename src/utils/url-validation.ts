import { z } from 'zod'

const ALLOWED_DOMAINS = [
  'example.com',
  'open-library.org',
  'archive.org',
  'gutenberg.org',
]

const MAX_FILE_SIZE = 100 * 1024 * 1024  // 100MB

const UrlImportSchema = z.object({
  url: z.string().url('Invalid URL'),
  title: z.string().min(1, 'Title required'),
})

export async function validateAndDownloadPDF(
  url: string
): Promise<{ buffer: ArrayBuffer; size: number }> {
  const urlObj = new URL(url)

  // Check domain whitelist
  const isAllowed = ALLOWED_DOMAINS.some(domain =>
    urlObj.hostname === domain || urlObj.hostname.endsWith('.' + domain)
  )

  if (!isAllowed) {
    throw new Error(`Domain ${urlObj.hostname} is not allowed`)
  }

  // Download with timeout and size limit
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000)  // 30s timeout

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Bookamaze/1.0',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    // Check content type
    const contentType = response.headers.get('content-type')
    if (!contentType?.includes('application/pdf')) {
      throw new Error('Not a valid PDF file')
    }

    // Check content length
    const contentLength = parseInt(
      response.headers.get('content-length') || '0'
    )
    if (contentLength > MAX_FILE_SIZE) {
      throw new Error(
        `File size ${(contentLength / 1024 / 1024).toFixed(2)}MB exceeds limit`
      )
    }

    // Download with streaming validation
    const chunks: Uint8Array[] = []
    let totalSize = 0

    const reader = response.body?.getReader()
    if (!reader) throw new Error('No response body')

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      totalSize += value.length
      if (totalSize > MAX_FILE_SIZE) {
        throw new Error('File exceeds size limit')
      }

      chunks.push(value)
    }

    return {
      buffer: new Uint8Array(chunks.reduce((a, b) => {
        const c = new Uint8Array(a.length + b.length)
        c.set(a)
        c.set(b, a.length)
        return c
      })).buffer,
      size: totalSize,
    }
  } finally {
    clearTimeout(timeoutId)
  }
}