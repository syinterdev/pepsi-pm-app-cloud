import type { Express, Request, Response } from 'express'
import type { Pool } from 'pg'
import { voidAudit } from '../lib/audit-mutation.js'
import { getClientIp } from '../lib/request-ip.js'
import { isPortalEnabled } from '../lib/portal-enabled.js'
import { createRequireApiAuth } from '../middleware/require-api-auth.js'
import { validateBody } from '../middleware/validate-body.js'
import {
  moduleExchangeRequestSchema,
  moduleExchangeResponseSchema,
  moduleHandoffRequestSchema,
  moduleHandoffResponseSchema,
  portalModulesResponseSchema,
} from '../schemas/portal.js'
import { exchangeModuleHandoff, issueModuleHandoff } from '../services/module-handoff.js'
import { listPortalModulesForUser } from '../services/portal-modules.js'

export function registerPortalRoutes(app: Express, pool: Pool, sessionSecret: string) {
  const requireAuth = createRequireApiAuth(sessionSecret)

  app.get('/api/v1/portal/modules', requireAuth, async (req: Request, res: Response) => {
    if (!isPortalEnabled()) {
      res.status(404).json({
        error: 'PORTAL_DISABLED',
        message: 'Portal is disabled on this server',
      })
      return
    }

    const user = req.authUser
    if (!user) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'ต้องเข้าสู่ระบบ' })
      return
    }
    const payload = await listPortalModulesForUser(pool, user)
    res.json(portalModulesResponseSchema.parse(payload))
  })

  app.post(
    '/api/v1/auth/module-handoff',
    requireAuth,
    validateBody(moduleHandoffRequestSchema),
    async (req: Request, res: Response) => {
      if (!isPortalEnabled()) {
        res.status(404).json({
          error: 'PORTAL_DISABLED',
          message: 'Portal is disabled on this server',
        })
        return
      }

      const user = req.authUser
      if (!user) {
        res.status(401).json({ error: 'UNAUTHORIZED', message: 'ต้องเข้าสู่ระบบ' })
        return
      }

      const { moduleCode } = req.body as { moduleCode: string }
      const result = await issueModuleHandoff(pool, user, moduleCode, getClientIp(req))

      if (!result.ok) {
        voidAudit(pool, req, {
          action: 'auth.module_handoff',
          resource: 'portal',
          resourceId: moduleCode,
          status: 'denied',
          message: result.error,
        })
        res.status(result.status).json({ error: result.error, message: result.message })
        return
      }

      voidAudit(pool, req, {
        action: 'auth.module_handoff',
        resource: 'portal',
        resourceId: moduleCode,
        status: 'ok',
      })
      res.json(moduleHandoffResponseSchema.parse(result.data))
    },
  )

  app.post(
    '/api/v1/auth/module-exchange',
    validateBody(moduleExchangeRequestSchema),
    async (req: Request, res: Response) => {
      const { code, moduleCode } = req.body as { code: string; moduleCode: string }
      const result = await exchangeModuleHandoff(
        pool,
        moduleCode,
        code,
        req.header('authorization') ?? undefined,
        req.header('x-module-client') ?? undefined,
        req.header('x-module-secret') ?? undefined,
      )

      if (!result.ok) {
        res.status(result.status).json({ error: result.error, message: result.message })
        return
      }

      voidAudit(pool, req, {
        action: 'auth.module_exchange',
        resource: 'portal',
        resourceId: moduleCode,
        status: 'ok',
        after: { consumedBy: result.consumedBy },
      })
      res.json(moduleExchangeResponseSchema.parse(result.data))
    },
  )
}
