import initSqlJs, { type Database } from 'sql.js'
import { join } from 'path'

const DB_PATH = process.env.DATABASE_PATH || join(process.cwd(), 'data', 'bookamaze.db')

let db: Database | null = null

export async function getDb() {
  if (!db) {
    const { mkdirSync, existsSync, readFileSync } = await import('fs')
    const dir = process.env.DATABASE_PATH?.replace(/\/[^/]+$/, '') || join(process.cwd(), 'data')
    
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
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
    const data = db.export()
    const buffer = Buffer.from(data)
    const { writeFileSync, existsSync, mkdirSync } = require('fs')
    const dir = process.env.DATABASE_PATH?.replace(/\/[^/]+$/, '') || join(process.cwd(), 'data')
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }
    writeFileSync(DB_PATH, buffer)
  }
}
