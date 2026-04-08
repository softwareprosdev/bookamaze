# Bookamaze

A free, open-source web application for finding, saving, and reading PDF books online. Store your books in your own cloud storage (Google Drive or Dropbox) and read them from any device.

## Features

- **PDF Reader** - Read PDFs directly in your browser with progress sync across devices
- **Book Discovery** - Search millions of books from Open Library and Internet Archive
- **Cloud Storage** - Store books in your own Google Drive or Dropbox account
- **Import Options** - Upload PDFs, import from URLs, or save from search results
- **Reading Progress** - Automatically saves your reading position
- **Bookmarks** - Add bookmarks with notes to any page
- **Mobile Friendly** - Responsive design works on desktop, tablet, and phone

## Tech Stack

- **Framework**: [TanStack Start](https://tanstack.com/start) (React 19 + TanStack Router)
- **Styling**: Tailwind CSS v4
- **Database**: PostgreSQL with [Drizzle ORM](https://orm.drizzle.team/)
- **API**: [tRPC](https://trpc.io/) with type-safe endpoints
- **Auth**: [WorkOS AuthKit](https://workos.com/authkit)
- **PDF Rendering**: [PDF.js](https://mozilla.github.io/pdf.js/)
- **Deployment**: Cloudflare Workers / Node.js

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm
- PostgreSQL database (or [Neon](https://neon.tech/) serverless)
- WorkOS account for authentication
- Google Cloud Console project (for Google Drive OAuth)
- Dropbox App Console project (for Dropbox OAuth)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/bookamaze.git
cd bookamaze
```

2. Install dependencies:
```bash
pnpm install
```

3. Copy environment variables:
```bash
cp .env.example .env.local
```

4. Fill in your environment variables (see [Environment Variables](#environment-variables) below)

5. Run database migrations:
```bash
pnpm db:generate
pnpm db:migrate
```

6. Start the development server:
```bash
pnpm dev
```

The app will be available at `http://localhost:3000`

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server on port 3000 |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm deploy` | Build and deploy to Cloudflare Workers |
| `pnpm db:generate` | Generate migrations from schema changes |
| `pnpm db:migrate` | Run database migrations |
| `pnpm db:studio` | Open Drizzle Studio (database GUI) |

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `VITE_WORKOS_CLIENT_ID` | WorkOS client ID for authentication | Yes |
| `VITE_WORKOS_API_HOSTNAME` | WorkOS API hostname (default: api.workos.com) | No |
| `VITE_APP_URL` | Your app's public URL | Yes |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | Yes |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | Yes |
| `DROPBOX_APP_KEY` | Dropbox OAuth app key | Yes |
| `DROPBOX_APP_SECRET` | Dropbox OAuth app secret | Yes |
| `SENTRY_DSN` | Optional Sentry DSN for error tracking | No |

## Local Docker Development

A Docker development setup is included for local testing.

1. Create a local environment file from the example:
```bash
cp .env.example .env.local
```
2. Update `.env.local` with your credentials and `DATABASE_URL`.
3. Start the app and a local PostgreSQL database:
```bash
docker compose up --build
```

The app will be available at `http://localhost:3000`.

## Setting Up OAuth

### Google Drive

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable the Google Drive API
4. Go to Credentials → Create Credentials → OAuth client ID
5. Set application type to "Web application"
6. Add authorized redirect URI: `https://yourdomain.com/api/oauth/google/callback`
7. Copy Client ID and Client Secret to your environment variables

### Dropbox

1. Go to [Dropbox App Console](https://www.dropbox.com/developers/apps)
2. Create a new app with "Scoped access" and "Full Dropbox" access
3. Add redirect URI: `https://yourdomain.com/api/oauth/dropbox/callback`
4. Copy App Key and App Secret to your environment variables

### WorkOS

1. Sign up at [WorkOS](https://workos.com/)
2. Create a new project
3. Go to AuthKit settings and configure your redirect URIs
4. Copy the Client ID to your environment variables

## Deployment

### Cloudflare Workers

```bash
pnpm deploy
```

### Coolify / Docker

The app can be deployed on Coolify or any Docker-compatible platform. Use the Node.js buildpack with:

- Build command: `pnpm build`
- Start command: `pnpm start`
- Port: `3000`

### Docker Build

A production container can be built using the included `Dockerfile`:

```bash
docker build -t bookamaze .
```

Then run it with:

```bash
docker run -p 3000:3000 --env-file .env.local bookamaze
```

## Project Structure

```
src/
├── components/       # React components
│   ├── reader/       # PDF reader components
│   └── Header.tsx    # Navigation header
├── db/
│   ├── schema.ts     # Drizzle database schema
│   └── index.ts      # Database client
├── integrations/
│   ├── cloud/        # Google Drive & Dropbox integration
│   ├── trpc/         # tRPC router and client
│   ├── workos/       # Authentication provider
│   └── query/        # TanStack Query provider
├── routes/
│   ├── api/          # API routes (tRPC, OAuth callbacks)
│   ├── library/      # Book library pages
│   ├── reader/       # PDF reader page
│   ├── discover/     # Book search page
│   ├── upload/       # Upload/import page
│   └── settings/     # Settings pages
└── styles.css        # Global styles
```

## License

MIT
