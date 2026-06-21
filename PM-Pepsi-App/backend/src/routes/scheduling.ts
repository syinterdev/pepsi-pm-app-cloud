import type { Express, Request, Response } from 'express'
import type { Pool } from 'pg'
import { z } from 'zod'
import { voidAudit, sanitizeAuditPayload } from '../lib/audit-mutation.js'
import { recordRevision } from '../lib/resource-revision.js'
import { createRequirePermission } from '../middleware/require-permission.js'
import {
  movePlanReasonsResponseSchema,
  movePlanRequestSchema,
  movePlanResponseSchema,
  workOrderSuggestionsResponseSchema,
} from '../schemas/scheduling.js'
import {
  listMovePlanReasons,
  moveWorkOrderPlan,
  MovePlanError,
  searchWorkOrderSuggestions,
} from '../services/scheduling-move.js'

const suggestionsQuerySchema = z.object({
  q: z.string().min(1),
})

export function registerSchedulingRoutes(
  app: Express,
  pool: Pool,
  sessionSecret: string,
) {
  const requireCalendarRead = createRequirePermission(pool, sessionSecret)('calendar.read')
  const requireCalendarWrite = createRequirePermission(pool, sessionSecret)('calendar.write')
  const requireWoRead = createRequirePermission(pool, sessionSecret)('work-orders.read')

  app.get(
    '/api/v1/scheduling/move-reasons',
    ...requireCalendarRead,
    async (_req: Request, res: Response) => {
      try {
        const items = await listMovePlanReasons(pool)
        res.json(movePlanReasonsResponseSchema.parse({ items }))
      } catch (err) {
        const message = err instanceof Error ? err.message : ''
        if (message.includes('tbreason')) {
          res.status(503).json({
            error: 'SCHEMA_NOT_READY',
            message: 'Run database/migrations/009_tbreason.sql',
          })
          return
        }
        throw err
      }
    },
  )

  app.post(
    '/api/v1/scheduling/move-plan',
    ...requireCalendarWrite,
    async (req: Request, res: Response) => {
      const parsed = movePlanRequestSchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({ error: 'VALIDATION', message: parsed.error.message })
        return
      }
      const user = req.authUser
      if (!user) {
        res.status(401).json({ error: 'UNAUTHORIZED' })
        return
      }

      try {
        const result = await moveWorkOrderPlan(pool, {
          ...parsed.data,
          reasonCode: parsed.data.reasonCode ?? '',
          mwkctr: user.wkctr || user.idwkctr,
        })
        voidAudit(pool, req, {
          action: 'planning.write',
          resource: 'tbiw37n',
          resourceId: String(parsed.data.idiw37),
          before: sanitizeAuditPayload(result.before),
          after: sanitizeAuditPayload({ ...parsed.data, mpcount: result.mpcount }),
        })
        void recordRevision(pool, {
          resourceType: 'calendar_event',
          resourceId: String(parsed.data.idiw37),
          changeKind: 'move_plan',
          actorId: user.idwkctr,
          actorRole: user.userst,
          before: result.before,
          after: result.after,
        })
        res.json(
          movePlanResponseSchema.parse({
            ok: true,
            message: 'Move Plan Success',
            mpcount: result.mpcount,
          }),
        )
      } catch (err) {
        if (err instanceof MovePlanError) {
          const status =
            err.code === 'NOT_FOUND' ? 404 : err.code === 'STATUS_NOT_MOVABLE' ? 409 : 400
          res.status(status).json({ error: err.code, message: err.message })
          return
        }
        console.error('[scheduling/move-plan]', err)
        res.status(500).json({ error: 'INTERNAL', message: 'Move plan failed' })
      }
    },
  )

  app.get(
    '/api/v1/work-orders/suggestions',
    ...requireWoRead,
    async (req: Request, res: Response) => {
      const parsed = suggestionsQuerySchema.safeParse(req.query)
      if (!parsed.success) {
        res.status(400).json({ error: 'VALIDATION', message: 'q is required' })
        return
      }
      const items = await searchWorkOrderSuggestions(pool, parsed.data.q)
      res.json(workOrderSuggestionsResponseSchema.parse({ items }))
    },
  )
}
