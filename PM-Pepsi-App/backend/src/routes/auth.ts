import type { Express, Request, Response } from 'express'

import type { Pool } from 'pg'

import { z } from 'zod'

import { clearCookieHeader, serializeCookie } from '../lib/cookies.js'

import { getClientIp, getServerHostname } from '../lib/request-ip.js'

import {
  clearLoginAttempts,
  isLoginLocked,
  recordFailedLogin,
} from '../lib/login-lockout.js'
import { getSessionTtlMs, sessionTtlMaxAgeSec } from '../lib/session-ttl.js'
import { SESSION_COOKIE_NAME, signSessionToken, verifySessionToken } from '../lib/session-token.js'

import { voidAudit } from '../lib/audit-mutation.js'
import { auditActorFromUser, auditLog, auditMetaFromRequest } from '../lib/audit-log.js'
import { listPermissionsForUserst } from '../lib/has-permission.js'
import { enrichAuthUser } from '../lib/role-labels.js'
import { createRequireApiAuth, getTokenFromRequest } from '../middleware/require-api-auth.js'
import { createRequirePermission } from '../middleware/require-permission.js'

import { validateBody } from '../middleware/validate-body.js'

import {

  authSessionResponseSchema,

  loginRequestSchema,

  loginResponseSchema,

  logoutRequestSchema,

  logoutResponseSchema,

  type AuthUser,

} from '../schemas/auth.js'

import {

  findMemberByCredentials,

  findWorkcenterByCredentials,

  insertUserLog,

  listUserLogs,

} from '../services/auth.js'



const userLogQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).optional().default(50),
  offset: z.coerce.number().int().min(0).max(1_000_000).optional().default(0),
})



function setSessionCookie(res: Response, token: string, maxAgeSec: number) {
  res.setHeader(
    'Set-Cookie',
    serializeCookie(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'Lax',
      maxAgeSec,
      path: '/',
    }),
  )
}



function clearSessionCookie(res: Response) {

  res.setHeader('Set-Cookie', clearCookieHeader(SESSION_COOKIE_NAME))

}



function accountTypeOf(user: AuthUser): 'workcenter' | 'member' {

  return user.accountType === 'member' ? 'member' : 'workcenter'

}



export function registerAuthRoutes(app: Express, pool: Pool, sessionSecret: string) {
  const requireAuth = createRequireApiAuth(sessionSecret)
  const requireUserLogRead = createRequirePermission(pool, sessionSecret)('user-log.read')

  app.get('/api/v1/auth/me', async (req, res: Response) => {

    const token = getTokenFromRequest(req)

    if (!token) {

      res.status(401).json({ error: 'UNAUTHORIZED', message: 'ต้องเข้าสู่ระบบ' })

      return

    }

    const user = verifySessionToken(token, sessionSecret)

    if (!user) {

      res.status(401).json({ error: 'UNAUTHORIZED', message: 'เซสชันหมดอายุหรือไม่ถูกต้อง' })

      return

    }

    const enriched = await enrichAuthUser(pool, user)
    const permissions = await listPermissionsForUserst(pool, enriched.userst)
    res.json(authSessionResponseSchema.parse({ user: { ...enriched, permissions } }))

  })

  app.post('/api/v1/auth/impersonate/end', requireAuth, async (req: Request, res: Response) => {
    const user = req.authUser
    if (!user?.impersonatedBy) {
      res.status(400).json({
        error: 'NOT_IMPERSONATING',
        message: 'ไม่ได้อยู่ในโหมดสวมสิทธิ์',
      })
      return
    }
    voidAudit(pool, req, {
      action: 'auth.impersonate.end',
      resource: 'auth',
      resourceId: user.idwkctr,
      after: {
        targetUsername: user.username,
        adminId: user.impersonatedBy.idwkctr,
      },
    })
    res.json({ ok: true as const })
  })

  app.post(

    '/api/v1/auth/login',

    validateBody(loginRequestSchema),

    async (req, res: Response) => {

      const { username, password, mode } = req.body as {

        username: string

        password: string

        mode: 'workcenter' | 'member'

      }



      const clientIp = getClientIp(req) ?? 'unknown'

      const lock = await isLoginLocked(pool, clientIp, username)
      if (lock.locked) {
        void auditLog(
          pool,
          { actorId: username.trim(), actorRole: null },
          {
            action: 'auth.login',
            resource: 'auth',
            resourceId: username.trim(),
            status: 'denied',
            message: 'lockout',
            ...auditMetaFromRequest(req),
          },
        )
        res.status(429).json({
          error: 'LOGIN_LOCKED',
          message: lock.message ?? 'เข้าสู่ระบบถูกระงับชั่วคราว',
        })
        return
      }

      const user =
        mode === 'member'
          ? await findMemberByCredentials(pool, username, password)
          : await findWorkcenterByCredentials(pool, username, password)

      if (!user) {
        recordFailedLogin(clientIp, username)
        void auditLog(
          pool,
          { actorId: username.trim(), actorRole: null },
          {
            action: 'auth.login',
            resource: 'auth',
            resourceId: username.trim(),
            status: 'denied',
            message: `mode=${mode}`,
            ...auditMetaFromRequest(req),
          },
        )

        res.status(401).json({

          error: 'INVALID_CREDENTIALS',

          message: 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง',

        })

        return

      }



      const acct = accountTypeOf(user)

      await insertUserLog(pool, {

        userId: user.memId ?? user.idwkctr,

        username: user.username,

        userIp: getClientIp(req),

        myIp: getServerHostname(),

        action: 'in',

        accountType: acct,

      })

      void auditLog(pool, auditActorFromUser(user), {
        action: 'auth.login',
        resource: 'auth',
        resourceId: user.memId ?? user.idwkctr,
        status: 'ok',
        after: { accountType: acct, mode, userst: user.userst },
        ...auditMetaFromRequest(req),
      })



      clearLoginAttempts(clientIp, username)

      const ttlMs = await getSessionTtlMs(pool)
      const token = signSessionToken(user, sessionSecret, { ttlMs })
      setSessionCookie(res, token, sessionTtlMaxAgeSec(ttlMs))



      const payload = loginResponseSchema.parse({ token, user })

      res.json(payload)

    },

  )



  app.post(

    '/api/v1/auth/logout',

    validateBody(logoutRequestSchema),

    async (req, res: Response) => {

      const body = req.body as { userId: string; username: string; accountType?: string }

      const token = getTokenFromRequest(req)

      const fromToken = token ? verifySessionToken(token, sessionSecret) : null

      const accountType =

        body.accountType === 'member' || fromToken?.accountType === 'member'

          ? 'member'

          : 'workcenter'



      await insertUserLog(pool, {

        userId: body.userId,

        username: body.username,

        userIp: getClientIp(req),

        myIp: getServerHostname(),

        action: 'out',

        accountType,

      })

      void auditLog(pool, auditActorFromUser(fromToken), {
        action: 'auth.logout',
        resource: 'auth',
        resourceId: body.userId,
        status: 'ok',
        ...auditMetaFromRequest(req),
      })



      clearSessionCookie(res)

      res.json(logoutResponseSchema.parse({ ok: true }))

    },

  )



 /** — ใช้ cookie + redirect จาก frontend `/logout` */

  app.get('/api/v1/auth/logout', requireAuth, async (req, res: Response) => {

    const user = req.authUser!

    const acct = accountTypeOf(user)

    await insertUserLog(pool, {

      userId: user.memId ?? user.idwkctr,

      username: user.username,

      userIp: getClientIp(req),

      myIp: getServerHostname(),

      action: 'out',

      accountType: acct,

    })

    void auditLog(pool, auditActorFromUser(user), {
      action: 'auth.logout',
      resource: 'auth',
      resourceId: user.memId ?? user.idwkctr,
      status: 'ok',
      ...auditMetaFromRequest(req),
    })

    clearSessionCookie(res)

    res.json(logoutResponseSchema.parse({ ok: true }))

  })

  app.get('/api/v1/user-log', ...requireUserLogRead, async (req: Request, res: Response) => {
    const user = req.authUser
    if (!user) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'ต้องเข้าสู่ระบบ' })
      return
    }

    const parsed = userLogQuerySchema.safeParse(req.query)
    if (!parsed.success) {
      res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid query params' })
      return
    }

    const accountType = user.accountType === 'member' ? 'member' : 'workcenter'
    const userId = user.memId ?? user.idwkctr

    const items = await listUserLogs(pool, {
      userId,
      accountType,
      limit: parsed.data.limit,
      offset: parsed.data.offset,
    })

    res.json({ items })
  })

}


