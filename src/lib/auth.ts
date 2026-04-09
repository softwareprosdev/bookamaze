import { SignJWT, jwtVerify } from 'jose'
import { serverConfig } from '~/config'

const JWT_SECRET = new TextEncoder().encode(serverConfig.JWT_SECRET)

const COOKIE_NAME = 'bookamaze_session'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export interface JWTPayload {
  userId: string
  email: string
}

export async function signJWT(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET)
}

export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return {
      userId: payload.userId as string,
      email: payload.email as string,
    }
  } catch {
    return null
  }
}

export function getSessionCookieOptions() {
  return {
    name: COOKIE_NAME,
    httpOnly: true,
    path: '/',
    maxAge: COOKIE_MAX_AGE,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
  }
}

export function getClearCookieOptions() {
  return {
    name: COOKIE_NAME,
    path: '/',
    maxAge: 0,
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
  }
}

export function parseCookies(cookieHeader: string | null): Record<string, string> {
  if (!cookieHeader) return {}

  return cookieHeader.split(';').reduce((cookies, cookie) => {
    const [name, ...rest] = cookie.trim().split('=')
    if (name) {
      cookies[name] = rest.join('=')
    }
    return cookies
  }, {} as Record<string, string>)
}

export function createCookieHeader(options: {
  name: string
  value: string
  httpOnly?: boolean
  path?: string
  maxAge?: number
  sameSite?: 'lax' | 'strict' | 'none'
  secure?: boolean
}): string {
  const parts = [
    `${options.name}=${encodeURIComponent(options.value)}`,
    `Path=${options.path || '/'}`,
    `Max-Age=${options.maxAge || 0}`,
    `SameSite=${options.sameSite || 'lax'}`,
  ]

  if (options.httpOnly) parts.push('HttpOnly')
  if (options.secure) parts.push('Secure')

  return parts.join('; ')
}

export function clearCookieHeader(name: string, path = '/'): string {
  return `${name}=; Path=${path}; Max-Age=0; SameSite=lax`
}

export interface AuthContext {
  user: JWTPayload | null
}

declare module '@tanstack/react-start/server' {
  interface Register {
    router: {
      context: AuthContext
    }
  }
}
