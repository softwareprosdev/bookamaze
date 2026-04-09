import initSqlJs, { type Database } from 'sql.js'
import { dirname, join } from 'path'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'

const DB_PATH = process.env.DATABASE_PATH || join(process.cwd(), 'data', 'bookamaze.db')
const DB_DIR = dirname(DB_PATH)

let db: Database | null = null

export async function getDb() {
  if (!db) {
    if (!existsSync(DB_DIR)) {
      mkdirSync(DB_DIR, { recursive: true })
    }

    const SQL = await initSqlJs()

    if (existsSync(DB_PATH)) {
      const buffer = readFileSync(DB_PATH)
      db = new SQL.Database(buffer)
    } else {
      db = new SQL.Database()
    }

    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        display_name TEXT,
        avatar_url TEXT,
        created_at INTEGER NOT NULL
      )
    `)

    saveDb()
  }

  return db
}

export function saveDb() {
  if (db) {
    if (!existsSync(DB_DIR)) {
      mkdirSync(DB_DIR, { recursive: true })
    }

    const data = db.export()
    const buffer = Buffer.from(data)
    writeFileSync(DB_PATH, buffer)
  }
}
