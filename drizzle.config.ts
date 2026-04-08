import { defineConfig } from 'drizzle-kit'
import { serverConfig } from './src/config'

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: serverConfig.DATABASE_URL,
  },
})
