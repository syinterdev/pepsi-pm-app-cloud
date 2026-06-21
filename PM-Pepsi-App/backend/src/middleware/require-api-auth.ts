import type { RequestHandler } from 'express'
import { parseCookieHeader } from '../lib/cookies.js'
import { SESSION_COOKIE_NAME, verifySessionToken } from '../lib/session-token.js'
import type { AuthUser } from '../schemas/auth.js'

declare module 'express-serve-static-core' {
  interface Request {
    authUser?: AuthUser
  }
}

function extractToken(req: { headers: { authorization?: string; cookie?: string } }): string | null {
  const auth = req.headers.authorization
  if (auth?.startsWith('Bearer ')) return auth.slice(7).trim()
  const cookies = parseCookieHeader(req.headers.cookie)
  const cookie = cookies[SESSION_COOKIE_NAME]
  if (cookie) return cookie
  return null
}

export function createRequireApiAuth(sessionSecret: string): RequestHandler {
  return (req, res, next) => {
    const token = extractToken(req)
    if (!token) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'ต้องเข้าสู่ระบบ' })
      return
    }
    const user = verifySessionToken(token, sessionSecret)
    if (!user) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'เซสชันหมดอายุหรือไม่ถูกต้อง' })
      return
    }
    req.authUser = user
    next()
  }
}

export function getTokenFromRequest(req: { headers: { authorization?: string; cookie?: string } }): string | null {
  return extractToken(req)
}
