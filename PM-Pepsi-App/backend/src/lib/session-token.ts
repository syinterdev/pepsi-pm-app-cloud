import { createHmac, timingSafeEqual } from 'node:crypto'
import type { AuthUser } from '../schemas/auth.js'

const TOKEN_TTL_MS = 8 * 60 * 60 * 1000
/** Impersonation sessions auto-expire (skills.md §8 Administrator). */
export const IMPERSONATION_TTL_MS = 30 * 60 * 1000

type TokenPayload = AuthUser & { exp: number }

function base64url(input: string | Buffer): string {
  return Buffer.from(input).toString('base64url')
}

function fromBase64url(input: string): string {
  return Buffer.from(input, 'base64url').toString('utf8')
}

export function signSessionToken(
  user: AuthUser,
  secret: string,
  opts?: { ttlMs?: number },
): string {
  const payload: TokenPayload = {
    ...user,
    exp: Date.now() + (opts?.ttlMs ?? TOKEN_TTL_MS),
  }
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'PM' }))
  const body = base64url(JSON.stringify(payload))
  const sig = createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url')
  return `${header}.${body}.${sig}`
}

export function verifySessionToken(token: string, secret: string): AuthUser | null {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [header, body, sig] = parts
  const expected = createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url')
  try {
    if (sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
      return null
    }
  } catch {
    return null
  }
  let payload: TokenPayload
  try {
    payload = JSON.parse(fromBase64url(body)) as TokenPayload
  } catch {
    return null
  }
  if (!payload.exp || payload.exp < Date.now()) return null
  const { exp: _exp, ...user } = payload
  return user as AuthUser
}

export const SESSION_COOKIE_NAME = 'pm_session'
