import type { Express, Request, Response } from 'express'
import type { Pool } from 'pg'
import { createRequireKioskOrPermission } from '../middleware/require-kiosk-or-permission.js'
import { dashboardSummaryQuerySchema, dashboardSummarySchema } from '../schemas/dashboard.js'
import { getDashboardSummary } from '../services/dashboard.js'

export function registerDashboardRoutes(
  app: Express,
  pool: Pool,
  sessionSecret: string,
) {
  const requireRead = createRequireKioskOrPermission(pool, sessionSecret, 'dashboard.read')

  app.get(
    '/api/v1/dashboard/summary',
    ...requireRead,
    async (req: Request, res: Response) => {
      try {
        const q = dashboardSummaryQuerySchema.parse(req.query)
        const summary = await getDashboardSummary(pool, { team: q.team })
        res.json(dashboardSummarySchema.parse(summary))
      } catch (err) {
        const message = err instanceof Error ? err.message : ''
        if (message.includes('tbiw37n')) {
          res.status(503).json({
            error: 'SCHEMA_NOT_READY',
            message: 'Run migrations 004 and 006 on PostgreSQL',
          })
          return
        }
        throw err
      }
    },
  )
}
