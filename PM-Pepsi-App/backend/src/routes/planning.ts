import type { Express, Request, Response } from 'express'
import type { Pool } from 'pg'
import { voidAudit, sanitizeAuditPayload } from '../lib/audit-mutation.js'
import { createRequirePermission } from '../middleware/require-permission.js'
import { calendarEventsResponseSchema } from '../schemas/calendar.js'
import {
  planningAckResponseSchema,
  planningAckSummaryResponseSchema,
  planningAssignBodySchema,
  planningAssignResponseSchema,
  planningResponseSchema,
} from '../schemas/planning.js'
import { listPlanCalendarEvents } from '../services/plan-calendar.js'
import { resolvePlanCalendarScope } from '../lib/plan-calendar-scope.js'
import {
  acknowledgePlanningAssignment,
  getPlanningAckSummary,
  getPlanningAssignmentByKey,
  isPlanningAckSchemaMissing,
} from '../services/planning-ack.js'
import { assignPlanningWork, listPlanningForUser } from '../services/planning.js'
import {
  notifyNewPlanningAssignments,
  notifyPlannerAssignmentAcknowledged,
} from '../services/telegram-assignment-notify.js'

function isSchemaMissing(err: unknown): boolean {
  const message = err instanceof Error ? err.message : ''
  return (
    message.includes('view_planwork') ||
    message.includes('tbplangingwork') ||
    message.includes('tbiw37n')
  )
}

export function registerPlanningRoutes(
  app: Express,
  pool: Pool,
  sessionSecret: string,
) {
  const requireRead = createRequirePermission(pool, sessionSecret)('planning.read')
  const requireAssign = createRequirePermission(pool, sessionSecret)('planning.assign')

  app.get(
    '/api/v1/plan-calendar/events',
    ...requireRead,
    async (req: Request, res: Response) => {
      const idwkctr = req.authUser?.idwkctr
      const wkctr = (req.authUser?.wkctr || req.authUser?.username || '').trim()
      if (!idwkctr) {
        res.status(401).json({ error: 'UNAUTHORIZED' })
        return
      }
      const now = new Date()
      const year = Math.min(
        2100,
        Math.max(1970, Number(req.query.year) || now.getFullYear()),
      )
      const month = Math.min(
        12,
        Math.max(1, Number(req.query.month) || now.getMonth() + 1),
      )
      try {
        const scope = resolvePlanCalendarScope(req.authUser?.userst)
        const items = await listPlanCalendarEvents(
          pool,
          idwkctr,
          year,
          month,
          wkctr,
          scope,
        )
        res.json(calendarEventsResponseSchema.parse({ items, year, month }))
      } catch (err) {
        if (isSchemaMissing(err)) {
          res.status(503).json({
            error: 'SCHEMA_NOT_READY',
            message: 'Run database/migrations/007_tbplangingwork_view_planwork.sql',
          })
          return
        }
        throw err
      }
    },
  )

  app.get(
    '/api/v1/planning/orders',
    ...requireRead,
    async (req: Request, res: Response) => {
      const idwkctr = req.authUser?.idwkctr
      const wkctr = (req.authUser?.wkctr || req.authUser?.username || '').trim()
      if (!idwkctr) {
        res.status(401).json({ error: 'UNAUTHORIZED' })
        return
      }
      const status = req.query.status === 'closed' ? 'closed' : 'open'
      try {
        const items = await listPlanningForUser(pool, idwkctr, status, wkctr)
        res.json(planningResponseSchema.parse({ items }))
      } catch (err) {
        if (isSchemaMissing(err)) {
          res.status(503).json({
            error: 'SCHEMA_NOT_READY',
            message: 'Run database/migrations/007_tbplangingwork_view_planwork.sql',
          })
          return
        }
        throw err
      }
    },
  )

  app.post(
    '/api/v1/planning/assign',
    ...requireAssign,
    async (req: Request, res: Response) => {
      const user = req.authUser!
      const parsed = planningAssignBodySchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'Invalid body',
          issues: parsed.error.issues,
        })
        return
      }
      const actorWkctr = (user.wkctr || user.username || user.idwkctr || '').trim()
      try {
        const result = await assignPlanningWork(pool, parsed.data, actorWkctr)
        if (!result) {
          res.status(404).json({
            error: 'NOT_FOUND',
            message: 'WO not found or not in CRTD/REL',
          })
          return
        }
        voidAudit(pool, req, {
          action: 'planning.assign',
          resource: 'tbplangingwork',
          resourceId: String(parsed.data.idiw37),
          after: sanitizeAuditPayload({ ...parsed.data, ...result }),
        })
        if (result.assigned.length > 0) {
          void notifyNewPlanningAssignments(
            pool,
            parsed.data.idiw37,
            result.assigned,
            actorWkctr,
          ).catch((err) => console.error('[telegram/assign-notify]', err))
        }
        res.json(
          planningAssignResponseSchema.parse({
            ok: true,
            assigned: result.assigned,
            skipped: result.skipped,
          }),
        )
      } catch (err) {
        if (err instanceof Error && err.message === 'INVALID_WKCTR') {
          res.status(400).json({
            error: 'INVALID_WKCTR',
            message: 'รหัสช่างไม่พบใน tbworkcenter',
          })
          return
        }
        if (err instanceof Error && err.message === 'INVALID_WKCTR_GROUP') {
          res.status(400).json({
            error: 'INVALID_WKCTR_GROUP',
            message: 'ไม่พบกลุ่มช่างหรือไม่มีสมาชิกในกลุ่ม',
          })
          return
        }
        if (isSchemaMissing(err)) {
          res.status(503).json({
            error: 'SCHEMA_NOT_READY',
            message:
              'Run database/migrations/007_tbplangingwork_view_planwork.sql and 038_tbplangingwork_multi_assign.sql',
          })
          return
        }
        const msg = err instanceof Error ? err.message : String(err)
        if (msg.includes('idx_tbplangingwork') || msg.includes('ON CONFLICT')) {
          res.status(503).json({
            error: 'SCHEMA_NOT_READY',
            message: 'Run database/migrations/038_tbplangingwork_multi_assign.sql',
          })
          return
        }
        throw err
      }
    },
  )

  app.post(
    '/api/v1/planning/orders/:idiw37/ack',
    ...requireRead,
    async (req: Request, res: Response) => {
      const user = req.authUser!
      const wkctr = (user.wkctr || user.username || '').trim()
      const idiw37 = Number(req.params.idiw37)
      if (!wkctr || !Number.isFinite(idiw37) || idiw37 <= 0) {
        res.status(400).json({ error: 'VALIDATION_ERROR' })
        return
      }
      try {
        const row = await getPlanningAssignmentByKey(pool, idiw37, wkctr)
        if (!row) {
          res.status(404).json({ error: 'NOT_FOUND', message: 'ไม่พบงานมอบหมายให้คุณ' })
          return
        }
        const ack = await acknowledgePlanningAssignment(pool, row.idplanw, 'web', {
          expectedWkctr: wkctr,
        })
        if (!ack.ok) {
          res.status(403).json({ error: 'FORBIDDEN' })
          return
        }
        voidAudit(pool, req, {
          action: 'assignment.acknowledged',
          resource: 'tbplangingwork',
          resourceId: String(row.idplanw),
          after: { idiw37, wkctr, channel: 'web', alreadyAcked: ack.alreadyAcked },
        })
        if (!ack.alreadyAcked) {
          void notifyPlannerAssignmentAcknowledged(
            pool,
            ack.idiw37,
            ack.wkctr,
            ack.ackAt,
          ).catch((err) => console.error('[telegram/ack-planner]', err))
        }
        res.json(
          planningAckResponseSchema.parse({
            ok: true,
            idiw37: ack.idiw37,
            wkctr: ack.wkctr,
            ackStatus: 'acknowledged',
            ackAt: ack.ackAt,
            alreadyAcked: ack.alreadyAcked,
          }),
        )
      } catch (err) {
        if (isPlanningAckSchemaMissing(err)) {
          res.status(503).json({
            error: 'SCHEMA_MISSING',
            message: 'รัน migration 099_telegram_notify.sql',
          })
          return
        }
        throw err
      }
    },
  )

  app.get(
    '/api/v1/planning/orders/:idiw37/ack-summary',
    ...requireRead,
    async (req: Request, res: Response) => {
      const idiw37 = Number(req.params.idiw37)
      if (!Number.isFinite(idiw37) || idiw37 <= 0) {
        res.status(400).json({ error: 'VALIDATION_ERROR' })
        return
      }
      try {
        const summary = await getPlanningAckSummary(pool, idiw37)
        res.json(planningAckSummaryResponseSchema.parse(summary))
      } catch (err) {
        if (isPlanningAckSchemaMissing(err)) {
          res.status(503).json({
            error: 'SCHEMA_MISSING',
            message: 'รัน migration 099_telegram_notify.sql',
          })
          return
        }
        throw err
      }
    },
  )
}
