import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import { cloudflare } from '@cloudflare/vite-plugin'
import neon from './neon-vite-plugin'
import sentryPlugin from './src/integrations/sentry/vite-plugin'
import paraglide from './paraglide-vite-plugin'

export default defineConfig({
  plugins: [
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    neon(),
    sentryPlugin(),
    paraglide(),
    // Exclude demo routes in production
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
})