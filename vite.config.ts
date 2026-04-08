import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import sentryPlugin from './src/integrations/sentry/vite-plugin'
import paraglide from './paraglide-vite-plugin'

async function getPlugins() {
  return [
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tailwindcss(),
    tanstackStart({ ssr: false }),
    viteReact(),
    sentryPlugin(),
    paraglide(),
  ]
}

export default defineConfig(async () => ({
  plugins: [...(await getPlugins())],
  server: {
    host: "0.0.0.0",
    port: 3000,
    strictPort: true,
  },
}))
