import { hydrateRoot } from 'react-dom/client'
import { StartClient } from '@tanstack/react-start'
import { getRouter } from './router'
import { initSentry } from './integrations/sentry/client'
import { clientConfig } from './config'

// Initialize integrations
initSentry()

const router = getRouter()

hydrateRoot(document.getElementById('root')!, <StartClient router={router} />)