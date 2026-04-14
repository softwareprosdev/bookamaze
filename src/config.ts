import { type } from 'arktype'
import { join } from 'path'

const ServerEnvSchema = type({
  DATABASE_PATH: "string",
  JWT_SECRET: "string",
  "TOKEN_ENCRYPTION_KEY?": "string",
  "VITE_APP_URL?": "string",
  "VITE_SENTRY_DSN?": "string",
})

const ClientEnvSchema = type({
  "VITE_APP_URL?": "string",
  "VITE_SENTRY_DSN?": "string",
})

function getEnv(key: string, fallback: string): string {
  return process.env[key] ?? fallback
}

const serverEnvData: Record<string, string> = {
  DATABASE_PATH: getEnv('DATABASE_PATH', join(process.cwd(), 'data', 'bookamaze.db')),
  JWT_SECRET: getEnv('JWT_SECRET', 'bookamaze-dev-secret-change-in-production-32chars'),
  TOKEN_ENCRYPTION_KEY: getEnv('TOKEN_ENCRYPTION_KEY', 'bookamaze-dev-encryption-key-32chars!!'),
  VITE_APP_URL: getEnv('VITE_APP_URL', 'http://localhost:3000'),
}

const tokenEncryptionKey = process.env.TOKEN_ENCRYPTION_KEY
if (tokenEncryptionKey) {
  serverEnvData.TOKEN_ENCRYPTION_KEY = tokenEncryptionKey
}

const viteAppUrl = process.env.VITE_APP_URL
if (viteAppUrl) {
  serverEnvData.VITE_APP_URL = viteAppUrl
}

const sentryDsn = process.env.VITE_SENTRY_DSN
if (sentryDsn) {
  serverEnvData.VITE_SENTRY_DSN = sentryDsn
}

const serverEnvResult = ServerEnvSchema(serverEnvData)

if (serverEnvResult instanceof type.errors) {
  console.error('Server config validation errors:', serverEnvResult.summary)
  throw new Error('Invalid server configuration')
}

if (serverEnvResult.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters')
}

export const serverConfig = serverEnvResult

const clientEnvData: Record<string, string> = {}

if (import.meta.env.VITE_APP_URL) {
  clientEnvData.VITE_APP_URL = import.meta.env.VITE_APP_URL
}

if (import.meta.env.VITE_SENTRY_DSN) {
  clientEnvData.VITE_SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN
}

const clientEnvResult = ClientEnvSchema(clientEnvData)

if (clientEnvResult instanceof type.errors) {
  console.error('Client config validation errors:', clientEnvResult.summary)
  throw new Error('Invalid client configuration')
}

export const clientConfig = clientEnvResult
