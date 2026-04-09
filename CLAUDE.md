# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Bookamaze is a starter application for account-based book management with local persistence.
- Secure authentication with email/password
- Protected dashboard and session cookie handling
- Local SQLite persistence via `sql.js`
- Placeholder pages for upload, discover, and library workflows

## Commands

All commands run from the `bookamaze/` directory:

```bash
pnpm install          # Install dependencies
pnpm dev              # Start dev server on port 3000
pnpm build            # Build for production
pnpm start            # Run the production server
pnpm preview          # Preview production build
```

## Architecture

### Tech Stack
- **Framework**: TanStack Start (React 19 + TanStack Router)
- **Styling**: Tailwind CSS v4
- **Database**: SQLite via `sql.js`
- **Auth**: JWT session cookies
- **Error tracking**: Sentry client support (optional)
- **Deployment**: Node.js / Docker

### Key Routes

- `/` - Public landing page
- `/login` - Login page
- `/register` - User registration page
- `/dashboard` - Protected user dashboard
- `/upload` - Placeholder upload page
- `/discover` - Placeholder discovery page
- `/library` - Placeholder library page

### Environment Variables

Copy `.env.example` to `.env.local` and customize the values:

```bash
DATABASE_PATH=./data/bookamaze.db
VITE_APP_URL=http://localhost:3000
JWT_SECRET=your-32-character-secret-here
TOKEN_ENCRYPTION_KEY=your-32-character-encryption-key-here
VITE_SENTRY_DSN=
```

### Path Aliases

`~/` maps to `src/` (configured in tsconfig.json)
