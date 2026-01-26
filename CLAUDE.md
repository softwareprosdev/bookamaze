# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Bookamaze is a free application for finding, saving, and reading PDF books online. Users can:
- Upload PDFs or import from URLs
- Search Open Library and Internet Archive for public domain books
- Store books in their own cloud storage (Google Drive, Dropbox)
- Read PDFs in a cross-device web reader with progress sync

## Commands

All commands run from the `bookamaze/` directory:

```bash
pnpm install          # Install dependencies
pnpm dev              # Start dev server on port 3000
pnpm build            # Build for production
pnpm deploy           # Build and deploy to Cloudflare Workers

# Database (Drizzle + PostgreSQL/Neon)
pnpm db:generate      # Generate migrations from schema changes
pnpm db:migrate       # Run migrations
pnpm db:studio        # Open Drizzle Studio
```

## Architecture

### Tech Stack
- **Framework**: TanStack Start (React 19 + TanStack Router)
- **Styling**: Tailwind CSS v4 (dark theme, cyan accents)
- **Database**: Drizzle ORM with PostgreSQL (Neon serverless)
- **API**: tRPC with superjson transformer
- **Auth**: WorkOS AuthKit
- **PDF Rendering**: pdf.js
- **Deployment**: Cloudflare Workers

### Key Routes

- `/library` - User's book collection (grid/list view, search, sort)
- `/library/$bookId` - Book details, metadata, bookmarks
- `/reader/$bookId` - PDF reader with progress sync
- `/discover` - Search Open Library and Internet Archive
- `/upload` - Upload PDF or import from URL
- `/settings/storage` - Connect Google Drive/Dropbox

### Database Schema (`src/db/schema.ts`)

- `users` - Synced from WorkOS (workosUserId, email)
- `cloudConnections` - OAuth tokens for Google Drive/Dropbox
- `books` - User library (title, author, source, cloudFileId)
- `readingProgress` - Page position, scroll state per book
- `bookmarks` - User bookmarks with page, title, notes

### tRPC Routers (`src/integrations/trpc/router.ts`)

- `books.*` - CRUD, progress sync, bookmarks
- `storage.*` - Cloud connections, OAuth flow
- `discover.*` - Open Library/Internet Archive search
- `user.*` - Profile, WorkOS sync

### Cloud Integration (`src/integrations/cloud/`)

- `google-drive.ts` - OAuth, upload/download, folder management
- `token-manager.ts` - Auto-refresh tokens before expiry

### Environment Variables

Copy `.env.example` to `.env.local`:

```bash
DATABASE_URL=                    # PostgreSQL (Neon)
VITE_WORKOS_CLIENT_ID=           # WorkOS auth
VITE_APP_URL=http://localhost:3000
GOOGLE_CLIENT_ID=                # Google OAuth
GOOGLE_CLIENT_SECRET=
DROPBOX_APP_KEY=                 # Dropbox OAuth
DROPBOX_APP_SECRET=
```

### Path Aliases

`~/` maps to `src/` (configured in tsconfig.json)
