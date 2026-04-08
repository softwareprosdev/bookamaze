import { initTRPC, TRPCError } from '@trpc/server'
import superjson from 'superjson'
import { z } from 'zod'
import { db } from '~/db'
import { serverConfig } from '~/config'
import {
  users,
  cloudConnections,
  books,
  readingProgress,
  bookmarks,
  sharedBooks,
} from '~/db/schema'
import { eq, desc, asc, and, ilike, count, sql } from 'drizzle-orm'

// Context type
export interface Context {
  user: {
    id: string
    workosUserId: string
    email: string
  } | null
}

// Create tRPC instance with context
const t = initTRPC.context<Context>().create({
  transformer: superjson,
})

export const router = t.router
export const publicProcedure = t.procedure

// Auth middleware
const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this resource',
    })
  }
  return next({
    ctx: {
      user: ctx.user,
    },
  })
})

export const protectedProcedure = t.procedure.use(isAuthed)

// Books router
const booksRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        sort: z.enum(['title', 'addedAt', 'lastOpened']).default('addedAt'),
        sortDir: z.enum(['asc', 'desc']).default('desc'),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const offset = (input.page - 1) * input.limit

      const conditions = [eq(books.userId, ctx.user.id)]
      if (input.search) {
        conditions.push(ilike(books.title, `%${input.search}%`))
      }

      const orderBy =
        input.sort === 'title'
          ? input.sortDir === 'asc'
            ? asc(books.title)
            : desc(books.title)
          : input.sort === 'lastOpened'
            ? input.sortDir === 'asc'
              ? asc(books.lastOpenedAt)
              : desc(books.lastOpenedAt)
            : input.sortDir === 'asc'
              ? asc(books.addedAt)
              : desc(books.addedAt)

      const [items, totalResult] = await Promise.all([
        db.query.books.findMany({
          where: and(...conditions),
          orderBy,
          limit: input.limit,
          offset,
          with: {
            readingProgress: true,
          },
        }),
        db
          .select({ count: count() })
          .from(books)
          .where(and(...conditions)),
      ])

      return {
        items,
        total: totalResult[0]?.count ?? 0,
        page: input.page,
        totalPages: Math.ceil((totalResult[0]?.count ?? 0) / input.limit),
      }
    }),

  get: protectedProcedure
    .input(z.object({ bookId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const book = await db.query.books.findFirst({
        where: and(eq(books.id, input.bookId), eq(books.userId, ctx.user.id)),
        with: {
          readingProgress: true,
          bookmarks: true,
          cloudConnection: true,
        },
      })

      if (!book) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Book not found',
        })
      }

      return book
    }),

  add: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        author: z.string().optional(),
        description: z.string().optional(),
        coverUrl: z.string().url().optional(),
        isbn: z.string().optional(),
        pageCount: z.number().optional(),
        source: z.enum(['upload', 'url', 'open_library', 'internet_archive']),
        sourceUrl: z.string().optional(),
        externalId: z.string().optional(),
        cloudConnectionId: z.string().uuid(),
        cloudFileId: z.string(),
        cloudFilePath: z.string().optional(),
        fileSizeBytes: z.number().optional(),
        isPublicDomain: z.boolean().default(false),
        metadata: z.record(z.unknown()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [book] = await db
        .insert(books)
        .values({
          userId: ctx.user.id,
          ...input,
        })
        .returning()

      return book
    }),

  importFromUrl: protectedProcedure
    .input(
      z.object({
        url: z.string().url(),
        title: z.string().min(1),
        cloudConnectionId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Import the validateAndDownloadPDF function
      const { validateAndDownloadPDF } = await import('~/utils/url-validation')
      
      // Download and validate the PDF
      const { buffer, size } = await validateAndDownloadPDF(input.url)

      // Get cloud connection and access token
      const connection = await db.query.cloudConnections.findFirst({
        where: and(
          eq(cloudConnections.id, input.cloudConnectionId),
          eq(cloudConnections.userId, ctx.user.id)
        ),
      })

      if (!connection || !connection.isActive || !connection.rootFolderId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid or inactive cloud connection',
        })
      }

      // Get valid access token
      const { getValidAccessToken } = await import('~/integrations/cloud/token-manager')
      const accessToken = await getValidAccessToken(input.cloudConnectionId)

      // Upload to cloud storage
      let cloudFileId: string
      let cloudFilePath: string

      if (connection.provider === 'google_drive') {
        const { uploadToGoogleDrive } = await import('~/integrations/cloud/google-drive')
        const result = await uploadToGoogleDrive(
          accessToken,
          connection.rootFolderId,
          buffer,
          `${input.title}.pdf`
        )
        cloudFileId = result.id
        cloudFilePath = result.webViewLink
      } else {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Unsupported cloud provider',
        })
      }

      // Create book record
      const [book] = await db
        .insert(books)
        .values({
          userId: ctx.user.id,
          title: input.title,
          source: 'url',
          sourceUrl: input.url,
          cloudConnectionId: input.cloudConnectionId,
          cloudFileId,
          cloudFilePath,
          fileSizeBytes: size,
        })
        .returning()

      return book
    }),

  delete: protectedProcedure
    .input(z.object({ bookId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Single atomic operation with authorization check
      const deleted = await db
        .delete(books)
        .where(
          and(
            eq(books.id, input.bookId),
            eq(books.userId, ctx.user.id)  // Include in delete condition!
          )
        )
        .returning()

      if (deleted.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Book not found or access denied',
        })
      }

      return { success: true, deletedCount: deleted.length }
    }),

  updateProgress: protectedProcedure
    .input(
      z.object({
        bookId: z.string().uuid(),
        currentPage: z.number().min(1),
        totalPages: z.number().optional(),
        scrollPosition: z
          .object({
            page: z.number(),
            x: z.number(),
            y: z.number(),
            zoom: z.number(),
          })
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const percentComplete = input.totalPages
        ? Math.round((input.currentPage / input.totalPages) * 100)
        : undefined

      const [progress] = await db
        .insert(readingProgress)
        .values({
          userId: ctx.user.id,
          bookId: input.bookId,
          currentPage: input.currentPage,
          totalPages: input.totalPages,
          percentComplete,
          scrollPosition: input.scrollPosition,
          lastReadAt: new Date(),
        })
        .onConflictDoUpdate({
          target: readingProgress.bookId,
          set: {
            currentPage: input.currentPage,
            totalPages: input.totalPages ?? sql`${readingProgress.totalPages}`,
            percentComplete:
              percentComplete ?? sql`${readingProgress.percentComplete}`,
            scrollPosition:
              input.scrollPosition ?? sql`${readingProgress.scrollPosition}`,
            lastReadAt: new Date(),
            updatedAt: new Date(),
          },
        })
        .returning()

      // Update lastOpenedAt on book
      await db
        .update(books)
        .set({ lastOpenedAt: new Date() })
        .where(eq(books.id, input.bookId))

      return progress
    }),

  addBookmark: protectedProcedure
    .input(
      z.object({
        bookId: z.string().uuid(),
        page: z.number().min(1),
        title: z.string().optional(),
        note: z.string().optional(),
        color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [bookmark] = await db
        .insert(bookmarks)
        .values({
          userId: ctx.user.id,
          ...input,
        })
        .returning()

      return bookmark
    }),

  deleteBookmark: protectedProcedure
    .input(z.object({ bookmarkId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .delete(bookmarks)
        .where(
          and(
            eq(bookmarks.id, input.bookmarkId),
            eq(bookmarks.userId, ctx.user.id)
          )
        )

      return { success: true }
    }),

  getBookmarks: protectedProcedure
    .input(z.object({ bookId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return db.query.bookmarks.findMany({
        where: and(
          eq(bookmarks.bookId, input.bookId),
          eq(bookmarks.userId, ctx.user.id)
        ),
        orderBy: asc(bookmarks.page),
      })
    }),

  // Book sharing procedures
  shareBook: protectedProcedure
    .input(
      z.object({
        bookId: z.string().uuid(),
        sharedWithUserId: z.string().uuid(),
        permissions: z
          .object({
            canRead: z.boolean().default(true),
            canDownload: z.boolean().default(false),
          })
          .default({ canRead: true, canDownload: false }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify the user owns the book
      const book = await db.query.books.findFirst({
        where: and(
          eq(books.id, input.bookId),
          eq(books.userId, ctx.user.id)
        ),
      })

      if (!book) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Book not found or access denied',
        })
      }

      // Verify the recipient user exists
      const recipientUser = await db.query.users.findFirst({
        where: eq(users.id, input.sharedWithUserId),
      })

      if (!recipientUser) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Recipient user not found',
        })
      }

      // Check if already shared
      const existingShare = await db.query.sharedBooks.findFirst({
        where: and(
          eq(sharedBooks.bookId, input.bookId),
          eq(sharedBooks.sharedByUserId, ctx.user.id),
          eq(sharedBooks.sharedWithUserId, input.sharedWithUserId)
        ),
      })

      if (existingShare) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Book already shared with this user',
        })
      }

      const [sharedBook] = await db
        .insert(sharedBooks)
        .values({
          bookId: input.bookId,
          sharedByUserId: ctx.user.id,
          sharedWithUserId: input.sharedWithUserId,
          permissions: input.permissions,
        })
        .returning()

      return sharedBook
    }),

  getSharedBooks: protectedProcedure.query(async ({ ctx }) => {
    return db.query.sharedBooks.findMany({
      where: eq(sharedBooks.sharedByUserId, ctx.user.id),
      with: {
        book: true,
        sharedWithUser: true,
      },
      orderBy: desc(sharedBooks.createdAt),
    })
  }),

  getSharedWithMe: protectedProcedure
    .query(async ({ ctx }) => {
      return db.query.sharedBooks.findMany({
        where: eq(sharedBooks.sharedWithUserId, ctx.user.id),
        with: {
          book: {
            with: {
              readingProgress: true,
            },
          },
          sharedByUser: {
            columns: {
              displayName: true,
              email: true,
            },
          },
        },
      })
    }),
})

// Storage router
const storageRouter = router({
  connections: protectedProcedure.query(async ({ ctx }) => {
    return db.query.cloudConnections.findMany({
      where: and(
        eq(cloudConnections.userId, ctx.user.id),
        eq(cloudConnections.isActive, true)
      ),
      columns: {
        id: true,
        provider: true,
        accountEmail: true,
        createdAt: true,
      },
    })
  }),

  connect: protectedProcedure
    .input(
      z.object({
        provider: z.enum(['google_drive', 'dropbox']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const baseUrl = serverConfig.VITE_APP_URL
      const state = Buffer.from(
        JSON.stringify({ userId: ctx.user.id, provider: input.provider })
      ).toString('base64')

      if (input.provider === 'google_drive') {
        const params = new URLSearchParams({
          client_id: serverConfig.GOOGLE_CLIENT_ID,
          redirect_uri: `${baseUrl}/api/oauth/google/callback`,
          response_type: 'code',
          scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email',
          access_type: 'offline',
          prompt: 'consent',
          state,
        })
        return {
          authUrl: `https://accounts.google.com/o/oauth2/v2/auth?${params}`,
        }
      } else {
        const params = new URLSearchParams({
          client_id: serverConfig.DROPBOX_APP_KEY,
          redirect_uri: `${baseUrl}/api/oauth/dropbox/callback`,
          response_type: 'code',
          token_access_type: 'offline',
          state,
        })
        return {
          authUrl: `https://www.dropbox.com/oauth2/authorize?${params}`,
        }
      }
    }),

  disconnect: protectedProcedure
    .input(z.object({ connectionId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .update(cloudConnections)
        .set({ isActive: false, updatedAt: new Date() })
        .where(
          and(
            eq(cloudConnections.id, input.connectionId),
            eq(cloudConnections.userId, ctx.user.id)
          )
        )

      return { success: true }
    }),
})

// Discover router
const discoverRouter = router({
  searchOpenLibrary: publicProcedure
    .input(
      z.object({
        query: z.string().min(2),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ input }) => {
      const params = new URLSearchParams({
        q: input.query,
        page: String(input.page),
        limit: String(input.limit),
      })

      const response = await fetch(
        `https://openlibrary.org/search.json?${params}`
      )
      const data = await response.json()

      return {
        items: data.docs.map((doc: Record<string, unknown>) => ({
          key: doc.key,
          title: doc.title,
          author: (doc.author_name as string[])?.[0],
          coverId: doc.cover_i,
          firstPublishYear: doc.first_publish_year,
          isbn: (doc.isbn as string[])?.[0],
          pageCount: doc.number_of_pages_median,
        })),
        total: data.numFound,
        page: input.page,
      }
    }),

  searchInternetArchive: publicProcedure
    .input(
      z.object({
        query: z.string().min(2),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ input }) => {
      const params = new URLSearchParams({
        q: `${input.query} AND mediatype:texts AND format:PDF`,
        output: 'json',
        rows: String(input.limit),
        page: String(input.page),
      })

      const response = await fetch(
        `https://archive.org/advancedsearch.php?${params}`
      )
      const data = await response.json()

      return {
        items: data.response.docs.map((doc: Record<string, unknown>) => ({
          identifier: doc.identifier,
          title: doc.title,
          author: (doc.creator as string[])?.[0] ?? doc.creator,
          description: doc.description,
          publicDate: doc.publicdate,
        })),
        total: data.response.numFound,
        page: input.page,
      }
    }),
})

// User router
const userRouter = router({
  profile: protectedProcedure.query(async ({ ctx }) => {
    const user = await db.query.users.findFirst({
      where: eq(users.id, ctx.user.id),
    })

    return user
  }),

  syncFromWorkOS: protectedProcedure
    .input(
      z.object({
        workosUserId: z.string(),
        email: z.string().email(),
        displayName: z.string().optional(),
        avatarUrl: z.string().url().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const [user] = await db
        .insert(users)
        .values({
          workosUserId: input.workosUserId,
          email: input.email,
          displayName: input.displayName,
          avatarUrl: input.avatarUrl,
        })
        .onConflictDoUpdate({
          target: users.workosUserId,
          set: {
            email: input.email,
            displayName: input.displayName,
            avatarUrl: input.avatarUrl,
            updatedAt: new Date(),
          },
        })
        .returning()

      return user
    }),
})

// Main router
export const appRouter = router({
  // Legacy routes
  hello: publicProcedure
    .input(z.object({ name: z.string().optional() }))
    .query(({ input }) => {
      return { greeting: `Hello ${input.name ?? 'World'}!` }
    }),

  // Feature routers
  books: booksRouter,
  storage: storageRouter,
  discover: discoverRouter,
  user: userRouter,
})

export type AppRouter = typeof appRouter
