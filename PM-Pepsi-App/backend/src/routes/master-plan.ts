import type { Express, Request, Response } from 'express'
import type { Pool } from 'pg'
import multer from 'multer'
import { auditActorFromRequest } from '../lib/audit-log.js'
import { getMulterFileSizeLimit } from '../lib/upload-settings.js'
import { createRequirePermission } from '../middleware/require-permission.js'
import {
  MASTER_PLAN_IMPORT_SPECS,
} from '../lib/master-plan-discipline-guard.js'
import {
  masterPlanChangesQuerySchema,
  masterPlanChangesResponseSchema,
  masterPlanDisciplineSchema,
  masterPlanImportResponseSchema,
  masterPlanImportSpecResponseSchema,
  masterPlanPatchRowBodySchema,
  masterPlanPatchRowResponseSchema,
  masterPlanPublishBodySchema,
  masterPlanPublishResponseSchema,
  masterPlanRowLinksResponseSchema,
  masterPlanSearchResponseSchema,
  masterPlanSheetRowsResponseSchema,
  masterPlanStatusResponseSchema,
  masterPlanWorkbookResponseSchema,
} from '../schemas/master-plan.js'
import {
  exportMasterPlanWorkbook,
  getActiveWorkbook,
  getPublishedWorkbook,
  getMasterPlanRowLinks,
  getMasterPlanStatus,
  getSheetRows,
  importMasterPlanWorkbook,
  listMasterPlanChanges,
  listMasterPlanRowChanges,
  patchMasterPlanRow,
  publishMasterPlanToTasklist,
  searchMasterPlanRows,
  sheetBelongsToDiscipline,
} from '../services/master-plan.js'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: getMulterFileSizeLimit() },
})

export function registerMasterPlanRoutes(app: Express, pool: Pool, sessionSecret: string) {
  const perm = createRequirePermission(pool, sessionSecret)
  const requireRead = perm('master-data.read')
  const requireWrite = perm('master-data.write')

  app.get('/api/v1/master-plan/changes', ...requireRead, async (req: Request, res: Response) => {
    const parsed = masterPlanChangesQuerySchema.safeParse(req.query)
    if (!parsed.success) {
      res.status(400).json({ error: 'INVALID_QUERY', details: parsed.error.flatten() })
      return
    }

    const payload = await listMasterPlanChanges(pool, parsed.data)
    res.json(masterPlanChangesResponseSchema.parse(payload))
  })

  app.get('/api/v1/master-plan/import-spec', ...requireRead, (_req: Request, res: Response) => {
    res.json(masterPlanImportSpecResponseSchema.parse({ items: MASTER_PLAN_IMPORT_SPECS }))
  })

  app.post(
    '/api/v1/master-plan/import',
    ...requireWrite,
    upload.single('file'),
    async (req: Request, res: Response) => {
      const discipline = masterPlanDisciplineSchema.safeParse(
        String(req.body?.discipline ?? '').toUpperCase(),
      )
      if (!discipline.success) {
        res.status(400).json({ error: 'INVALID_DISCIPLINE', message: 'Use EE, ME, or PK' })
        return
      }

      const file = req.file
      if (!file?.buffer?.length) {
        res.status(400).json({ error: 'MISSING_FILE', message: 'Upload an .xlsx file as "file"' })
        return
      }

      const actor = auditActorFromRequest(req)
      const actorId = actor.actorId ?? req.authUser?.username ?? 'unknown'
      const result = await importMasterPlanWorkbook(
        pool,
        file.buffer,
        discipline.data,
        file.originalname || 'import.xlsx',
        actorId,
      )

      if (!result.ok) {
        res.status(result.code === 'STRUCTURE_MISMATCH' ? 422 : 400).json({
          error: result.code,
          message: result.message,
          diff: result.diff,
        })
        return
      }

      res.status(201).json(
        masterPlanImportResponseSchema.parse({
          workbookId: result.workbookId,
          versionNo: result.versionNo,
          status: result.status,
          rowCount: result.rowCount,
          diff: result.diff,
        }),
      )
    },
  )

  app.post('/api/v1/master-plan/publish', ...requireWrite, async (req: Request, res: Response) => {
    const body = masterPlanPublishBodySchema.safeParse(req.body)
    if (!body.success) {
      res.status(400).json({ error: 'INVALID_BODY', details: body.error.flatten() })
      return
    }

    const actor = auditActorFromRequest(req)
    const actorId = actor.actorId ?? req.authUser?.username ?? 'unknown'
    const result = await publishMasterPlanToTasklist(pool, body.data.discipline, actorId, req)
    if (!result.ok) {
      res.status(404).json({ error: result.code, message: result.message })
      return
    }

    res.json(
      masterPlanPublishResponseSchema.parse({
        promotedDraft: result.promotedDraft,
        versionNo: result.versionNo,
        tasklist: result.tasklist,
        publishableRows: result.publishableRows,
        skippedRows: result.skippedRows,
      }),
    )
  })

  app.get(
    '/api/v1/master-plan/rows/:rowId/changes',
    ...requireRead,
    async (req: Request, res: Response) => {
      const rowId = Number(req.params.rowId)
      if (!Number.isFinite(rowId) || rowId <= 0) {
        res.status(400).json({ error: 'INVALID_ROW_ID' })
        return
      }

      const limit = Math.min(500, Math.max(1, Number(req.query.limit ?? 100) || 100))
      const payload = await listMasterPlanRowChanges(pool, rowId, limit)
      if (!payload) {
        res.status(404).json({ error: 'NOT_FOUND', message: 'Row not found' })
        return
      }

      res.json(masterPlanChangesResponseSchema.parse(payload))
    },
  )

  app.get(
    '/api/v1/master-plan/rows/:rowId/links',
    ...requireRead,
    async (req: Request, res: Response) => {
      const rowId = Number(req.params.rowId)
      if (!Number.isFinite(rowId) || rowId <= 0) {
        res.status(400).json({ error: 'INVALID_ROW_ID' })
        return
      }

      const payload = await getMasterPlanRowLinks(pool, rowId)
      if (!payload) {
        res.status(404).json({ error: 'NOT_FOUND', message: 'Row not found' })
        return
      }

      res.json(masterPlanRowLinksResponseSchema.parse(payload))
    },
  )

  app.patch(
    '/api/v1/master-plan/rows/:rowId',
    ...requireWrite,
    async (req: Request, res: Response) => {
      const rowId = Number(req.params.rowId)
      if (!Number.isFinite(rowId) || rowId <= 0) {
        res.status(400).json({ error: 'INVALID_ROW_ID' })
        return
      }

      const body = masterPlanPatchRowBodySchema.safeParse(req.body)
      if (!body.success) {
        res.status(400).json({ error: 'INVALID_BODY', details: body.error.flatten() })
        return
      }

      const actor = auditActorFromRequest(req)
      const actorId = actor.actorId ?? req.authUser?.username ?? 'unknown'
      const result = await patchMasterPlanRow(pool, rowId, body.data, actorId, req)
      if (!result.ok) {
        res.status(result.status).json({ error: result.code, message: result.message })
        return
      }

      res.json(
        masterPlanPatchRowResponseSchema.parse({
          rowId: result.rowId,
          sheetId: result.sheetId,
          cells: result.cells,
          changedFields: result.changedFields,
        }),
      )
    },
  )

  app.get(
    '/api/v1/master-plan/sheets/:sheetId/rows',
    ...requireRead,
    async (req: Request, res: Response) => {
      const sheetId = Number(req.params.sheetId)
      if (!Number.isFinite(sheetId) || sheetId <= 0) {
        res.status(400).json({ error: 'INVALID_SHEET_ID' })
        return
      }

      const offset = Math.max(0, Number(req.query.offset ?? 0) || 0)
      const limit = Math.min(5000, Math.max(1, Number(req.query.limit ?? 2000) || 2000))

      const disciplineRaw = req.query.discipline
      if (typeof disciplineRaw === 'string' && disciplineRaw.trim()) {
        const d = masterPlanDisciplineSchema.safeParse(disciplineRaw.toUpperCase())
        if (d.success) {
          const ok = await sheetBelongsToDiscipline(pool, sheetId, d.data)
          if (!ok) {
            res.status(404).json({ error: 'NOT_FOUND', message: 'Sheet not in published workbook' })
            return
          }
        }
      }

      const payload = await getSheetRows(pool, sheetId, offset, limit)
      if (!payload) {
        res.status(404).json({ error: 'NOT_FOUND', message: 'Sheet not found' })
        return
      }

      res.json(masterPlanSheetRowsResponseSchema.parse(payload))
    },
  )

  app.get(
    '/api/v1/master-plan/:discipline/search',
    ...requireRead,
    async (req: Request, res: Response) => {
      const parsed = masterPlanDisciplineSchema.safeParse(String(req.params.discipline ?? '').toUpperCase())
      if (!parsed.success) {
        res.status(400).json({ error: 'INVALID_DISCIPLINE', message: 'Use EE, ME, or PK' })
        return
      }

      const q = typeof req.query.q === 'string' ? req.query.q : ''
      const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 50) || 50))
      const payload = await searchMasterPlanRows(pool, parsed.data, q, limit)
      res.json(masterPlanSearchResponseSchema.parse(payload))
    },
  )

  app.get(
    '/api/v1/master-plan/:discipline/status',
    ...requireRead,
    async (req: Request, res: Response) => {
      const parsed = masterPlanDisciplineSchema.safeParse(String(req.params.discipline ?? '').toUpperCase())
      if (!parsed.success) {
        res.status(400).json({ error: 'INVALID_DISCIPLINE', message: 'Use EE, ME, or PK' })
        return
      }

      const payload = await getMasterPlanStatus(pool, parsed.data)
      res.json(masterPlanStatusResponseSchema.parse(payload))
    },
  )

  app.get(
    '/api/v1/master-plan/:discipline/export',
    ...requireRead,
    async (req: Request, res: Response) => {
      const parsed = masterPlanDisciplineSchema.safeParse(String(req.params.discipline ?? '').toUpperCase())
      if (!parsed.success) {
        res.status(400).json({ error: 'INVALID_DISCIPLINE', message: 'Use EE, ME, or PK' })
        return
      }

      const statusRaw = String(req.query.status ?? 'published').toLowerCase()
      const status = statusRaw === 'draft' ? 'draft' : 'published'
      const exported = await exportMasterPlanWorkbook(pool, parsed.data, status)
      if (!exported) {
        res.status(404).json({
          error: 'NOT_FOUND',
          message: `No ${status} workbook for ${parsed.data}`,
        })
        return
      }

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      )
      res.setHeader('Content-Disposition', `attachment; filename="${exported.filename}"`)
      res.send(exported.buffer)
    },
  )

  app.get('/api/v1/master-plan/:discipline', ...requireRead, async (req: Request, res: Response) => {
    const parsed = masterPlanDisciplineSchema.safeParse(String(req.params.discipline ?? '').toUpperCase())
    if (!parsed.success) {
      res.status(400).json({ error: 'INVALID_DISCIPLINE', message: 'Use EE, ME, or PK' })
      return
    }

    const workbook = await getActiveWorkbook(pool, parsed.data)
    if (!workbook) {
      res.status(404).json({
        error: 'NOT_FOUND',
        message: `No master plan for ${parsed.data}. Import the ${parsed.data} Excel workbook.`,
      })
      return
    }

    res.json(masterPlanWorkbookResponseSchema.parse(workbook))
  })
}
