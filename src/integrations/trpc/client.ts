import { createTRPCClient, httpBatchLink } from '@trpc/client'
import superjson from 'superjson'
import type { AppRouter } from './router'

// Function to get current user ID from WorkOS session
// This will be set by the auth provider
let getCurrentUserId: (() => string | null) | null = null

export function setAuthGetter(getter: () => string | null) {
  getCurrentUserId = getter
}

export const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: '/api/trpc',
      transformer: superjson,
      headers() {
        const userId = getCurrentUserId?.()
        if (userId) {
          return {
            authorization: `Bearer ${userId}`,
          }
        }
        return {}
      },
    }),
  ],
})
