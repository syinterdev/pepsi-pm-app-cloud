import type { NextFunction, Request, RequestHandler, Response } from 'express'
import type { Pool } from 'pg'
import { voidAuditDenied } from '../lib/audit-mutation.js'
import { forbidUnlessPermission, hasPermission } from '../lib/has-permission.js'
import { createRequireApiAuth } from './require-api-auth.js'

/**
 * Returns `[requireAuth, requirePerm]` — spread on route registration.
 *
 * @example
 * app.post('/api/v1/foo', ...createRequirePermission(pool, secret)('planning.assign'), handler)
 */
export function createRequirePermission(pool: Pool, sessionSecret: string) {
  const requireAuth = createRequireApiAuth(sessionSecret)

  return (perm: string): RequestHandler[] => [
    requireAuth,
    async (req: Request, res: Response, next: NextFunction) => {
      const user = req.authUser
      if (!user) {
        res.status(401).json({ error: 'UNAUTHORIZED', message: 'ต้องเข้าสู่ระบบ' })
        return
      }
      const ok = await forbidUnlessPermission(res, pool, user.userst, perm)
      if (!ok) {
        voidAuditDenied(pool, req, 'rbac.deny', perm)
        return
      }
      next()
    },
  ]
}

/** Any one of the listed permissions is sufficient. */
export function createRequireAnyPermission(pool: Pool, sessionSecret: string) {
  const requireAuth = createRequireApiAuth(sessionSecret)

  return (perms: readonly string[]): RequestHandler[] => [
    requireAuth,
    async (req: Request, res: Response, next: NextFunction) => {
      const user = req.authUser
      if (!user) {
        res.status(401).json({ error: 'UNAUTHORIZED', message: 'ต้องเข้าสู่ระบบ' })
        return
      }
      for (const perm of perms) {
        if (await hasPermission(pool, user.userst, perm)) {
          next()
          return
        }
      }
      voidAuditDenied(pool, req, 'rbac.deny', perms[0] ?? 'unknown')
      res.status(403).json({
        error: 'FORBIDDEN',
        message: `ไม่มีสิทธิ์ (${perms.join(' หรือ ')})`,
      })
    },
  ]
}
