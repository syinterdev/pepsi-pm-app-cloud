import type { Express, Response } from 'express'
import type { Pool } from 'pg'
import { createRequireKioskOrPermission } from '../middleware/require-kiosk-or-permission.js'
import { createRequirePermission } from '../middleware/require-permission.js'
import {
  reportsKpiResponseSchema,
  summaryWeeklyResponseSchema,
} from '../schemas/reports.js'
import { activityLogListResponseSchema } from '../schemas/activity-log.js'
import { auditHubResponseSchema } from '../schemas/reports-audit-hub.js'
import { resolveReportsRange } from '../lib/reports-range.js'
import { listActivityLog } from '../services/activity-log.js'
import { getReportsAuditHub } from '../services/reports-audit-hub.js'
import { getReportsKpi, getSummaryWeekly } from '../services/reports.js'

function emptyReportsKpi(from?: string, to?: string, weeksBack = 8) {
  const range = resolveReportsRange({ fromInput: from, toInput: to, weeksBack })
  return {
    range: {
      from: range.from,
      to: range.to,
      fromDate: range.fromDate,
      toDate: range.toDate,
    },
    labels: [] as string[],
    utilization: [] as number[],
    backlogHours: [] as number[],
    weekToWeek: [],
  }
}

function isSchemaMissing(err: unknown): boolean {
  const message = err instanceof Error ? err.message : ''
  return (
    message.includes('does not exist') ||
    message.includes('undefined table') ||
    message.includes('relation')
  )
}

export function registerReportsRoutes(app: Express, pool: Pool, sessionSecret: string) {
  const requireRead = createRequirePermission(pool, sessionSecret)('reports.read')
  const requireBoardKioskOrReports = createRequireKioskOrPermission(
    pool,
    sessionSecret,
    'reports.read',
  )
  const schemaHint =
    'Run migrations for tbmanhours, view_order, view_exportconfirm, view_confirmation'

  app.get('/api/v1/reports/kpi', ...requireBoardKioskOrReports, async (req, res: Response) => {
    const weeksBack = Number(req.query.weeksBack ?? 8)
    const from = typeof req.query.from === 'string' ? req.query.from : undefined
    const to = typeof req.query.to === 'string' ? req.query.to : undefined
    const team = typeof req.query.team === 'string' ? req.query.team : undefined
    try {
      const data = await getReportsKpi(pool, {
        fromInput: from,
        toInput: to,
        weeksBack: Number.isFinite(weeksBack) ? weeksBack : 8,
        team,
      })
      res.json(reportsKpiResponseSchema.parse(data))
    } catch (err) {
      if (isSchemaMissing(err)) {
        const weeks = Number.isFinite(weeksBack) ? weeksBack : 8
        res.json(reportsKpiResponseSchema.parse(emptyReportsKpi(from, to, weeks)))
        return
      }
      throw err
    }
  })

  app.get('/api/v1/reports/audit-hub', ...requireRead, async (_req, res: Response) => {
    try {
      const data = await getReportsAuditHub(pool)
      res.json(auditHubResponseSchema.parse(data))
    } catch (err) {
      if (isSchemaMissing(err)) {
        res.status(503).json({ error: 'SCHEMA_NOT_READY', message: schemaHint })
        return
      }
      throw err
    }
  })

  app.get('/api/v1/reports/activity-log', ...requireRead, async (req, res: Response) => {
    const from = typeof req.query.from === 'string' ? req.query.from : undefined
    const to = typeof req.query.to === 'string' ? req.query.to : undefined
    const q = typeof req.query.q === 'string' ? req.query.q : undefined
    const limit = Number(req.query.limit ?? 100)
    const offset = Number(req.query.offset ?? 0)
    try {
      const data = await listActivityLog(pool, {
        from,
        to,
        q,
        limit: Number.isFinite(limit) ? limit : 100,
        offset: Number.isFinite(offset) ? offset : 0,
      })
      res.json(activityLogListResponseSchema.parse(data))
    } catch (err) {
      if (isSchemaMissing(err)) {
        res.status(503).json({ error: 'SCHEMA_NOT_READY', message: schemaHint })
        return
      }
      const pgCode =
        err && typeof err === 'object' && 'code' in err ? String((err as { code: string }).code) : ''
      if (pgCode === '22P02') {
        res.status(500).json({
          error: 'ACTIVITY_LOG_QUERY',
          message: 'Activity log query failed on non-numeric audit resource id',
        })
        return
      }
      throw err
    }
  })

  app.get('/api/v1/reports/summary-weekly', ...requireBoardKioskOrReports, async (req, res: Response) => {
    const weeksBack = Number(req.query.weeksBack ?? 8)
    const from = typeof req.query.from === 'string' ? req.query.from : undefined
    const to = typeof req.query.to === 'string' ? req.query.to : undefined
    const team = typeof req.query.team === 'string' ? req.query.team : undefined
    try {
      const data = await getSummaryWeekly(pool, {
        fromInput: from,
        toInput: to,
        weeksBack: Number.isFinite(weeksBack) ? weeksBack : 8,
        team,
      })
      res.json(summaryWeeklyResponseSchema.parse(data))
    } catch (err) {
      if (isSchemaMissing(err)) {
        res.status(503).json({ error: 'SCHEMA_NOT_READY', message: schemaHint })
        return
      }
      throw err
    }
  })
}
