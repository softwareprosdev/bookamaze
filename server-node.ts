import { createServer as createHttpServer } from 'node:http'
import handler from './dist/server/server.js'

const port = process.env.PORT || 3000

const server = createHttpServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://localhost:${port}`)
    
    const headers = new Headers()
    for (const [key, value] of Object.entries(req.headers)) {
      if (typeof value === 'string') {
        headers.set(key, value)
      } else if (Array.isArray(value)) {
        headers.set(key, value.join(', '))
      }
    }
    
    const body = ['POST', 'PUT', 'PATCH'].includes(req.method || '') 
      ? await new Promise<string>((resolve, reject) => {
          let data = ''
          req.on('data', chunk => data += chunk)
          req.on('end', () => resolve(data))
          req.on('error', reject)
        })
      : undefined

    const request = new Request(url.toString(), {
      method: req.method,
      headers,
      body,
    })
    
    const response = await handler.default.fetch(request)
    
    res.statusCode = response.status
    response.headers.forEach((value, key) => {
      res.setHeader(key, value)
    })
    
    const responseBody = await response.text()
    res.end(responseBody)
  } catch (error) {
    console.error('Server error:', error)
    res.statusCode = 500
    res.setHeader('Content-Type', 'text/plain')
    res.end('Internal Server Error')
  }
})

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`)
})
