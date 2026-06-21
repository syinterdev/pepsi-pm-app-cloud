import type { Express, Request, Response } from 'express'
import type { Pool } from 'pg'
import { voidAudit } from '../lib/audit-mutation.js'
import { serializeCookie, sessionCookieSerializeOptions } from '../lib/cookies.js'
import { listPermissionsForUserst } from '../lib/has-permission.js'
import { getSessionTtlMs, sessionTtlMaxAgeSec } from '../lib/session-ttl.js'
import { SESSION_COOKIE_NAME, signSessionToken } from '../lib/session-token.js'
import { createRequireApiAuth } from '../middleware/require-api-auth.js'
import { validateBody } from '../middleware/validate-body.js'
import {
  changePasswordBodySchema,
  changePasswordResponseSchema,
} from '../schemas/auth.js'
import { userProfileSchema } from '../schemas/profile.js'
import {
  ChangePasswordError,
  changePasswordForUser,
} from '../services/change-password.js'
import { getProfileForUser } from '../services/profile.js'

export function registerProfileRoutes(app: Express, pool: Pool, sessionSecret: string) {
  const requireAuth = createRequireApiAuth(sessionSecret)

  app.get('/api/v1/auth/profile', requireAuth, async (req, res: Response) => {
    const profile = await getProfileForUser(pool, req.authUser!)
    res.json(userProfileSchema.parse(profile))
  })

  app.post(
    '/api/v1/auth/change-password',
    requireAuth,
    validateBody(changePasswordBodySchema),
    async (req: Request, res: Response) => {
      const body = req.body as {
        currentPassword: string
        newPassword: string
        confirmPassword: string
      }
      try {
        const user = await changePasswordForUser(pool, req.authUser!, body)
        const permissions = await listPermissionsForUserst(pool, user.userst)
        const ttlMs = await getSessionTtlMs(pool)
        const token = signSessionToken(user, sessionSecret, { ttlMs })
        res.setHeader(
          'Set-Cookie',
          serializeCookie(
            SESSION_COOKIE_NAME,
            token,
            sessionCookieSerializeOptions(sessionTtlMaxAgeSec(ttlMs)),
          ),
        )
        voidAudit(pool, req, {
          action: 'auth.change_password',
          resource: user.accountType === 'member' ? 'tbl_member' : 'tbworkcenter',
          resourceId: user.memId ?? user.idwkctr,
        })
        res.json(
          changePasswordResponseSchema.parse({
            ok: true,
            token,
            user: { ...user, permissions },
          }),
        )
      } catch (err) {
        if (err instanceof ChangePasswordError) {
          const status =
            err.code === 'INVALID_CURRENT'
              ? 401
              : err.code === 'NOT_FOUND'
                ? 404
                : 400
          res.status(status).json({ error: err.code, message: err.message })
          return
        }
        throw err
      }
    },
  )
}
