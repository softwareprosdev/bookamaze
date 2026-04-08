import { z } from 'zod'

const ServerEnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  DROPBOX_APP_KEY: z.string(),
  DROPBOX_APP_SECRET: z.string(),
  VITE_APP_URL: z.string().url(),
  TOKEN_ENCRYPTION_KEY: z.string().length(32, 'TOKEN_ENCRYPTION_KEY must be exactly 32 characters'),
  SENTRY_DSN: z.string().url().optional(),
})

const ClientEnvSchema = z.object({
  VITE_WORKOS_CLIENT_ID: z.string(),
  VITE_APP_URL: z.string().url(),
})

function validateServerEnv() {
  const result = ServerEnvSchema.safeParse(process.env)

  if (!result.success) {
    const errors = result.error.errors
      .map(e => `${e.path.join('.')}: ${e.message}`)
      .join('\n')

    console.error(`\n❌ Missing or invalid server environment variables:\n${errors}`)
    process.exit(1)
  }
}

function validateClientEnv() {
  const result = ClientEnvSchema.safeParse(import.meta.env)

  if (!result.success) {
    const errors = result.error.errors
      .map(e => `${e.path.join('.')}: ${e.message}`)
      .join('\n')

    console.error(`\n❌ Missing or invalid client environment variables:\n${errors}`)
    throw new Error('Invalid client environment')
  }
}

// Export validated config
export const serverConfig = (() => {
  validateServerEnv()
  return ServerEnvSchema.parse(process.env)
})()

export const clientConfig = (() => {
  validateClientEnv()
  return ClientEnvSchema.parse(import.meta.env)
})()