import type { Express, Request, Response } from 'express'
import rateLimit from 'express-rate-limit'
import type { Pool } from 'pg'
import { auditLogFromRequest } from '../lib/audit-log.js'

export type RateLimitOptions = {
  windowMs: number
  authMax: number
  adminMax: number
  enabled: boolean
}

const DEFAULT_MESSAGE = {
  error: 'RATE_LIMIT' as const,
  message: 'คำขอมากเกินไป — ลองใหม่ในอีกสักครู่',
}

function clientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0]?.trim() || req.ip || 'unknown'
  }
  return req.ip || 'unknown'
}

function createLimiter(pool: Pool, max: number, windowMs: number) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => clientIp(req),
    handler: (req: Request, res: Response) => {
      void auditLogFromRequest(pool, req, {
        action: 'security.rate_limit',
        resource: 'api',
        resourceId: req.path,
        status: 'denied',
        message: `${max}/${windowMs}ms`,
      })
      res.status(429).json(DEFAULT_MESSAGE)
    },
  })
}

/** Apply per-IP rate limits on auth and admin API prefixes (skills.md §3). */
export function registerRateLimiters(app: Express, pool: Pool, opts: RateLimitOptions): void {
  if (!opts.enabled) return

  const authLimiter = createLimiter(pool, opts.authMax, opts.windowMs)
  const adminLimiter = createLimiter(pool, opts.adminMax, opts.windowMs)

  app.use('/api/v1/auth', authLimiter)
  app.use('/api/v1/admin', adminLimiter)
}

export function rateLimitOptionsFromEnv(): RateLimitOptions {
  const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000)
  const authMax = Number(process.env.RATE_LIMIT_AUTH_MAX ?? 100)
  const adminMax = Number(process.env.RATE_LIMIT_ADMIN_MAX ?? 100)
  const enabled =
    process.env.RATE_LIMIT_ENABLED !== '0' && process.env.NODE_ENV !== 'test'

  return {
    windowMs: Number.isFinite(windowMs) && windowMs > 0 ? windowMs : 60_000,
    authMax: Number.isFinite(authMax) && authMax > 0 ? authMax : 100,
    adminMax: Number.isFinite(adminMax) && adminMax > 0 ? adminMax : 100,
    enabled,
  }
}
