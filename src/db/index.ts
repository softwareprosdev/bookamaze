import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { join } from 'path'
import * as schema from './schema'

const DB_PATH = process.env.DATABASE_PATH || join(process.cwd(), 'data', 'bookamaze.db')

let db: ReturnType<typeof drizzle> | null = null
let sqlite: Database.Database | null = null

export function getDb() {
  if (!db) {
    const { mkdirSync, existsSync } = require('fs')
    const dir = process.env.DATABASE_PATH?.replace(/\/[^/]+$/, '') || join(process.cwd(), 'data')
    
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }

    sqlite = new Database(DB_PATH)
    
    db = drizzle(sqlite, { schema })
    
    // Initialize tables
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        display_name TEXT,
        avatar_url TEXT,
        created_at INTEGER NOT NULL
      );
      
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
      );
      
      CREATE TABLE IF NOT EXISTS reading_progress (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        book_id TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
        current_page INTEGER DEFAULT 1,
        total_pages INTEGER,
        percent_complete INTEGER DEFAULT 0,
        scroll_position TEXT,
        last_read_at INTEGER
      );
      
      CREATE TABLE IF NOT EXISTS bookmarks (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        book_id TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
        page INTEGER NOT NULL,
        title TEXT,
        note TEXT,
        color TEXT,
        created_at INTEGER NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS shared_books (
        id TEXT PRIMARY KEY,
        book_id TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
        shared_by_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        shared_with_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        permissions TEXT DEFAULT '{"canRead":true}',
        created_at INTEGER NOT NULL
      );
      
      CREATE INDEX IF NOT EXISTS idx_books_user_id ON books(user_id);
      CREATE INDEX IF NOT EXISTS idx_reading_progress_user_id ON reading_progress(user_id);
      CREATE INDEX IF NOT EXISTS idx_reading_progress_book_id ON reading_progress(book_id);
      CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);
      CREATE INDEX IF NOT EXISTS idx_bookmarks_book_id ON bookmarks(book_id);
      CREATE INDEX IF NOT EXISTS idx_shared_books_shared_with ON shared_books(shared_with_user_id);
    `)
  }
  
  return db
}

export { schema }
