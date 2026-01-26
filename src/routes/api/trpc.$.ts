import { createFileRoute } from '@tanstack/react-router'
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { appRouter, type Context } from '~/integrations/trpc/router'
import { db } from '~/db'
import { users } from '~/db/schema'
import { eq } from 'drizzle-orm'

async function createContext(req: Request): Promise<Context> {
  // Get user ID from authorization header or cookie
  // WorkOS AuthKit sends the user ID in the session
  const authHeader = req.headers.get('authorization')
  const workosUserId = authHeader?.replace('Bearer ', '')

  if (!workosUserId) {
    return { user: null }
  }

  // Look up user in database
  const user = await db.query.users.findFirst({
    where: eq(users.workosUserId, workosUserId),
  })

  if (!user) {
    return { user: null }
  }

  return {
    user: {
      id: user.id,
      workosUserId: user.workosUserId,
      email: user.email,
    },
  }
}

async function handler({ request }: { request: Request }) {
  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req: request,
    router: appRouter,
    createContext: () => createContext(request),
  })
}

export const Route = createFileRoute('/api/trpc/$')({
  // @ts-expect-error server property not in route types yet
  server: {
    handlers: {
      GET: handler,
      POST: handler,
    },
  },
})
