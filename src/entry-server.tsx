import { createServerHandler } from '@tanstack/react-start/server'

export default createServerHandler({
  getRequestHandler: () => {
    const { default: handler } = require('./server')
    return handler
  },
})
