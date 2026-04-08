import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'

// Users table for authentication
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  displayName: text('display_name'),
  avatarUrl: text('avatar_url'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

export const usersRelations = relations(users, ({ many }) => ({
  books: many(books),
  readingProgress: many(readingProgress),
  bookmarks: many(bookmarks),
  sharedBooksSent: many(sharedBooks, { relationName: 'sharedByUser' }),
  sharedBooksReceived: many(sharedBooks, { relationName: 'sharedWithUser' }),
}))

// User Library (saved books)
export const books = sqliteTable('books', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  title: text('title').notNull(),
  author: text('author'),
  description: text('description'),
  coverUrl: text('cover_url'),
  isbn: text('isbn'),
  pageCount: integer('page_count'),
  source: text('source').notNull(), // 'upload', 'url', 'open_library', 'internet_archive'
  sourceUrl: text('source_url'),
  externalId: text('external_id'),
  filePath: text('file_path'),
  fileSizeBytes: integer('file_size_bytes'),
  metadata: text('metadata'), // JSON string
  isPublicDomain: integer('is_public_domain', { mode: 'boolean' }).default(false),
  addedAt: integer('added_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  lastOpenedAt: integer('last_opened_at', { mode: 'timestamp' }),
})

export const booksRelations = relations(books, ({ one, many }) => ({
  user: one(users, {
    fields: [books.userId],
    references: [users.id],
  }),
  readingProgress: one(readingProgress, {
    fields: [books.id],
    references: [books.id],
  }),
  bookmarks: many(bookmarks),
  sharedBooks: many(sharedBooks),
}))

// Reading Progress
export const readingProgress = sqliteTable('reading_progress', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  bookId: text('book_id')
    .references(() => books.id, { onDelete: 'cascade' })
    .notNull(),
  currentPage: integer('current_page').default(1),
  totalPages: integer('total_pages'),
  percentComplete: integer('percent_complete').default(0),
  scrollPosition: text('scroll_position'), // JSON string
  lastReadAt: integer('last_read_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

export const readingProgressRelations = relations(readingProgress, ({ one }) => ({
  user: one(users, {
    fields: [readingProgress.userId],
    references: [users.id],
  }),
  book: one(books, {
    fields: [readingProgress.bookId],
    references: [books.id],
  }),
}))

// Bookmarks
export const bookmarks = sqliteTable('bookmarks', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  bookId: text('book_id')
    .references(() => books.id, { onDelete: 'cascade' })
    .notNull(),
  page: integer('page').notNull(),
  title: text('title'),
  note: text('note'),
  color: text('color'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

export const bookmarksRelations = relations(bookmarks, ({ one }) => ({
  user: one(users, {
    fields: [bookmarks.userId],
    references: [users.id],
  }),
  book: one(books, {
    fields: [bookmarks.bookId],
    references: [books.id],
  }),
}))

// Shared Books (books shared between users)
export const sharedBooks = sqliteTable('shared_books', {
  id: text('id').primaryKey(),
  bookId: text('book_id')
    .references(() => books.id, { onDelete: 'cascade' })
    .notNull(),
  sharedByUserId: text('shared_by_user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  sharedWithUserId: text('shared_with_user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  permissions: text('permissions').default('{"canRead":true}'), // JSON string
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

export const sharedBooksRelations = relations(sharedBooks, ({ one }) => ({
  book: one(books, {
    fields: [sharedBooks.bookId],
    references: [books.id],
  }),
  sharedByUser: one(users, {
    fields: [sharedBooks.sharedByUserId],
    references: [users.id],
  }),
  sharedWithUser: one(users, {
    fields: [sharedBooks.sharedWithUserId],
    references: [users.id],
  }),
}))

// Type exports
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Book = typeof books.$inferSelect
export type NewBook = typeof books.$inferInsert
export type ReadingProgress = typeof readingProgress.$inferSelect
export type Bookmark = typeof bookmarks.$inferSelect
