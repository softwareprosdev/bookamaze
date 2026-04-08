import { sentryVitePlugin } from '@sentry/vite-plugin'

export default function () {
  return sentryVitePlugin({
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    authToken: process.env.SENTRY_AUTH_TOKEN,
    telemetry: false,
    release: {
      name: process.env.npm_package_version || '1.0.0',
    },
  })
}
