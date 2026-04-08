import { neon } from 'vite-plugin-neon-new'

export default function () {
  return neon({
    seedFile: 'db/init.sql',
    envKey: 'DATABASE_URL',
  })
}

export const isNeonPluginAvailable = true
