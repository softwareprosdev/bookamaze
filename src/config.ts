import { z } from 'zod'
import { join } from 'path'

const ServerEnvSchema = z.object({
  DATABASE_PATH: z.string().default(join(process.cwd(), 'data', 'bookamaze.db')),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  TOKEN_ENCRYPTION_KEY: z.string().min(32).optional(),
  VITE_APP_URL: z.string().url().default('http://localhost:3000'),
  VITE_SENTRY_DSN: z.string().optional(),
})

const ClientEnvSchema = z.object({
  VITE_APP_URL: z.string().url().default('http://localhost:3000'),
  VITE_SENTRY_DSN: z.string().optional(),
})

function getDevSecret(key: string, fallback: string) {
  return process.env.NODE_ENV === 'production'
    ? process.env[key]
    : process.env[key] ?? fallback
}

export const serverConfig = ServerEnvSchema.parse({
  DATABASE_PATH: process.env.DATABASE_PATH,
  JWT_SECRET: getDevSecret('JWT_SECRET', 'bookamaze-dev-secret-change-in-production-32chars'),
  TOKEN_ENCRYPTION_KEY: getDevSecret('TOKEN_ENCRYPTION_KEY', 'bookamaze-dev-encryption-key-32chars!!'),
  VITE_APP_URL: process.env.VITE_APP_URL,
  VITE_SENTRY_DSN: process.env.VITE_SENTRY_DSN,
})

export const clientConfig = ClientEnvSchema.parse({
  VITE_APP_URL: import.meta.env.VITE_APP_URL,
  VITE_SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN,
})
