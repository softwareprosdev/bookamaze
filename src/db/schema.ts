import {
  pgTable,
  pgEnum,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  varchar,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// Enums
export const cloudProviderEnum = pgEnum('cloud_provider', [
  'google_drive',
  'dropbox',
])

export const bookSourceEnum = pgEnum('book_source', [
  'upload',
  'url',
  'open_library',
  'internet_archive',
])

// Users table (extends WorkOS user data)
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  workosUserId: text('workos_user_id').notNull().unique(),
  email: text('email').notNull(),
  displayName: text('display_name'),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export const usersRelations = relations(users, ({ many }) => ({
  cloudConnections: many(cloudConnections),
  books: many(books),
}))

// Cloud Storage Connections (OAuth tokens)
export const cloudConnections = pgTable('cloud_connections', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  provider: cloudProviderEnum('provider').notNull(),
  accessToken: text('access_token').notNull(),
  refreshToken: text('refresh_token'),
  tokenExpiresAt: timestamp('token_expires_at'),
  accountEmail: text('account_email'),
  accountId: text('account_id'),
  rootFolderId: text('root_folder_id'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export const cloudConnectionsRelations = relations(
  cloudConnections,
  ({ one, many }) => ({
    user: one(users, {
      fields: [cloudConnections.userId],
      references: [users.id],
    }),
    books: many(books),
  })
)

// User Library (saved books)
export const books = pgTable('books', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  title: text('title').notNull(),
  author: text('author'),
  description: text('description'),
  coverUrl: text('cover_url'),
  isbn: text('isbn'),
  pageCount: integer('page_count'),

  // Source information
  source: bookSourceEnum('source').notNull(),
  sourceUrl: text('source_url'),
  externalId: text('external_id'),

  // Storage location
  cloudConnectionId: uuid('cloud_connection_id').references(
    () => cloudConnections.id,
    { onDelete: 'set null' }
  ),
  cloudFileId: text('cloud_file_id'),
  cloudFilePath: text('cloud_file_path'),
  fileSizeBytes: integer('file_size_bytes'),

  // Metadata
  metadata: jsonb('metadata'),
  isPublicDomain: boolean('is_public_domain').default(false),
  addedAt: timestamp('added_at').defaultNow(),
  lastOpenedAt: timestamp('last_opened_at'),
})

export const booksRelations = relations(books, ({ one, many }) => ({
  user: one(users, {
    fields: [books.userId],
    references: [users.id],
  }),
  cloudConnection: one(cloudConnections, {
    fields: [books.cloudConnectionId],
    references: [cloudConnections.id],
  }),
  readingProgress: one(readingProgress, {
    fields: [books.id],
    references: [readingProgress.bookId],
  }),
  bookmarks: many(bookmarks),
}))

// Reading Progress
export const readingProgress = pgTable('reading_progress', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  bookId: uuid('book_id')
    .references(() => books.id, { onDelete: 'cascade' })
    .notNull()
    .unique(),
  currentPage: integer('current_page').default(1),
  totalPages: integer('total_pages'),
  percentComplete: integer('percent_complete').default(0),
  scrollPosition: jsonb('scroll_position'),
  lastReadAt: timestamp('last_read_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export const readingProgressRelations = relations(
  readingProgress,
  ({ one }) => ({
    user: one(users, {
      fields: [readingProgress.userId],
      references: [users.id],
    }),
    book: one(books, {
      fields: [readingProgress.bookId],
      references: [books.id],
    }),
  })
)

// Bookmarks
export const bookmarks = pgTable('bookmarks', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  bookId: uuid('book_id')
    .references(() => books.id, { onDelete: 'cascade' })
    .notNull(),
  page: integer('page').notNull(),
  title: text('title'),
  note: text('note'),
  color: varchar('color', { length: 7 }),
  createdAt: timestamp('created_at').defaultNow(),
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
