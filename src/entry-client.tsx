import { hydrateStart } from '@tanstack/react-start/client'
import { initSentry } from './integrations/sentry/client'

initSentry()

hydrateStart()
