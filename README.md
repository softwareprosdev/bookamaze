# Bookamaze

A starter app for secure authentication and a future PDF library experience.

## Features

- Email/password authentication
- Protected dashboard and session cookie handling
- Local SQLite persistence for user accounts
- Placeholder screens for upload, discover, and library workflows
- Tailwind CSS responsive UI

## Tech Stack

- **Framework**: [TanStack Start](https://tanstack.com/start) (React 19 + TanStack Router)
- **Styling**: Tailwind CSS v4
- **Database**: SQLite via `sql.js`
- **Auth**: JWT session cookies
- **Error Tracking**: Sentry client support (optional)
- **Deployment**: Node.js / Docker

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm

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

5. Start the development server:
```bash
pnpm dev
```

The app will be available at `http://localhost:3000`

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server on port 3000 |
| `pnpm build` | Build the application for production |
| `pnpm start` | Start the production server |
| `pnpm preview` | Build and preview the production bundle |
| `pnpm typecheck` | Run TypeScript type checking |
| `pnpm check` | Run type checking |
| `pnpm deploy` | Build the app for production |

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_PATH` | Local SQLite database file path | No |
| `JWT_SECRET` | JWT signing secret for session cookies | Yes |
| `VITE_APP_URL` | Public app URL for client config | Yes |
| `VITE_SENTRY_DSN` | Optional Sentry DSN for client error tracking | No |
| `TOKEN_ENCRYPTION_KEY` | Optional encryption key for future features | No |

## Local Docker Development

A production-ready `Dockerfile` is included in the repository.

Build the container:
```bash
docker build -t bookamaze .
```

Run it with your environment file:
```bash
docker run -p 3000:3000 --env-file .env.local bookamaze
```

## Project Structure

```
src/
├── db/                # Local database helpers
├── integrations/      # Integration utilities and providers
│   ├── query/         # TanStack Query provider and devtools
│   └── sentry/        # Sentry client initialization
├── routes/            # Page and API routes
├── styles.css         # Global styles
└── config.ts          # Environment validation
```

## Notes

- This repository currently implements authentication, protected routes, and local persistence.
- Upload, discover, and library screens are provided as placeholder pages for future feature expansion.
- Set a strong `JWT_SECRET` before deploying to production.
- Keep `.env.local` out of source control.

## License

MIT
