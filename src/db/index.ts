import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { serverConfig } from '~/config'
import * as schema from './schema'

// Trigger server environment validation
const _config = serverConfig

const client = postgres(serverConfig.DATABASE_URL)
export const db = drizzle(client, { schema })
