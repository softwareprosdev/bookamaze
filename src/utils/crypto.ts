import crypto from 'crypto'
import { serverConfig } from '~/config'

const ENCRYPTION_KEY = serverConfig.TOKEN_ENCRYPTION_KEY
if (!ENCRYPTION_KEY) {
  throw new Error('TOKEN_ENCRYPTION_KEY is required to use token encryption utilities')
}

export function encryptToken(token: string): string {
  const iv = crypto.randomBytes(16)
  const key = Buffer.from(ENCRYPTION_KEY!, 'utf8')
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)

  let encrypted = cipher.update(token, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  const authTag = cipher.getAuthTag()
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted
}

export function decryptToken(encrypted: string): string {
  const [ivHex, tagHex, ciphertext] = encrypted.split(':')
  if (!ivHex || !tagHex || !ciphertext) {
    throw new Error('Invalid encrypted token format')
  }
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(tagHex, 'hex')
  const key = Buffer.from(ENCRYPTION_KEY!, 'utf8')

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(ciphertext, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}