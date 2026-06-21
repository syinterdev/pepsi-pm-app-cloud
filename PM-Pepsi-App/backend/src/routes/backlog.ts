import type { Express, Request, Response } from 'express'
import type { Pool } from 'pg'
import { createRequirePermission } from '../middleware/require-permission.js'
import {
  backlogEventsResponseSchema,
  backlogFilterOptionsResponseSchema,
  backlogFilterDetailResponseSchema,
  backlogManhourResponseSchema,
  backlogManhourSearchBodySchema,
  backlogSearchBodySchema,
} from '../schemas/backlog.js'
import {
  getBacklogFilterDetail,
  getBacklogManhourSummary,
  listBacklogEvents,
  listBacklogFilterOptions,
} from '../services/backlog.js'

function isSchemaMissing(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err)
  return (
    message.includes('view_order') ||
    message.includes('tbiw37n') ||
    message.includes('tbactivitytype') ||
    message.includes('tbwkzb')
  )
}

export function registerBacklogRoutes(
  app: Express,
  pool: Pool,
  sessionSecret: string,
) {
  const requireRead = createRequirePermission(pool, sessionSecret)('backlog.read')

  app.get(
    '/api/v1/backlog/filter-options',
    ...requireRead,
    async (_req: Request, res: Response) => {
      try {
        const data = await listBacklogFilterOptions(pool)
        res.json(backlogFilterOptionsResponseSchema.parse(data))
      } catch (err) {
        if (isSchemaMissing(err)) {
          res.status(503).json({
            error: 'SCHEMA_NOT_READY',
            message:
              'Run migrations 002_tbactivitytype.sql and 004_tbiw37n_calendar.sql',
          })
          return
        }
        throw err
      }
    },
  )

  app.post(
    '/api/v1/backlog/events',
    ...requireRead,
    async (req: Request, res: Response) => {
      const parsed = backlogSearchBodySchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'Invalid backlog search body',
          issues: parsed.error.issues,
        })
        return
      }
      const body = parsed.data
      try {
        const items = await listBacklogEvents(pool, body)
        res.json(
          backlogEventsResponseSchema.parse({
            items,
            year: body.year,
            month: body.month,
          }),
        )
      } catch (err) {
        if (isSchemaMissing(err)) {
          res.status(503).json({
            error: 'SCHEMA_NOT_READY',
            message:
              'Run migrations 002_tbactivitytype.sql and 004_tbiw37n_calendar.sql',
          })
          return
        }
        throw err
      }
    },
  )

  app.post(
    '/api/v1/backlog/filter-detail',
    ...requireRead,
    async (req: Request, res: Response) => {
      const parsed = backlogSearchBodySchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'Invalid backlog filter detail body',
          issues: parsed.error.issues,
        })
        return
      }
      const body = parsed.data
      try {
        const detail = await getBacklogFilterDetail(pool, body)
        res.json(backlogFilterDetailResponseSchema.parse(detail))
      } catch (err) {
        if (isSchemaMissing(err)) {
          res.status(503).json({
            error: 'SCHEMA_NOT_READY',
            message:
              'Run migrations 002_tbactivitytype.sql, 004_tbiw37n_calendar.sql, 005_tbwkzb_tbfunctional.sql',
          })
          return
        }
        throw err
      }
    },
  )

  app.post(
    '/api/v1/backlog/manhour-summary',
    ...requireRead,
    async (req: Request, res: Response) => {
      const parsed = backlogManhourSearchBodySchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'Invalid backlog manhour body',
          issues: parsed.error.issues,
        })
        return
      }
      const body = parsed.data
      try {
        const summary = await getBacklogManhourSummary(pool, body)
        res.json(backlogManhourResponseSchema.parse(summary))
      } catch (err) {
        if (isSchemaMissing(err)) {
          res.status(503).json({
            error: 'SCHEMA_NOT_READY',
            message:
              'Run migrations 002_tbactivitytype.sql, 004_tbiw37n_calendar.sql, 005_tbwkzb_tbfunctional.sql',
          })
          return
        }
        throw err
      }
    },
  )
}
