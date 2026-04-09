import React from 'react'
import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import appCss from '../styles.css?url'
import { QueryProvider } from '../integrations/query/provider'
import { queryDevtoolsPlugin } from '../integrations/query/devtools'

const devtoolsPlugins = import.meta.env.DEV ? [queryDevtoolsPlugin] : []

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Book Amaze' },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  component: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <QueryProvider>
          {children}
          {import.meta.env.DEV ? <TanStackRouterDevtools /> : null}
          {devtoolsPlugins.map((plugin, i) => (
            <React.Fragment key={i}>{plugin.render}</React.Fragment>
          ))}
        </QueryProvider>
        <Scripts />
      </body>
    </html>
  )
}
