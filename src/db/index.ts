import { drizzle } from 'drizzle-orm/sql.js'
import initSqlJs, { type Database } from 'sql.js'
import { join } from 'path'
import * as schema from './schema'

const DB_PATH = process.env.DATABASE_PATH || join(process.cwd(), 'data', 'bookamaze.db')

let db: ReturnType<typeof drizzle> | null = null
let sqliteDb: Database | null = null
let SQL: Awaited<ReturnType<typeof initSqlJs>> | null = null

export async function getDb() {
  if (!db) {
    const { mkdirSync, existsSync, readFileSync, writeFileSync } = await import('fs')
    const dir = process.env.DATABASE_PATH?.replace(/\/[^/]+$/, '') || join(process.cwd(), 'data')
    
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }

    SQL = await initSqlJs()
    
    const dbFilePath = DB_PATH
    if (existsSync(dbFilePath)) {
      const buffer = readFileSync(dbFilePath)
      sqliteDb = new SQL.Database(buffer)
    } else {
      sqliteDb = new SQL.Database()
    }
    
    db = drizzle(sqliteDb, { schema })
    
    // Initialize tables
    sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        display_name TEXT,
        avatar_url TEXT,
        created_at INTEGER NOT NULL
      )
    `)
    
    sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS books (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        author TEXT,
        description TEXT,
        cover_url TEXT,
        isbn TEXT,
        page_count INTEGER,
        source TEXT NOT NULL,
        source_url TEXT,
        external_id TEXT,
        file_path TEXT,
        file_size_bytes INTEGER,
        metadata TEXT,
        is_public_domain INTEGER DEFAULT 0,
        added_at INTEGER NOT NULL,
        last_opened_at INTEGER
      )
    `)
    
    sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS reading_progress (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        book_id TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
        current_page INTEGER DEFAULT 1,
        total_pages INTEGER,
        percent_complete INTEGER DEFAULT 0,
        scroll_position TEXT,
        last_read_at INTEGER
      )
    `)
    
    sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS bookmarks (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        book_id TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
        page INTEGER NOT NULL,
        title TEXT,
        note TEXT,
        color TEXT,
        created_at INTEGER NOT NULL
      )
    `)
    
    sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS shared_books (
        id TEXT PRIMARY KEY,
        book_id TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
        shared_by_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        shared_with_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        permissions TEXT DEFAULT '{"canRead":true}',
        created_at INTEGER NOT NULL
      )
    `)
    
    sqliteDb.run(`CREATE INDEX IF NOT EXISTS idx_books_user_id ON books(user_id)`)
    sqliteDb.run(`CREATE INDEX IF NOT EXISTS idx_reading_progress_user_id ON reading_progress(user_id)`)
    sqliteDb.run(`CREATE INDEX IF NOT EXISTS idx_reading_progress_book_id ON reading_progress(book_id)`)
    sqliteDb.run(`CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id)`)
    sqliteDb.run(`CREATE INDEX IF NOT EXISTS idx_bookmarks_book_id ON bookmarks(book_id)`)
    sqliteDb.run(`CREATE INDEX IF NOT EXISTS idx_shared_books_shared_with ON shared_books(shared_with_user_id)`)
    
    // Save initial database
    saveDb()
  }
  
  return db
}

export function saveDb() {
  if (sqliteDb) {
    const data = sqliteDb.export()
    const buffer = Buffer.from(data)
    const { writeFileSync, existsSync, mkdirSync } = require('fs')
    const dir = process.env.DATABASE_PATH?.replace(/\/[^/]+$/, '') || join(process.cwd(), 'data')
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }
    writeFileSync(DB_PATH, buffer)
  }
}

export { schema }
