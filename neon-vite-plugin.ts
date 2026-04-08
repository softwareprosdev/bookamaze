import { postgres } from 'vite-plugin-db'

export default function () {
  return postgres({
    seedFile: 'db/init.sql',
    envKey: 'DATABASE_URL',
  })
}
