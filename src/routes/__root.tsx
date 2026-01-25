import React from 'react'
import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import appCss from '../styles.css?url'
import { Header } from '../components/Header'
import { WorkOSProvider } from '../integrations/workos/provider'
import { QueryProvider } from '../integrations/query/provider'
import { queryDevtoolsPlugin } from '../integrations/query/devtools'

const devtoolsPlugins = [
  queryDevtoolsPlugin,
]

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'TanStack Start Starter' },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <WorkOSProvider>
          <QueryProvider>
            <Header />
            {children}
            <TanStackRouterDevtools />
            {devtoolsPlugins.map((plugin, i) => (
              <React.Fragment key={i}>{plugin.render}</React.Fragment>
            ))}
          </QueryProvider>
        </WorkOSProvider>
        <Scripts />
      </body>
    </html>
  )
}