import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import sentryPlugin from './src/integrations/sentry/vite-plugin'
import paraglide from './paraglide-vite-plugin'

const isDev = process.env.NODE_ENV !== 'production'

async function getPlugins() {
  const plugins = [
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tailwindcss(),
    tanstackStart({ ssr: false }),
    viteReact(),
    sentryPlugin(),
    paraglide(),
  ]

  if (isDev) {
    try {
      const { neon } = await import('vite-plugin-neon-new')
      plugins.push(
        neon({
          seedFile: 'db/init.sql',
          envKey: 'DATABASE_URL',
        })
      )
    } catch (e) {
      console.warn('vite-plugin-neon-new not available, skipping DB plugin')
    }
  }

  return plugins
}

export default defineConfig(async () => ({
  plugins: [...(await getPlugins()),
    {
      name: 'exclude-demo-routes',
      resolveId(id) {
        const normalizedId = id?.replace(/\\/g, '/')

        if (normalizedId?.includes('/routes/demo/') && process.env.NODE_ENV === 'production') {
          return { id: '', external: true }
        }
      },
    },
  ],
  server: {
    port: 3000,
  },
}))
