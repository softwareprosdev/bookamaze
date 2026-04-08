import { z } from 'zod'

const ServerEnvSchema = z.object({
  DATABASE_PATH: z.string().optional(),
  JWT_SECRET: z.string().optional(),
  VITE_APP_URL: z.string().default('http://localhost:3000'),
})

const ClientEnvSchema = z.object({
  VITE_APP_URL: z.string().default('http://localhost:3000'),
})

// Export validated config
export const serverConfig = ServerEnvSchema.parse({
  DATABASE_PATH: process.env.DATABASE_PATH,
  JWT_SECRET: process.env.JWT_SECRET,
  VITE_APP_URL: process.env.VITE_APP_URL,
})

export const clientConfig = ClientEnvSchema.parse({
  VITE_APP_URL: import.meta.env.VITE_APP_URL,
})
