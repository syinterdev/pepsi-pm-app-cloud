import { getMulterFileSizeLimit } from '../lib/upload-settings.js'
import type { Express, Request, Response } from 'express'
import multer from 'multer'
import type { Pool } from 'pg'
import { hasPermission } from '../lib/has-permission.js'
import { voidAudit, sanitizeAuditPayload } from '../lib/audit-mutation.js'
import { createRequirePermission } from '../middleware/require-permission.js'
import {
  manhourChartBreakdownResponseSchema,
  manhourChartPerformanceResponseSchema,
  manhourHrConfirmReportResponseSchema,
  manhourZbByPersonResponseSchema,
  manhourImportResponseSchema,
  manhourItemSchema,
  manhourHrListResponseSchema,
  manhourListResponseSchema,
  manhourOkResponseSchema,
  manhourUpsertBodySchema,
  manhoursSummaryResponseSchema,
  worktimeSummaryOverallResponseSchema,
  worktimeMeResponseSchema,
  worktimePlanningResponseSchema,
  engUtilizationDailyResponseSchema,
} from '../schemas/manhours.js'
import {
  getManhourChartBreakdown,
  getManhourChartPerformance,
  resolveManhourChartRange,
} from '../services/manhour-chart.js'
import { getManhoursHrUtilization } from '../services/manhours-hr-utilization.js'
import { getManhourHrConfirmReport } from '../services/manhour-hr-confirm.js'
import { getManhourZbByPerson } from '../services/manhour-zb-by-person.js'
import { getWorktimeSummaryOverall } from '../services/worktime-summary-overall.js'
import {
  deleteManhour,
  getManhour,
  getManhoursWeeklySummary,
  getWorktimeTotal,
  importManhoursFile,
  listManhours,
  listWorktimeDaily,
  upsertManhour,
} from '../services/manhours.js'
import { listWorktimePlanningAssignments } from '../services/worktime-planning.js'
import { loadEngUtilizationDailyFromIw47Xlsx } from '../services/eng-utilization-daily.js'
import { getEngUtilizationSummary } from '../services/eng-utilization-summary.js'
import {
  canViewTeamManhours,
  resolveSelfWkctrCode,
  resolveSelfWorkcenterId,
} from '../lib/manhours-team-access.js'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: getMulterFileSizeLimit() },
})

function isSchemaMissing(err: unknown): boolean {
  const message = err instanceof Error ? err.message : ''
  return (
    message.includes('tbmanhours') ||
    message.includes('stworkday') ||
    message.includes('uq_tbmanhours_wkctr_period') ||
    message.includes('does not exist') ||
    message.includes('undefined table') ||
    message.includes('relation')
  )
}

function resolveIdwkctr(auth: {
  accountType: string
  idwkctr?: string
  memId?: string
}): string | null {
  if (auth.accountType === 'workcenter' && auth.idwkctr) return auth.idwkctr
  return null
}

export function registerManhoursRoutes(app: Express, pool: Pool, sessionSecret: string) {
  const perm = createRequirePermission(pool, sessionSecret)
  const requireManhoursRead = perm('manhours.read')
  const requireManhoursAdmin = perm('manhours.admin')
  const requireManhoursImport = perm('manhours.import')
  const schemaHint = 'Run migrations 010_tbmanhours.sql and 042_tbmanhours_full_api.sql'

  async function isManhoursAdmin(req: Request): Promise<boolean> {
    const user = req.authUser
    if (!user) return false
    return hasPermission(pool, user.userst, 'manhours.admin')
  }

  async function resolveChartIdwkctr(req: Request): Promise<string | null> {
    const requested = typeof req.query.idwkctr === 'string' ? req.query.idwkctr.trim() : ''
    if (requested && (await isManhoursAdmin(req))) return requested
    return resolveIdwkctr(req.authUser!)
  }

  app.get('/api/v1/manhours/chart/performance', ...requireManhoursRead, async (req, res: Response) => {
    const idwkctr = await resolveChartIdwkctr(req)
    if (!idwkctr) {
      res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Workcenter session required' })
      return
    }
    const range = resolveManhourChartRange(
      typeof req.query.from === 'string' ? req.query.from : undefined,
      typeof req.query.to === 'string' ? req.query.to : undefined,
    )
    try {
      const data = await getManhourChartPerformance(pool, idwkctr, range)
      if (!data) {
        res.status(404).json({ error: 'NOT_FOUND' })
        return
      }
      res.json(manhourChartPerformanceResponseSchema.parse(data))
    } catch (err) {
      if (isSchemaMissing(err)) {
        res.status(503).json({ error: 'SCHEMA_NOT_READY', message: schemaHint })
        return
      }
      throw err
    }
  })

  app.get('/api/v1/manhours/chart/breakdown', ...requireManhoursRead, async (req, res: Response) => {
    const idwkctr = await resolveChartIdwkctr(req)
    if (!idwkctr) {
      res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Workcenter session required' })
      return
    }
    const range = resolveManhourChartRange(
      typeof req.query.from === 'string' ? req.query.from : undefined,
      typeof req.query.to === 'string' ? req.query.to : undefined,
    )
    try {
      const data = await getManhourChartBreakdown(pool, idwkctr, range)
      if (!data) {
        res.status(404).json({ error: 'NOT_FOUND' })
        return
      }
      res.json(manhourChartBreakdownResponseSchema.parse(data))
    } catch (err) {
      if (isSchemaMissing(err)) {
        res.status(503).json({ error: 'SCHEMA_NOT_READY', message: schemaHint })
        return
      }
      throw err
    }
  })

  app.get('/api/v1/manhours/chart/hr-confirm', ...requireManhoursRead, async (req, res: Response) => {
    const period = typeof req.query.period === 'string' ? req.query.period : undefined
    const month = typeof req.query.month === 'string' ? req.query.month : undefined
    const week = typeof req.query.week === 'string' ? req.query.week : undefined
    const from = typeof req.query.from === 'string' ? req.query.from : undefined
    const to = typeof req.query.to === 'string' ? req.query.to : undefined
    const idwkctrgroup =
      (await isManhoursAdmin(req)) && typeof req.query.idwkctrgroup === 'string'
        ? req.query.idwkctrgroup.trim()
        : undefined
    const teamView = await canViewTeamManhoursForReq(req)
    const filterIdwkctr = teamView ? undefined : resolveSelfWorkcenterId(req.authUser!) ?? undefined
    try {
      const data = await getManhourHrConfirmReport(pool, {
        period,
        month,
        week,
        from,
        to,
        idwkctrgroup,
        filterIdwkctr,
      })
      res.json(manhourHrConfirmReportResponseSchema.parse(data))
    } catch (err) {
      if (isSchemaMissing(err)) {
        res.status(503).json({ error: 'SCHEMA_NOT_READY', message: schemaHint })
        return
      }
      const msg = err instanceof Error ? err.message : 'Invalid period'
      res.status(400).json({ error: 'VALIDATION_ERROR', message: msg })
    }
  })

  async function canViewTeamManhoursForReq(req: Request): Promise<boolean> {
    const user = req.authUser!
    return canViewTeamManhours(user, await isManhoursAdmin(req))
  }

  app.get('/api/v1/manhours/chart/zb-by-person', ...requireManhoursRead, async (req, res: Response) => {
    const from = typeof req.query.from === 'string' ? req.query.from : undefined
    const to = typeof req.query.to === 'string' ? req.query.to : undefined
    const teamView = await canViewTeamManhoursForReq(req)
    const filterWkctr = teamView ? undefined : resolveSelfWkctrCode(req.authUser!) ?? undefined
    try {
      const data = await getManhourZbByPerson(pool, { fromInput: from, toInput: to, filterWkctr })
      res.json(manhourZbByPersonResponseSchema.parse(data))
    } catch (err) {
      if (isSchemaMissing(err)) {
        res.status(503).json({ error: 'SCHEMA_NOT_READY', message: schemaHint })
        return
      }
      throw err
    }
  })

  app.get('/api/v1/manhours/summary', ...requireManhoursRead, async (req, res: Response) => {
    const requestedId = typeof req.query.idwkctr === 'string' ? req.query.idwkctr.trim() : ''
    const idwkctr =
      (await isManhoursAdmin(req)) && requestedId ? requestedId : resolveIdwkctr(req.authUser!)
    if (!idwkctr) {
      res.json(manhoursSummaryResponseSchema.parse({ weeks: [] }))
      return
    }
    const daysBack = Number(req.query.daysBack ?? 56)

    try {
      const weeks = await getManhoursWeeklySummary(
        pool,
        idwkctr,
        Number.isFinite(daysBack) ? daysBack : 56,
      )
      res.json(manhoursSummaryResponseSchema.parse({ weeks }))
    } catch (err) {
      if (isSchemaMissing(err)) {
        res.status(503).json({ error: 'SCHEMA_NOT_READY', message: schemaHint })
        return
      }
      throw err
    }
  })

  app.get('/api/v1/manhours/hr', ...requireManhoursRead, async (req, res: Response) => {
    const sessionWkctr = (req.authUser?.wkctr ?? '').trim()
    const wkctr =
      (await isManhoursAdmin(req)) &&
      typeof req.query.wkctr === 'string' &&
      req.query.wkctr.trim()
        ? req.query.wkctr.trim()
        : sessionWkctr
    const from = typeof req.query.from === 'string' ? req.query.from : undefined
    const to = typeof req.query.to === 'string' ? req.query.to : undefined
    if (!wkctr) {
      const emptyRange = resolveManhourChartRange(from, to)
      res.json(
        manhourHrListResponseSchema.parse({
          items: [],
          totalRows: 0,
          range: emptyRange,
          utilization: {
            team: { confirmHours: 0, manhourHours: 0, utilizationPercent: 0 },
            byPerson: [],
            manhourWorkdayFrom: null,
            manhourWorkdayTo: null,
          },
        }),
      )
      return
    }
    try {
      const [data, util] = await Promise.all([
        listManhours(pool, {
          q: typeof req.query.q === 'string' ? req.query.q : undefined,
          filterWkctr: wkctr,
          from,
          to,
          limit: Number(req.query.limit ?? 500),
          offset: Number(req.query.offset ?? 0),
        }),
        getManhoursHrUtilization(pool, wkctr, { fromInput: from, toInput: to }),
      ])
      res.json(
        manhourHrListResponseSchema.parse({
          ...data,
          range: util.range,
          utilization: {
            team: util.team,
            byPerson: util.byPerson,
            manhourWorkdayFrom: util.manhourWorkdayFrom,
            manhourWorkdayTo: util.manhourWorkdayTo,
          },
        }),
      )
    } catch (err) {
      if (isSchemaMissing(err)) {
        res.status(503).json({ error: 'SCHEMA_NOT_READY', message: schemaHint })
        return
      }
      throw err
    }
  })

  app.get('/api/v1/manhours', ...requireManhoursRead, async (req, res: Response) => {
    const ownId = resolveIdwkctr(req.authUser!)
    const idwkctr =
      (await isManhoursAdmin(req)) && typeof req.query.idwkctr === 'string'
        ? req.query.idwkctr.trim()
        : (ownId ?? '')
    try {
      const data = await listManhours(pool, {
        q: typeof req.query.q === 'string' ? req.query.q : undefined,
        idwkctr: idwkctr || undefined,
        from: typeof req.query.from === 'string' ? req.query.from : undefined,
        to: typeof req.query.to === 'string' ? req.query.to : undefined,
        limit: Number(req.query.limit ?? 200),
        offset: Number(req.query.offset ?? 0),
      })
      res.json(manhourListResponseSchema.parse(data))
    } catch (err) {
      if (isSchemaMissing(err)) {
        res.status(503).json({ error: 'SCHEMA_NOT_READY', message: schemaHint })
        return
      }
      throw err
    }
  })

  app.get('/api/v1/manhours/:idmanhour', ...requireManhoursRead, async (req, res: Response) => {
    const id = Number(req.params.idmanhour)
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid idmanhour' })
      return
    }
    try {
      const item = await getManhour(pool, id)
      if (!item) {
        res.status(404).json({ error: 'NOT_FOUND' })
        return
      }
      if (!(await isManhoursAdmin(req)) && item.idwkctr !== resolveIdwkctr(req.authUser!)) {
        res.status(403).json({ error: 'FORBIDDEN' })
        return
      }
      res.json(manhourItemSchema.parse(item))
    } catch (err) {
      if (isSchemaMissing(err)) {
        res.status(503).json({ error: 'SCHEMA_NOT_READY', message: schemaHint })
        return
      }
      throw err
    }
  })

  app.post('/api/v1/manhours', ...requireManhoursAdmin, async (req, res: Response) => {
    const parsed = manhourUpsertBodySchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: 'VALIDATION_ERROR', message: parsed.error.message })
      return
    }
    try {
      const out = await upsertManhour(pool, parsed.data)
      voidAudit(pool, req, {
        action: 'manhours.write',
        resource: 'tbmanhours',
        resourceId: String(out.idmanhour),
        after: sanitizeAuditPayload(parsed.data),
      })
      res.json(manhourOkResponseSchema.parse({ ok: true, idmanhour: out.idmanhour }))
    } catch (err) {
      if (isSchemaMissing(err)) {
        res.status(503).json({ error: 'SCHEMA_NOT_READY', message: schemaHint })
        return
      }
      res.status(400).json({ error: 'MANHOUR_ERROR', message: err instanceof Error ? err.message : String(err) })
    }
  })

  app.put('/api/v1/manhours/:idmanhour', ...requireManhoursAdmin, async (req, res: Response) => {
    const id = Number(req.params.idmanhour)
    const parsed = manhourUpsertBodySchema.safeParse(req.body)
    if (!Number.isInteger(id) || id <= 0 || !parsed.success) {
      res.status(400).json({ error: 'VALIDATION_ERROR', message: parsed.success ? 'Invalid idmanhour' : parsed.error.message })
      return
    }
    try {
      const out = await upsertManhour(pool, parsed.data, id)
      voidAudit(pool, req, {
        action: 'manhours.write',
        resource: 'tbmanhours',
        resourceId: String(out.idmanhour),
        after: sanitizeAuditPayload(parsed.data),
      })
      res.json(manhourOkResponseSchema.parse({ ok: true, idmanhour: out.idmanhour }))
    } catch (err) {
      if (isSchemaMissing(err)) {
        res.status(503).json({ error: 'SCHEMA_NOT_READY', message: schemaHint })
        return
      }
      if (err instanceof Error && err.message === 'NOT_FOUND') {
        res.status(404).json({ error: 'NOT_FOUND' })
        return
      }
      res.status(400).json({ error: 'MANHOUR_ERROR', message: err instanceof Error ? err.message : String(err) })
    }
  })

  app.delete('/api/v1/manhours/:idmanhour', ...requireManhoursAdmin, async (req, res: Response) => {
    const id = Number(req.params.idmanhour)
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid idmanhour' })
      return
    }
    try {
      const ok = await deleteManhour(pool, id)
      if (!ok) {
        res.status(404).json({ error: 'NOT_FOUND' })
        return
      }
      voidAudit(pool, req, {
        action: 'manhours.delete',
        resource: 'tbmanhours',
        resourceId: String(id),
      })
      res.json(manhourOkResponseSchema.parse({ ok: true, idmanhour: id }))
    } catch (err) {
      if (isSchemaMissing(err)) {
        res.status(503).json({ error: 'SCHEMA_NOT_READY', message: schemaHint })
        return
      }
      throw err
    }
  })

  app.post('/api/v1/manhours/import', ...requireManhoursImport, upload.single('file'), async (req, res: Response) => {
    if (!req.file) {
      res.status(400).json({ error: 'VALIDATION_ERROR', message: 'file is required' })
      return
    }
    try {
      const result = await importManhoursFile(pool, {
        fileName: req.file.originalname,
        buffer: req.file.buffer,
      })
      voidAudit(pool, req, {
        action: 'manhours.import',
        resource: 'tbmanhours',
        after: { ...result, fileName: req.file.originalname },
      })
      res.json(manhourImportResponseSchema.parse(result))
    } catch (err) {
      if (isSchemaMissing(err)) {
        res.status(503).json({ error: 'SCHEMA_NOT_READY', message: schemaHint })
        return
      }
      res.status(400).json({ error: 'IMPORT_ERROR', message: err instanceof Error ? err.message : String(err) })
    }
  })

  app.get('/api/v1/worktime/planning', ...requireManhoursRead, async (req, res: Response) => {
    const requested = typeof req.query.idwkctr === 'string' ? req.query.idwkctr.trim() : ''
    const idwkctr =
      (await isManhoursAdmin(req)) && requested ? requested : resolveIdwkctr(req.authUser!)
    if (!idwkctr) {
      res.json(worktimePlanningResponseSchema.parse({ idwkctr: '', items: [] }))
      return
    }
    try {
      const items = await listWorktimePlanningAssignments(pool, idwkctr, {
        limit: Number(req.query.limit ?? 500),
      })
      res.json(worktimePlanningResponseSchema.parse({ idwkctr, items }))
    } catch (err) {
      if (isSchemaMissing(err)) {
        res.status(503).json({ error: 'SCHEMA_NOT_READY', message: schemaHint })
        return
      }
      const msg = err instanceof Error ? err.message : ''
      if (
        msg.includes('tbplangingwork') ||
        msg.includes('tbiw37n') ||
        msg.includes('does not exist') ||
        msg.includes('relation')
      ) {
        res.status(503).json({
          error: 'SCHEMA_NOT_READY',
          message: 'Run database/migrations/007_tbplangingwork_view_planwork.sql',
        })
        return
      }
      throw err
    }
  })

  app.get('/api/v1/worktime/me', ...requireManhoursRead, async (req, res: Response) => {
    const idwkctr = resolveIdwkctr(req.authUser!)
    if (!idwkctr) {
      res.json(worktimeMeResponseSchema.parse({ idwkctr: '', total: null, items: [] }))
      return
    }
    try {
      const [total, items] = await Promise.all([
        getWorktimeTotal(pool, idwkctr),
        listWorktimeDaily(pool, idwkctr, {
          from: typeof req.query.from === 'string' ? req.query.from : undefined,
          to: typeof req.query.to === 'string' ? req.query.to : undefined,
          limit: Number(req.query.limit ?? 200),
        }),
      ])
      res.json(worktimeMeResponseSchema.parse({ idwkctr, total, items }))
    } catch (err) {
      if (isSchemaMissing(err)) {
        res.status(503).json({ error: 'SCHEMA_NOT_READY', message: schemaHint })
        return
      }
      throw err
    }
  })

  app.get('/api/v1/worktime/summary-overall', ...requireManhoursRead, async (req, res: Response) => {
    const year = Number(req.query.year ?? new Date().getFullYear())
    const month = typeof req.query.month === 'string' ? Number(req.query.month) : undefined
    const weekLabel = typeof req.query.week === 'string' ? req.query.week : undefined
    const fromInput = typeof req.query.from === 'string' ? req.query.from : undefined
    const toInput = typeof req.query.to === 'string' ? req.query.to : undefined
    try {
      const data = await getWorktimeSummaryOverall(pool, { year, month, weekLabel, fromInput, toInput })
      res.json(worktimeSummaryOverallResponseSchema.parse(data))
    } catch (err) {
      if (isSchemaMissing(err)) {
        res.status(503).json({ error: 'SCHEMA_NOT_READY', message: schemaHint })
        return
      }
      const msg = err instanceof Error ? err.message : ''
      res.status(400).json({ error: 'VALIDATION_ERROR', message: msg || 'Invalid request' })
    }
  })

  app.get(
    '/api/v1/worktime/eng-utilization/summary',
    ...requireManhoursRead,
    async (req, res: Response) => {
      try {
        const period = typeof req.query.period === 'string' ? req.query.period : undefined
        const week = typeof req.query.week === 'string' ? req.query.week : undefined
        const month = typeof req.query.month === 'string' ? req.query.month : undefined
        const year = typeof req.query.year === 'string' ? Number(req.query.year) : undefined
        const from = typeof req.query.from === 'string' ? req.query.from : undefined
        const to = typeof req.query.to === 'string' ? req.query.to : undefined

        const data = await getEngUtilizationSummary(pool, { period, week, month, year, from, to })
        res.json(engUtilizationDailyResponseSchema.parse(data))
      } catch (err) {
        if (isSchemaMissing(err)) {
          res.status(503).json({ error: 'SCHEMA_NOT_READY', message: schemaHint })
          return
        }
        throw err
      }
    },
  )
}
