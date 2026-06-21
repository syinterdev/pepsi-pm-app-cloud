import {
  parseConfirmImagePhase,
  normalizeConfirmImageCaption,
} from '../lib/confirm-image-phase.js'
import { getMulterFileSizeLimit } from '../lib/upload-settings.js'
import type { Express, Request, Response } from 'express'
import type { Pool } from 'pg'
import multer from 'multer'
import * as XLSX from 'xlsx'
import { z } from 'zod'
import {
  bulkTeamAuditFields,
  massConfirmAuditFields,
} from '../lib/audit-bulk-payload.js'
import { voidAudit, sanitizeAuditPayload } from '../lib/audit-mutation.js'
import { recordRevision } from '../lib/resource-revision.js'
import { resolveConfirmationExportScope } from '../lib/confirmation-export-scope.js'
import { createRequirePermission } from '../middleware/require-permission.js'
import {
  confirmationAddCloseBodySchema,
  confirmationAddCloseResponseSchema,
  confirmationMassCloseBodySchema,
  confirmationMassCloseResponseSchema,
  MASS_CONFIRM_MAX_ITEMS,
  confirmationByWorkOrderResponseSchema,
  confirmationCommentBodySchema,
  confirmationCommentResponseSchema,
  confirmationCommentsResponseSchema,
  confirmationDeleteCloseResponseSchema,
  personnelClosesResponseSchema,
  personnelCloseIdParamSchema,
  confirmationImageDataResponseSchema,
  confirmationImagesResponseSchema,
  confirmationImportPreviewResponseSchema,
  confirmationImportResponseSchema,
  confirmationExportResponseSchema,
  confirmationPreviewQuerySchema,
  confirmationPreviewResponseSchema,
  confirmationOkResponseSchema,
  workcentersResponseSchema,
  workOrderDetailSchema,
  workOrderFilterOptionsResponseSchema,
  workOrderModalDetailResponseSchema,
  workOrderPlanningBatchBodySchema,
  workOrderPlanningBatchResponseSchema,
  workOrderPlanningOkResponseSchema,
  workOrderPlanningUpsertBodySchema,
  workOrderFilterDetailResponseSchema,
  workOrderSearchBodySchema,
  workOrderSearchResponseSchema,
  workOrderTeamBulkBodySchema,
  workOrderTeamBulkResponseSchema,
  workOrderTeamPatchResponseSchema,
  workOrderTeamPatchSchema,
  workOrdersResponseSchema,
} from '../schemas/work-orders.js'
import {
  woPmNoteBodySchema,
  woPmNoteResponseSchema,
  woPmPage2BodySchema,
  woPmPage2ResponseSchema,
  woPmReadingBodySchema,
  woPmReadingResponseSchema,
} from '../schemas/pm-execution.js'
import {
  deleteWorkOrderPlanning,
  enrichWorkOrderDetailForUser,
  getWorkOrderModalDetail,
  listWorkOrderFilterOptions,
  assignWorkOrderPlanningBatch,
  listWorkOrders,
  getWorkOrderFilterDetail,
  searchWorkOrders,
  resolveWorkOrderIdiw37,
  upsertWorkOrderPlanning,
  updateWorkOrderTeam,
  updateWorkOrderTeamBatch,
} from '../services/work-orders.js'
import { notifyNewPlanningAssignments } from '../services/telegram-assignment-notify.js'
import {
  createWoPmReading,
  appendWoPmNote,
} from '../services/wo-pm-execution-data.js'
import { updateWoPmPage2Equipment } from '../services/wo-pm-page2.js'
import {
  buildPmReadingsXlsxBuffer,
  listPmReadingExportRowsForWo,
} from '../services/pm-readings-query.js'
import {
  addConfirmationClose,
  addConfirmationCloseBatch,
  createConfirmationComment,
  createConfirmationImageRecord,
  deleteConfirmationComment,
  deleteConfirmationClose,
  deleteConfirmationImageRecord,
  findWorkOrderByWkorder,
  getConfirmationByWorkOrder,
  readConfirmationImageBuffer,
  unlinkLegacyConfirmationImageFile,
  importConfirmFile,
  previewConfirmFile,
  listConfirmationExportRows,
  listConfirmationPreviewRows,
  listConfirmationComments,
  listConfirmationImages,
  listWorkcenters,
  updateConfirmationComment,
} from '../services/confirmation.js'
import {
  buildConfirmationExportSapCsv,
  confirmationSapCsvFilename,
} from '../services/confirmation-export-csv.js'
import { buildConfirmationExportXlsxBuffer } from '../services/confirmation-export-xlsx.js'
import {
  addPersonnelClose,
  deletePersonnelClose,
  listPersonnelCloses,
} from '../services/personnel-close.js'
import { convertConfirmImageToWebp } from '../services/confirm-image.js'
import {
  confirmQcPendingResponseSchema,
  confirmQcRejectBodySchema,
  confirmQcSnapshotResponseSchema,
} from '../schemas/confirm-qc.js'
import {
  getConfirmQcSnapshot,
  listConfirmQcPending,
  setConfirmQcStatus,
} from '../services/confirm-qc.js'
import {
  confirmationMassExportBodySchema,
  massConfirmExportSummarySchema,
  qcApproveBatchBodySchema,
  qcApproveBatchResponseSchema,
} from '../schemas/confirmation-mass-export.js'
import {
  approveConfirmQcBatch,
  getMassConfirmExportSummary,
  listConfirmationExportRowsForBatch,
} from '../services/confirmation-mass-export.js'

const listQuerySchema = z.object({
  q: z.string().optional(),
  status: z.string().optional(),
})

const confirmationWkorderParamSchema = z.object({
  wkorder: z.string().min(1),
})

const confirmationIdParamSchema = z.object({
  idiw37: z.coerce.number().int().positive(),
})

const confirmationCloseIdParamSchema = z.object({
  idclose: z.coerce.number().int().positive(),
})

const confirmationCommentIdParamSchema = z.object({
  idcom: z.coerce.number().int().positive(),
})

const confirmationImageIdParamSchema = z.object({
  idcimg: z.coerce.number().int().positive(),
})

const confirmationIwiwParamSchema = z.object({
  idiw37: z.coerce.number().int().positive(),
})

const modalDetailQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

function parseIdiw37nQuery(raw: unknown): number[] | undefined {
  if (typeof raw !== 'string' || !raw.trim()) return undefined
  const ids = raw
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n) && n > 0)
  return ids.length ? [...new Set(ids)] : undefined
}

function isSchemaMissing(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err)
  return (
    message.includes('tbiw37n') ||
    message.includes('view_order') ||
    message.includes('tbactivitytype') ||
    message.includes('tbwkzb') ||
    message.includes('tbfunctional') ||
    message.includes('tbwkstatus') ||
    message.includes('tbworkcenter') ||
    message.includes('tbwkctrgroup') ||
    message.includes('tbplangingwork') ||
    message.includes('tbtasklist') ||
    message.includes('tbmainteanance') ||
    message.includes('tbzone') ||
    message.includes('tbproductline') ||
    message.includes('tblineschdul') ||
    message.includes('tbmaterial') ||
    message.includes('tbcofirm') ||
    message.includes('view_confirmation') ||
    message.includes('view_exportconfirm') ||
    message.includes('tbconfirmimg') ||
    message.includes('img_data') ||
    message.includes('tbconfirmcom') ||
    message.includes('tbwrkclose') ||
    message.includes('view_personelclose') ||
    message.includes('confirm_qc') ||
    message.includes('tbwo_pm_note_entry') ||
    message.includes('tbwo_pm_note') ||
    message.includes('tbwo_pm_reading')
  )
}

export function registerWorkOrderRoutes(
  app: Express,
  pool: Pool,
  sessionSecret: string,
) {
  const perm = createRequirePermission(pool, sessionSecret)
  const requireWoRead = perm('work-orders.read')
  const requireWoWrite = perm('work-orders.write')
  const requirePlanningWrite = perm('planning.write')
  const requirePlanningAssign = perm('planning.assign')
  const requirePlanningDelete = perm('planning.delete')
  const requireConfirmRead = perm('confirmation.read')
  const requireConfirmWrite = perm('confirmation.write')
  const requireConfirmImport = perm('confirmation.import')

  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 3 * 1024 * 1024 },
  })

  /** รูปจากมือถือ — ไม่จำกัดขนาดไฟล์ (ย่อเป็น WebP ก่อนเก็บ DB) */
  const uploadConfirmImage = multer({
    storage: multer.memoryStorage(),
  })

 // multer for Excel confirmation import — ใหญ่กว่ารูปได้
  const uploadExcel = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: getMulterFileSizeLimit() },
  })

  app.get(
    '/api/v1/work-orders/filter-options',
    ...requireWoRead,
    async (_req: Request, res: Response) => {
      try {
        const data = await listWorkOrderFilterOptions(pool)
        res.json(workOrderFilterOptionsResponseSchema.parse(data))
      } catch (err) {
        if (err instanceof Error && err.name === 'ZodError') throw err
        if (isSchemaMissing(err)) {
          res.status(503).json({
            error: 'SCHEMA_NOT_READY',
            message:
              'Run database/migrations/002_tbactivitytype.sql, 004_tbiw37n_calendar.sql, 005_tbwkzb_tbfunctional.sql, 013_tbwkstatus_add_wkstreason.sql',
          })
          return
        }
        throw err
      }
    },
  )

  app.post(
    '/api/v1/work-orders/search',
    ...requireWoRead,
    async (req: Request, res: Response) => {
      const parsed = workOrderSearchBodySchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'Invalid work orders search body',
          issues: parsed.error.issues,
        })
        return
      }
      try {
        const items = await searchWorkOrders(pool, parsed.data)
        res.json(workOrderSearchResponseSchema.parse({ items }))
      } catch (err) {
        if (err instanceof Error && err.name === 'ZodError') throw err
        if (isSchemaMissing(err)) {
          res.status(503).json({
            error: 'SCHEMA_NOT_READY',
            message:
              'Run database/migrations/004_tbiw37n_calendar.sql and 013_tbwkstatus_add_wkstreason.sql',
          })
          return
        }
        throw err
      }
    },
  )

  app.post(
    '/api/v1/work-orders/filter-detail',
    ...requireWoRead,
    async (req: Request, res: Response) => {
      const parsed = workOrderSearchBodySchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'Invalid work orders filter-detail body',
          issues: parsed.error.issues,
        })
        return
      }
      try {
        const detail = await getWorkOrderFilterDetail(pool, parsed.data)
        res.json(workOrderFilterDetailResponseSchema.parse(detail))
      } catch (err) {
        if (err instanceof Error && err.name === 'ZodError') throw err
        if (isSchemaMissing(err)) {
          res.status(503).json({
            error: 'SCHEMA_NOT_READY',
            message:
              'Run database/migrations/004_tbiw37n_calendar.sql and 005_tbwkzb_tbfunctional.sql',
          })
          return
        }
        throw err
      }
    },
  )

  app.patch(
    '/api/v1/work-orders/team/batch',
    ...requireWoWrite,
    async (req: Request, res: Response) => {
      const parsed = workOrderTeamBulkBodySchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'Invalid bulk team payload',
          issues: parsed.error.issues,
        })
        return
      }
      try {
        const result = await updateWorkOrderTeamBatch(
          pool,
          parsed.data.ids,
          parsed.data.team,
        )
        if (result.updated.length === 0 && parsed.data.ids.length > 0) {
          res.status(404).json({
            error: 'NOT_FOUND',
            message: 'No work orders updated',
            notFound: result.notFound,
          })
          return
        }
        const teamAudit = bulkTeamAuditFields(result)
        voidAudit(pool, req, {
          action: 'work-orders.team.batch',
          resource: 'tbiw37n',
          resourceId: teamAudit.resourceId,
          message: teamAudit.message,
          before: sanitizeAuditPayload(teamAudit.before),
          after: sanitizeAuditPayload(teamAudit.after),
        })
        res.json(workOrderTeamBulkResponseSchema.parse({ ok: true, ...result }))
      } catch (err) {
        if (err instanceof Error && err.name === 'ZodError') throw err
        if (isSchemaMissing(err)) {
          res.status(503).json({
            error: 'SCHEMA_NOT_READY',
            message: 'Run database/migrations/004_tbiw37n_calendar.sql',
          })
          return
        }
        throw err
      }
    },
  )

  app.put(
    '/api/v1/work-orders/:id/team',
    ...requireWoWrite,
    async (req: Request, res: Response) => {
      const id = String(req.params.id ?? '')
      const parsed = workOrderTeamPatchSchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'Invalid team payload',
          issues: parsed.error.issues,
        })
        return
      }
      try {
        const ok = await updateWorkOrderTeam(pool, id, parsed.data.team)
        if (!ok) {
          res.status(404).json({ error: 'NOT_FOUND', message: 'Work order not found' })
          return
        }
        voidAudit(pool, req, {
          action: 'work-orders.write',
          resource: 'tbiw37n',
          resourceId: id,
          after: { team: parsed.data.team },
        })
        res.json(workOrderTeamPatchResponseSchema.parse({ ok: true }))
      } catch (err) {
        if (err instanceof Error && err.name === 'ZodError') throw err
        if (isSchemaMissing(err)) {
          res.status(503).json({
            error: 'SCHEMA_NOT_READY',
            message: 'Run database/migrations/004_tbiw37n_calendar.sql',
          })
          return
        }
        throw err
      }
    },
  )

  app.get(
    '/api/v1/work-orders',
    ...requireWoRead,
    async (req: Request, res: Response) => {
      const parsed = listQuerySchema.safeParse(req.query)
      const opts = parsed.success ? parsed.data : {}
      try {
        const items = await listWorkOrders(pool, opts)
        res.json(workOrdersResponseSchema.parse({ items }))
      } catch (err) {
        if (err instanceof Error && err.name === 'ZodError') throw err
        if (isSchemaMissing(err)) {
          res.status(503).json({
            error: 'SCHEMA_NOT_READY',
            message: 'Run database/migrations/004_tbiw37n_calendar.sql',
          })
          return
        }
        throw err
      }
    },
  )

  app.get(
    '/api/v1/work-orders/:id',
    ...requireWoRead,
    async (req: Request, res: Response) => {
      const id = String(req.params.id ?? '')
      try {
        const item = await enrichWorkOrderDetailForUser(pool, id, req.authUser?.userst)
        if (!item) {
          res.status(404).json({ error: 'NOT_FOUND', message: 'Work order not found' })
          return
        }
        res.json(workOrderDetailSchema.parse({ item }))
      } catch (err) {
        if (err instanceof Error && err.name === 'ZodError') throw err
        if (isSchemaMissing(err)) {
          res.status(503).json({
            error: 'SCHEMA_NOT_READY',
            message: 'Run database/migrations/004_tbiw37n_calendar.sql',
          })
          return
        }
        throw err
      }
    },
  )

  app.get(
    '/api/v1/work-orders/:id/modal-detail',
    ...requireWoRead,
    async (req: Request, res: Response) => {
      const id = String(req.params.id ?? '')
      const parsed = modalDetailQuerySchema.safeParse(req.query)
      if (!parsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid query' })
        return
      }
      try {
        const user = req.authUser
        const payload = await getWorkOrderModalDetail(
          pool,
          id,
          { date: parsed.data.date },
          user
            ? { userst: user.userst, wkctr: user.wkctr || user.username || undefined }
            : undefined,
        )
        if (!payload) {
          res.status(404).json({ error: 'NOT_FOUND', message: 'Work order not found' })
          return
        }
        res.json(workOrderModalDetailResponseSchema.parse(payload))
      } catch (err) {
        if (err instanceof Error && err.name === 'ZodError') throw err
        if (isSchemaMissing(err)) {
          res.status(503).json({
            error: 'SCHEMA_NOT_READY',
            message:
              'Run database/migrations/003_tblineschdul.sql, 014_tbwkctrtype.sql, 015_tbproductline.sql, 016_tbzone.sql, 017_tbmainteanance.sql, 018_tbmaterial.sql, 021_tbwkctrgroup.sql, 022_tbtasklist.sql, 007_tbplangingwork_view_planwork.sql, 092_wo_pm_execution.sql',
          })
          return
        }
        throw err
      }
    },
  )

  app.put(
    '/api/v1/work-orders/:id/pm-note',
    ...requireConfirmWrite,
    async (req: Request, res: Response) => {
      const user = req.authUser
      if (!user) {
        res.status(401).json({ error: 'UNAUTHORIZED', message: 'ต้องเข้าสู่ระบบ' })
        return
      }
      const id = String(req.params.id ?? '')
      const parsed = woPmNoteBodySchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid body', issues: parsed.error.issues })
        return
      }
      try {
        const idiw37 = await resolveWorkOrderIdiw37(pool, id)
        if (idiw37 == null) {
          res.status(404).json({ error: 'NOT_FOUND' })
          return
        }
        const wkctr = user.wkctr || user.username || ''
        const entry = await appendWoPmNote(
          pool,
          idiw37,
          parsed.data.note,
          wkctr,
          user.username || wkctr,
        )
        voidAudit(pool, req, {
          action: 'confirmation.write',
          resource: 'tbwo_pm_note_entry',
          resourceId: String(entry.identry),
          after: sanitizeAuditPayload({ idiw37, noteLen: parsed.data.note.length }),
        })
        res.json(woPmNoteResponseSchema.parse({ ok: true, entry }))
      } catch (err) {
        if (err instanceof Error && err.message === 'EMPTY_PM_NOTE') {
          res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Comment cannot be empty' })
          return
        }
        if (isSchemaMissing(err)) {
          res.status(503).json({
            error: 'SCHEMA_NOT_READY',
            message: 'Run database/migrations/092_wo_pm_execution.sql and 097_tbwo_pm_note_entry.sql',
          })
          return
        }
        throw err
      }
    },
  )

  app.put(
    '/api/v1/work-orders/:id/pm-page2',
    ...requireConfirmWrite,
    async (req: Request, res: Response) => {
      const user = req.authUser
      if (!user) {
        res.status(401).json({ error: 'UNAUTHORIZED', message: 'ต้องเข้าสู่ระบบ' })
        return
      }
      const id = String(req.params.id ?? '')
      const parsed = woPmPage2BodySchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid body', issues: parsed.error.issues })
        return
      }
      try {
        const idiw37 = await resolveWorkOrderIdiw37(pool, id)
        if (idiw37 == null) {
          res.status(404).json({ error: 'NOT_FOUND' })
          return
        }
        const page2Form = await updateWoPmPage2Equipment(pool, idiw37, parsed.data.equipmentOk)
        voidAudit(pool, req, {
          action: 'confirmation.write',
          resource: 'tbwo_pm_page2',
          resourceId: String(idiw37),
          after: sanitizeAuditPayload({ equipmentOk: parsed.data.equipmentOk }),
        })
        res.json(woPmPage2ResponseSchema.parse({ ok: true, page2Form }))
      } catch (err) {
        if (isSchemaMissing(err)) {
          res.status(503).json({
            error: 'SCHEMA_NOT_READY',
            message: 'Run database/migrations/115_wo_pm_page2.sql',
          })
          return
        }
        throw err
      }
    },
  )

  app.get(
    '/api/v1/work-orders/:id/pm-readings/export.xlsx',
    ...requireConfirmRead,
    async (req: Request, res: Response) => {
      const id = String(req.params.id ?? '')
      try {
        const idiw37 = await resolveWorkOrderIdiw37(pool, id)
        if (idiw37 == null) {
          res.status(404).json({ error: 'NOT_FOUND' })
          return
        }
        const rows = await listPmReadingExportRowsForWo(pool, idiw37)
        const buf = buildPmReadingsXlsxBuffer(rows)
        const wk = rows[0]?.wkorder || id
        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        )
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="PM_Readings_${wk}.xlsx"`,
        )
        res.status(200).send(buf)
      } catch (err) {
        if (err instanceof Error && err.name === 'ZodError') throw err
        if (isSchemaMissing(err)) {
          res.status(503).json({
            error: 'SCHEMA_NOT_READY',
            message: 'Run database/migrations/092_wo_pm_execution.sql',
          })
          return
        }
        throw err
      }
    },
  )

  app.post(
    '/api/v1/work-orders/:id/pm-readings',
    ...requireConfirmWrite,
    async (req: Request, res: Response) => {
      const user = req.authUser
      if (!user) {
        res.status(401).json({ error: 'UNAUTHORIZED', message: 'ต้องเข้าสู่ระบบ' })
        return
      }
      const id = String(req.params.id ?? '')
      const parsed = woPmReadingBodySchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid body', issues: parsed.error.issues })
        return
      }
      try {
        const idiw37 = await resolveWorkOrderIdiw37(pool, id)
        if (idiw37 == null) {
          res.status(404).json({ error: 'NOT_FOUND' })
          return
        }
        const item = await createWoPmReading(pool, {
          idiw37,
          machine: parsed.data.machine,
          pmlist: parsed.data.pmlist,
          kind: parsed.data.kind,
          measuredAt: parsed.data.measuredAt,
          v1: parsed.data.v1,
          v2: parsed.data.v2,
          v3: parsed.data.v3,
          warningLimit: parsed.data.warningLimit ?? null,
          alarmLimit: parsed.data.alarmLimit ?? null,
          wkctr: user.wkctr || user.username || '',
        })
        voidAudit(pool, req, {
          action: 'confirmation.write',
          resource: 'tbwo_pm_reading',
          resourceId: String(item.idreading),
          after: sanitizeAuditPayload({
            machine: item.machine,
            pmlist: item.pmlist,
            kind: item.kind,
          }),
        })
        res.status(201).json(woPmReadingResponseSchema.parse({ item }))
      } catch (err) {
        if (err instanceof Error && err.message === 'INVALID_MEASURED_AT') {
          res.status(400).json({ error: 'VALIDATION_ERROR', message: 'วันที่วัดไม่ถูกต้อง' })
          return
        }
        if (isSchemaMissing(err)) {
          res.status(503).json({
            error: 'SCHEMA_NOT_READY',
            message: 'Run database/migrations/092_wo_pm_execution.sql',
          })
          return
        }
        throw err
      }
    },
  )

  app.put(
    '/api/v1/work-orders/:id/planning',
    ...requirePlanningWrite,
    async (req: Request, res: Response) => {
      const user = req.authUser
      if (!user) {
        res.status(401).json({ error: 'UNAUTHORIZED', message: 'ต้องเข้าสู่ระบบ' })
        return
      }
      const id = String(req.params.id ?? '')
      const parsed = workOrderPlanningUpsertBodySchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid body', issues: parsed.error.issues })
        return
      }
      const actorWkctr = (user.wkctr || user.username || user.idwkctr || '').trim()
      try {
        const ok = await upsertWorkOrderPlanning(pool, id, parsed.data, actorWkctr)
        if (!ok) {
          res.status(404).json({ error: 'NOT_FOUND' })
          return
        }
        voidAudit(pool, req, {
          action: 'planning.write',
          resource: 'tbplangingwork',
          resourceId: id,
          after: sanitizeAuditPayload(parsed.data),
        })
        res.json(workOrderPlanningOkResponseSchema.parse({ ok: true }))
      } catch (err) {
        if (err instanceof Error && err.name === 'ZodError') throw err
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

 // Multi-assign แบบ batch — เพิ่มช่างหลายคนในคลิกเดียว
  app.post(
    '/api/v1/work-orders/:id/planning/batch',
    ...requirePlanningAssign,
    async (req: Request, res: Response) => {
      const user = req.authUser
      if (!user) {
        res.status(401).json({ error: 'UNAUTHORIZED', message: 'ต้องเข้าสู่ระบบ' })
        return
      }
      const id = String(req.params.id ?? '')
      const parsed = workOrderPlanningBatchBodySchema.safeParse(req.body)
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
        const result = await assignWorkOrderPlanningBatch(
          pool,
          id,
          parsed.data.wkctrs,
          parsed.data.comment,
          actorWkctr,
        )
        if (!result) {
          res.status(404).json({ error: 'NOT_FOUND' })
          return
        }
        voidAudit(pool, req, {
          action: 'planning.assign',
          resource: 'tbplangingwork',
          resourceId: id,
          after: sanitizeAuditPayload(parsed.data),
        })
        void recordRevision(pool, {
          resourceType: 'plan_assign',
          resourceId: id,
          changeKind: 'assign',
          actorId: user.idwkctr,
          actorRole: user.userst,
          after: sanitizeAuditPayload(parsed.data) as Record<string, unknown>,
        })
        if (result.assigned.length > 0) {
          const idiw37 = Number(id)
          if (Number.isFinite(idiw37) && idiw37 > 0) {
            void notifyNewPlanningAssignments(
              pool,
              idiw37,
              result.assigned,
              actorWkctr,
            ).catch((err) => console.error('[telegram/assign-notify]', err))
          }
        }
        res.json(
          workOrderPlanningBatchResponseSchema.parse({
            ok: true,
            assigned: result.assigned,
            skipped: result.skipped,
            notFound: result.notFound,
          }),
        )
      } catch (err) {
        if (err instanceof Error && err.name === 'ZodError') throw err
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

 // DELETE all assignments ของ WO (back-compat)
  app.delete(
    '/api/v1/work-orders/:id/planning',
    ...requirePlanningDelete,
    async (req: Request, res: Response) => {
      const id = String(req.params.id ?? '')
      try {
        const ok = await deleteWorkOrderPlanning(pool, id)
        if (!ok) {
          res.status(404).json({ error: 'NOT_FOUND' })
          return
        }
        voidAudit(pool, req, {
          action: 'planning.delete',
          resource: 'tbplangingwork',
          resourceId: id,
        })
        res.json(workOrderPlanningOkResponseSchema.parse({ ok: true }))
      } catch (err) {
        if (err instanceof Error && err.name === 'ZodError') throw err
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

 // DELETE assignment เฉพาะ (idiw37, wkctr) — multi-assign
  app.delete(
    '/api/v1/work-orders/:id/planning/:wkctr',
    ...requirePlanningDelete,
    async (req: Request, res: Response) => {
      const id = String(req.params.id ?? '')
      const wkctr = String(req.params.wkctr ?? '').trim()
      if (!wkctr) {
        res.status(400).json({ error: 'VALIDATION_ERROR', message: 'wkctr is required' })
        return
      }
      try {
        const ok = await deleteWorkOrderPlanning(pool, id, wkctr)
        if (!ok) {
          res.status(404).json({ error: 'NOT_FOUND' })
          return
        }
        voidAudit(pool, req, {
          action: 'planning.delete',
          resource: 'tbplangingwork',
          resourceId: `${id}:${wkctr}`,
        })
        res.json(workOrderPlanningOkResponseSchema.parse({ ok: true }))
      } catch (err) {
        if (err instanceof Error && err.name === 'ZodError') throw err
        if (isSchemaMissing(err)) {
          res.status(503).json({
            error: 'SCHEMA_NOT_READY',
            message: 'Run database/migrations/007_tbplangingwork_view_planwork.sql + 038_tbplangingwork_multi_assign.sql',
          })
          return
        }
        throw err
      }
    },
  )

  app.get('/api/v1/workcenters', ...requireWoRead, async (_req: Request, res: Response) => {
    const items = await listWorkcenters(pool)
    res.json(workcentersResponseSchema.parse({ items }))
  })

  app.get(
    '/api/v1/confirmation/by-wkorder/:wkorder',
    ...requireConfirmRead,
    async (req: Request, res: Response) => {
      const parsed = confirmationWkorderParamSchema.safeParse(req.params)
      if (!parsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR', message: 'wkorder is required' })
        return
      }
      const wkorder = parsed.data.wkorder

      const wo = await findWorkOrderByWkorder(pool, wkorder)
      if (!wo) {
        res.status(404).json({ error: 'NOT_FOUND', message: 'Work order not found' })
        return
      }

      const data = await getConfirmationByWorkOrder(pool, wkorder)
      const items = data?.items ?? []
      res.json(
        confirmationByWorkOrderResponseSchema.parse({
          idiw37: wo.idiw37,
          wkorder: wo.wkorder,
          items,
        }),
      )
    },
  )

  app.get(
    '/api/v1/confirmation/:idiw37/comments',
    ...requireConfirmRead,
    async (req: Request, res: Response) => {
      const parsed = confirmationIwiwParamSchema.safeParse(req.params)
      if (!parsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid idiw37' })
        return
      }
      try {
        const items = await listConfirmationComments(pool, parsed.data.idiw37)
        res.json(confirmationCommentsResponseSchema.parse({ items }))
      } catch (err) {
        if (err instanceof Error && err.name === 'ZodError') throw err
        if (isSchemaMissing(err)) {
          res.status(503).json({
            error: 'SCHEMA_NOT_READY',
            message: 'Run migrations 026_confirmation_tables.sql and 029_confirmation_comments_images.sql',
          })
          return
        }
        throw err
      }
    },
  )

  app.post(
    '/api/v1/confirmation/:idiw37/comments',
    ...requireConfirmWrite,
    async (req: Request, res: Response) => {
      const user = req.authUser
      if (!user) {
        res.status(401).json({ error: 'UNAUTHORIZED', message: 'ต้องเข้าสู่ระบบ' })
        return
      }
      const idParsed = confirmationIwiwParamSchema.safeParse(req.params)
      if (!idParsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid idiw37' })
        return
      }
      const bodyParsed = confirmationCommentBodySchema.safeParse(req.body)
      if (!bodyParsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid body', issues: bodyParsed.error.issues })
        return
      }
      try {
        const item = await createConfirmationComment(pool, {
          idiw37: idParsed.data.idiw37,
          comdetail: bodyParsed.data.comdetail,
          wkctr: user.wkctr || user.username || '',
        })
        voidAudit(pool, req, {
          action: 'confirmation.write',
          resource: 'tbconfirm_comment',
          resourceId: String(item.idcom),
          after: sanitizeAuditPayload(bodyParsed.data),
        })
        res.status(201).json(confirmationCommentResponseSchema.parse({ item }))
      } catch (err) {
        if (err instanceof Error && err.name === 'ZodError') throw err
        if (isSchemaMissing(err)) {
          res.status(503).json({
            error: 'SCHEMA_NOT_READY',
            message: 'Run migration 029_confirmation_comments_images.sql',
          })
          return
        }
        throw err
      }
    },
  )

  app.put(
    '/api/v1/confirmation/comments/:idcom',
    ...requireConfirmWrite,
    async (req: Request, res: Response) => {
      const idParsed = confirmationCommentIdParamSchema.safeParse(req.params)
      if (!idParsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid idcom' })
        return
      }
      const bodyParsed = confirmationCommentBodySchema.safeParse(req.body)
      if (!bodyParsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid body', issues: bodyParsed.error.issues })
        return
      }
      try {
        const item = await updateConfirmationComment(pool, idParsed.data.idcom, bodyParsed.data.comdetail)
        if (!item) {
          res.status(404).json({ error: 'NOT_FOUND' })
          return
        }
        voidAudit(pool, req, {
          action: 'confirmation.write',
          resource: 'tbconfirm_comment',
          resourceId: String(idParsed.data.idcom),
          after: sanitizeAuditPayload(bodyParsed.data),
        })
        res.json(confirmationCommentResponseSchema.parse({ item }))
      } catch (err) {
        if (err instanceof Error && err.name === 'ZodError') throw err
        if (isSchemaMissing(err)) {
          res.status(503).json({
            error: 'SCHEMA_NOT_READY',
            message: 'Run migration 029_confirmation_comments_images.sql',
          })
          return
        }
        throw err
      }
    },
  )

  app.delete(
    '/api/v1/confirmation/comments/:idcom',
    ...requireConfirmWrite,
    async (req: Request, res: Response) => {
      const idParsed = confirmationCommentIdParamSchema.safeParse(req.params)
      if (!idParsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid idcom' })
        return
      }
      try {
        const ok = await deleteConfirmationComment(pool, idParsed.data.idcom)
        if (!ok) {
          res.status(404).json({ error: 'NOT_FOUND' })
          return
        }
        voidAudit(pool, req, {
          action: 'confirmation.delete',
          resource: 'tbconfirm_comment',
          resourceId: String(idParsed.data.idcom),
        })
        res.json(confirmationOkResponseSchema.parse({ ok: true }))
      } catch (err) {
        if (err instanceof Error && err.name === 'ZodError') throw err
        if (isSchemaMissing(err)) {
          res.status(503).json({
            error: 'SCHEMA_NOT_READY',
            message: 'Run migration 029_confirmation_comments_images.sql',
          })
          return
        }
        throw err
      }
    },
  )

  app.get(
    '/api/v1/confirmation/:idiw37/images',
    ...requireConfirmRead,
    async (req: Request, res: Response) => {
      const parsed = confirmationIwiwParamSchema.safeParse(req.params)
      if (!parsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid idiw37' })
        return
      }
      try {
        const items = await listConfirmationImages(pool, parsed.data.idiw37)
        res.json(confirmationImagesResponseSchema.parse({ items }))
      } catch (err) {
        if (err instanceof Error && err.name === 'ZodError') throw err
        if (isSchemaMissing(err)) {
          res.status(503).json({
            error: 'SCHEMA_NOT_READY',
            message: 'Run migration 029_confirmation_comments_images.sql',
          })
          return
        }
        throw err
      }
    },
  )

  app.get(
    '/api/v1/confirmation/qc/pending',
    ...requireConfirmImport,
    async (req: Request, res: Response) => {
      try {
        const limit = Math.min(Number(req.query.limit) || 50, 200)
        const items = await listConfirmQcPending(pool, limit)
        res.json(confirmQcPendingResponseSchema.parse({ items }))
      } catch (err) {
        if (err instanceof Error && err.name === 'ZodError') throw err
        if (isSchemaMissing(err)) {
          res.status(503).json({
            error: 'SCHEMA_NOT_READY',
            message: 'Run migration 080_tbiw37n_confirm_qc.sql',
          })
          return
        }
        throw err
      }
    },
  )

  app.get(
    '/api/v1/confirmation/:idiw37/qc',
    ...requireConfirmRead,
    async (req: Request, res: Response) => {
      const parsed = confirmationIwiwParamSchema.safeParse(req.params)
      if (!parsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid idiw37' })
        return
      }
      try {
        const qc = await getConfirmQcSnapshot(pool, parsed.data.idiw37)
        if (!qc) {
          res.status(404).json({ error: 'NOT_FOUND' })
          return
        }
        res.json(confirmQcSnapshotResponseSchema.parse({ qc }))
      } catch (err) {
        if (err instanceof Error && err.name === 'ZodError') throw err
        if (isSchemaMissing(err)) {
          res.status(503).json({
            error: 'SCHEMA_NOT_READY',
            message: 'Run migration 080_tbiw37n_confirm_qc.sql',
          })
          return
        }
        throw err
      }
    },
  )

  app.post(
    '/api/v1/confirmation/:idiw37/qc/approve',
    ...requireConfirmImport,
    async (req: Request, res: Response) => {
      const user = req.authUser
      if (!user) {
        res.status(401).json({ error: 'UNAUTHORIZED', message: 'ต้องเข้าสู่ระบบ' })
        return
      }
      const { assertPlannerReviewerRole } = await import('../lib/confirm-qc-status.js')
      try {
        assertPlannerReviewerRole(user.userst)
      } catch {
        res.status(403).json({
          error: 'PLANNER_REVIEW_REQUIRED',
          message: 'เฉพาะ Planner ตรวจและอนุมัติงานปิด — Admin ใช้เมนูผู้ดูแลระบบเท่านั้น',
        })
        return
      }
      const parsed = confirmationIwiwParamSchema.safeParse(req.params)
      if (!parsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid idiw37' })
        return
      }
      try {
        const qc = await getConfirmQcSnapshot(pool, parsed.data.idiw37)
        if (!qc) {
          res.status(404).json({ error: 'NOT_FOUND' })
          return
        }
        if (!qc.readyForReview) {
          res.status(409).json({
            error: 'CONFIRM_QC_NOT_READY',
            message: 'ยังไม่มีรูป/เวลาปิดงานให้ตรวจ',
          })
          return
        }
        const { assertWorkOrderCloseReady } = await import('../lib/work-order-close-guard.js')
        try {
          await assertWorkOrderCloseReady(pool, parsed.data.idiw37)
        } catch (guardErr) {
          const message = guardErr instanceof Error ? guardErr.message : String(guardErr)
          res.status(409).json({ error: 'CONFIRM_QC_NOT_READY', message })
          return
        }
        const out = await setConfirmQcStatus(
          pool,
          parsed.data.idiw37,
          'approved',
          user.wkctr || user.username || '',
        )
        voidAudit(pool, req, {
          action: 'confirmation.qc.approve',
          resource: 'tbiw37n',
          resourceId: String(parsed.data.idiw37),
          after: { wkorder: qc.wkorder },
        })
        res.json(confirmQcSnapshotResponseSchema.parse({ qc: out }))
      } catch (err) {
        if (err instanceof Error && err.name === 'ZodError') throw err
        if (isSchemaMissing(err)) {
          res.status(503).json({
            error: 'SCHEMA_NOT_READY',
            message: 'Run migration 080_tbiw37n_confirm_qc.sql',
          })
          return
        }
        throw err
      }
    },
  )

  app.post(
    '/api/v1/confirmation/:idiw37/qc/reject',
    ...requireConfirmImport,
    async (req: Request, res: Response) => {
      const user = req.authUser
      if (!user) {
        res.status(401).json({ error: 'UNAUTHORIZED', message: 'ต้องเข้าสู่ระบบ' })
        return
      }
      const { assertPlannerReviewerRole } = await import('../lib/confirm-qc-status.js')
      try {
        assertPlannerReviewerRole(user.userst)
      } catch {
        res.status(403).json({
          error: 'PLANNER_REVIEW_REQUIRED',
          message: 'เฉพาะ Planner ตรวจและปฏิเสธงานปิด — Admin ใช้เมนูผู้ดูแลระบบเท่านั้น',
        })
        return
      }
      const parsed = confirmationIwiwParamSchema.safeParse(req.params)
      if (!parsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid idiw37' })
        return
      }
      const body = confirmQcRejectBodySchema.safeParse(req.body ?? {})
      if (!body.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid body' })
        return
      }
      try {
        const qc = await getConfirmQcSnapshot(pool, parsed.data.idiw37)
        if (!qc) {
          res.status(404).json({ error: 'NOT_FOUND' })
          return
        }
        const out = await setConfirmQcStatus(
          pool,
          parsed.data.idiw37,
          'rejected',
          user.wkctr || user.username || '',
          body.data.note,
        )
        voidAudit(pool, req, {
          action: 'confirmation.qc.reject',
          resource: 'tbiw37n',
          resourceId: String(parsed.data.idiw37),
          after: { wkorder: qc.wkorder, note: body.data.note },
        })
        res.json(confirmQcSnapshotResponseSchema.parse({ qc: out }))
      } catch (err) {
        if (err instanceof Error && err.name === 'ZodError') throw err
        if (isSchemaMissing(err)) {
          res.status(503).json({
            error: 'SCHEMA_NOT_READY',
            message: 'Run migration 080_tbiw37n_confirm_qc.sql',
          })
          return
        }
        throw err
      }
    },
  )

  app.post(
    '/api/v1/confirmation/export/mass-summary',
    ...requireConfirmRead,
    async (req: Request, res: Response) => {
      const parsed = confirmationMassExportBodySchema.safeParse(req.body ?? {})
      if (!parsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid body' })
        return
      }
      try {
        const summary = await getMassConfirmExportSummary(pool, parsed.data.idiw37n)
        res.json(massConfirmExportSummarySchema.parse(summary))
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        if (msg.includes('Maximum')) {
          res.status(400).json({ error: 'VALIDATION_ERROR', message: msg })
          return
        }
        if (isSchemaMissing(err)) {
          res.status(503).json({
            error: 'SCHEMA_NOT_READY',
            message: 'Run migrations 080_tbiw37n_confirm_qc.sql',
          })
          return
        }
        throw err
      }
    },
  )

  app.post(
    '/api/v1/confirmation/qc/approve-batch',
    ...requireConfirmImport,
    async (req: Request, res: Response) => {
      const user = req.authUser
      if (!user) {
        res.status(401).json({ error: 'UNAUTHORIZED', message: 'ต้องเข้าสู่ระบบ' })
        return
      }
      const { assertPlannerReviewerRole } = await import('../lib/confirm-qc-status.js')
      try {
        assertPlannerReviewerRole(user.userst)
      } catch {
        res.status(403).json({
          error: 'PLANNER_REVIEW_REQUIRED',
          message: 'เฉพาะ Planner อนุมัติ QC แบบชุด — Admin ใช้เมนูผู้ดูแลระบบเท่านั้น',
        })
        return
      }
      const parsed = qcApproveBatchBodySchema.safeParse(req.body ?? {})
      if (!parsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid body' })
        return
      }
      try {
        const out = await approveConfirmQcBatch(
          pool,
          parsed.data.idiw37n,
          user.wkctr || user.username || '',
        )
        voidAudit(pool, req, {
          action: 'confirmation.qc.approve_batch',
          resource: 'tbiw37n',
          after: { count: out.approved.length },
        })
        res.json(qcApproveBatchResponseSchema.parse(out))
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        if (msg.includes('Maximum')) {
          res.status(400).json({ error: 'VALIDATION_ERROR', message: msg })
          return
        }
        if (isSchemaMissing(err)) {
          res.status(503).json({
            error: 'SCHEMA_NOT_READY',
            message: 'Run migration 080_tbiw37n_confirm_qc.sql',
          })
          return
        }
        throw err
      }
    },
  )

  app.get(
    '/api/v1/confirmation/preview',
    ...requireConfirmRead,
    async (req: Request, res: Response) => {
      const parsed = confirmationPreviewQuerySchema.safeParse(req.query)
      if (!parsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid query' })
        return
      }
      try {
        const items = await listConfirmationPreviewRows(pool, { status: parsed.data.status })
        res.json(
          confirmationPreviewResponseSchema.parse({
            totalRows: items.length,
            items,
          }),
        )
      } catch (err) {
        if (err instanceof Error && err.name === 'ZodError') throw err
        if (isSchemaMissing(err)) {
          res.status(503).json({
            error: 'SCHEMA_NOT_READY',
            message:
              'Run migrations 026_confirmation_tables.sql, 073_tbwrkclose.sql, 080_tbiw37n_confirm_qc.sql',
          })
          return
        }
        throw err
      }
    },
  )

  app.get(
    '/api/v1/confirmation/export',
    ...requireConfirmRead,
    async (req: Request, res: Response) => {
      const user = req.authUser
      if (!user) {
        res.status(401).json({ error: 'UNAUTHORIZED', message: 'ต้องเข้าสู่ระบบ' })
        return
      }
      const actorWkctr = (user.wkctr || user.username || '').trim()
      const scope = await resolveConfirmationExportScope(pool, user.userst)
      const batchIds = parseIdiw37nQuery(req.query.idiw37n)

      try {
        const items = batchIds?.length
          ? await listConfirmationExportRowsForBatch(pool, actorWkctr, batchIds, scope)
          : await listConfirmationExportRows(pool, actorWkctr, undefined, scope)
        res.json(
          confirmationExportResponseSchema.parse({
            scope,
            actorWkctr,
            totalRows: items.length,
            items,
          }),
        )
      } catch (err) {
        if (err instanceof Error && err.name === 'ZodError') throw err
        if (isSchemaMissing(err)) {
          res.status(503).json({
            error: 'SCHEMA_NOT_READY',
            message:
              'Run migrations 026_confirmation_tables.sql และ 033_view_exportconfirm.sql',
          })
          return
        }
        throw err
      }
    },
  )

  app.get(
    '/api/v1/confirmation/export.xlsx',
    ...requireConfirmRead,
    async (req: Request, res: Response) => {
      const user = req.authUser
      if (!user) {
        res.status(401).json({ error: 'UNAUTHORIZED', message: 'ต้องเข้าสู่ระบบ' })
        return
      }

      const batchIds = parseIdiw37nQuery(req.query.idiw37n)
      const actor = user.wkctr || user.username || ''
      const scope = await resolveConfirmationExportScope(pool, user.userst)

      try {
        const rows = batchIds?.length
          ? await listConfirmationExportRowsForBatch(pool, actor, batchIds, scope)
          : await listConfirmationExportRows(pool, actor, undefined, scope)
        const buf = buildConfirmationExportXlsxBuffer(rows)

        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        )
        res.setHeader('Content-Disposition', 'attachment; filename="Export_Confirm.xlsx"')
        res.status(200).send(buf)
      } catch (err) {
        if (err instanceof Error && err.name === 'ZodError') throw err
        if (isSchemaMissing(err)) {
          res.status(503).json({
            error: 'SCHEMA_NOT_READY',
            message:
              'Run migrations 026_confirmation_tables.sql และ 033_view_exportconfirm.sql',
          })
          return
        }
        throw err
      }
    },
  )

  app.get(
    '/api/v1/confirmation/export.csv',
    ...requireConfirmRead,
    async (req: Request, res: Response) => {
      const user = req.authUser
      if (!user) {
        res.status(401).json({ error: 'UNAUTHORIZED', message: 'ต้องเข้าสู่ระบบ' })
        return
      }

      const batchIds = parseIdiw37nQuery(req.query.idiw37n)
      const actor = user.wkctr || user.username || ''
      const scope = await resolveConfirmationExportScope(pool, user.userst)

      try {
        const rows = batchIds?.length
          ? await listConfirmationExportRowsForBatch(pool, actor, batchIds, scope)
          : await listConfirmationExportRows(pool, actor, undefined, scope)
        const csv = buildConfirmationExportSapCsv(rows)
        const filename = confirmationSapCsvFilename()
        res.setHeader('Content-Type', 'text/csv; charset=utf-8')
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
        res.status(200).send(csv)
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        if (msg.includes('Maximum')) {
          res.status(400).json({ error: 'VALIDATION_ERROR', message: msg })
          return
        }
        if (isSchemaMissing(err)) {
          res.status(503).json({
            error: 'SCHEMA_NOT_READY',
            message:
              'Run migrations 026_confirmation_tables.sql และ 033_view_exportconfirm.sql',
          })
          return
        }
        throw err
      }
    },
  )

  app.post(
    '/api/v1/confirmation/:idiw37/images',
    ...requireConfirmWrite,
    uploadConfirmImage.single('file'),
    async (req: Request, res: Response) => {
      const user = req.authUser
      if (!user) {
        res.status(401).json({ error: 'UNAUTHORIZED', message: 'ต้องเข้าสู่ระบบ' })
        return
      }
      const idParsed = confirmationIwiwParamSchema.safeParse(req.params)
      if (!idParsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid idiw37' })
        return
      }

      const file = req.file
      if (!file?.buffer?.length) {
        res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Multipart field "file" is required' })
        return
      }

      const mime = file.mimetype || ''
      if (!mime.startsWith('image/')) {
        res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Only image files are allowed' })
        return
      }

      const phase = parseConfirmImagePhase(req.body?.phase ?? req.body?.imgPhase)
      if (!phase) {
        res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'Field "phase" is required (after)',
        })
        return
      }
      if (phase === 'before') {
        res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'รูปก่อนทำ PM ไม่รองรับแล้ว — อัปโหลดเฉพาะรูปหลังทำ PM (after)',
        })
        return
      }
      const comment = normalizeConfirmImageCaption(req.body?.caption ?? req.body?.imgComment)

      let webp
      try {
        webp = await convertConfirmImageToWebp(file.buffer, idParsed.data.idiw37)
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Invalid image'
        res.status(400).json({ error: 'VALIDATION_ERROR', message: msg })
        return
      }

      try {
        const item = await createConfirmationImageRecord(pool, {
          idiw37: idParsed.data.idiw37,
          fileName: webp.fileName,
          originalName: file.originalname || '',
          mime: webp.mime,
          bytes: webp.bytes,
          imageData: webp.data,
          wkctr: user.wkctr || user.username || '',
          phase,
          comment,
        })
        voidAudit(pool, req, {
          action: 'confirmation.write',
          resource: 'tbconfirm_image',
          resourceId: String(item.idcimg),
          after: {
            idiw37: idParsed.data.idiw37,
            fileName: webp.fileName,
            phase,
            comment: comment || undefined,
          },
        })
        res.status(201).json(confirmationImagesResponseSchema.parse({ items: [item] }))
      } catch (err) {
        if (err instanceof Error && err.name === 'ZodError') throw err
        if (isSchemaMissing(err)) {
          res.status(503).json({
            error: 'SCHEMA_NOT_READY',
            message:
              'Run migrations 029_confirmation_comments_images.sql, 077_tbconfirmimg_before_after.sql, 079_tbconfirmimg_img_data.sql',
          })
          return
        }
        throw err
      }
    },
  )

  app.get(
    '/api/v1/confirmation/images/:idcimg/data',
    ...requireConfirmRead,
    async (req: Request, res: Response) => {
      const parsed = confirmationImageIdParamSchema.safeParse(req.params)
      if (!parsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid idcimg' })
        return
      }
      try {
        const payload = await readConfirmationImageBuffer(pool, parsed.data.idcimg)
        if (!payload) {
          res.status(404).json({ error: 'NOT_FOUND', message: 'Image data missing' })
          return
        }
        const body = confirmationImageDataResponseSchema.safeParse({
          idcimg: payload.idcimg,
          mime: payload.mime,
          base64: payload.data.toString('base64'),
        })
        if (!body.success) {
          res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Invalid image payload' })
          return
        }
        res.json(body.data)
      } catch (err) {
        if (isSchemaMissing(err)) {
          res.status(503).json({
            error: 'SCHEMA_NOT_READY',
            message:
              'Run migrations 029_confirmation_comments_images.sql and 079_tbconfirmimg_img_data.sql',
          })
          return
        }
        throw err
      }
    },
  )

  app.delete(
    '/api/v1/confirmation/images/:idcimg',
    ...requireConfirmWrite,
    async (req: Request, res: Response) => {
      const parsed = confirmationImageIdParamSchema.safeParse(req.params)
      if (!parsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid idcimg' })
        return
      }
      try {
        const out = await deleteConfirmationImageRecord(pool, parsed.data.idcimg)
        if (!out.ok) {
          res.status(404).json({ error: 'NOT_FOUND' })
          return
        }
        voidAudit(pool, req, {
          action: 'confirmation.delete',
          resource: 'tbconfirm_image',
          resourceId: String(parsed.data.idcimg),
        })
        res.json(confirmationOkResponseSchema.parse({ ok: true }))
      } catch (err) {
        if (err instanceof Error && err.name === 'ZodError') throw err
        if (isSchemaMissing(err)) {
          res.status(503).json({
            error: 'SCHEMA_NOT_READY',
            message:
              'Run migrations 029_confirmation_comments_images.sql and 079_tbconfirmimg_img_data.sql',
          })
          return
        }
        throw err
      }
    },
  )

  app.post(
    '/api/v1/confirmation/closes/batch',
    ...requireConfirmWrite,
    async (req: Request, res: Response) => {
      const user = req.authUser
      if (!user) {
        res.status(401).json({ error: 'UNAUTHORIZED', message: 'ต้องเข้าสู่ระบบ' })
        return
      }

      const parsed = confirmationMassCloseBodySchema.safeParse(req.body)
      if (!parsed.success) {
        const tooMany = parsed.error.issues.some(
          (i) => i.path[0] === 'idiw37n' && i.code === 'too_big',
        )
        res.status(400).json({
          error: tooMany ? 'BATCH_SIZE_EXCEEDED' : 'VALIDATION_ERROR',
          message: tooMany
            ? `สูงสุด ${MASS_CONFIRM_MAX_ITEMS} รายการต่อ batch (SAP mass confirm)`
            : 'Invalid mass confirm body',
          maxItems: MASS_CONFIRM_MAX_ITEMS,
          issues: parsed.error.issues,
        })
        return
      }

      try {
        const result = await addConfirmationCloseBatch(pool, {
          idiw37n: parsed.data.idiw37n,
          wkctr: parsed.data.wkctr,
          startD: parsed.data.startD,
          startT: parsed.data.startT,
          endD: parsed.data.endD,
          endT: parsed.data.endT,
          cwkctr: user.wkctr || user.username || null,
        })

        if (result.succeeded.length === 0) {
          res.status(400).json({
            error: 'MASS_CONFIRM_FAILED',
            message: 'No work orders confirmed',
            failed: result.failed,
          })
          return
        }

        const confirmAudit = massConfirmAuditFields(parsed.data, result)
        voidAudit(pool, req, {
          action: 'confirmation.mass_close',
          resource: 'tbcofirm',
          resourceId: confirmAudit.resourceId,
          message: confirmAudit.message,
          before: sanitizeAuditPayload(confirmAudit.before),
          after: sanitizeAuditPayload(confirmAudit.after),
        })

        res.json(
          confirmationMassCloseResponseSchema.parse({
            ok: true,
            succeeded: result.succeeded,
            failed: result.failed,
            maxItems: MASS_CONFIRM_MAX_ITEMS,
          }),
        )
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        if (message.includes(`Maximum ${MASS_CONFIRM_MAX_ITEMS}`)) {
          res.status(400).json({ error: 'VALIDATION_ERROR', message })
          return
        }
        if (isSchemaMissing(err)) {
          res.status(503).json({
            error: 'SCHEMA_NOT_READY',
            message: 'Run migration 026_confirmation_tables.sql',
          })
          return
        }
        throw err
      }
    },
  )

  app.post(
    '/api/v1/confirmation/:idiw37/close',
    ...requireConfirmWrite,
    async (req: Request, res: Response) => {
      const user = req.authUser
      if (!user) {
        res.status(401).json({ error: 'UNAUTHORIZED', message: 'ต้องเข้าสู่ระบบ' })
        return
      }

      const idParsed = confirmationIdParamSchema.safeParse(req.params)
      if (!idParsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid idiw37' })
        return
      }

      const bodyParsed = confirmationAddCloseBodySchema.safeParse(req.body)
      if (!bodyParsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid body' })
        return
      }

      try {
        const { assertTechnicianCloseWoAccess, CloseWoAccessDeniedError } = await import(
          '../lib/close-wo-access.js'
        )
        try {
          await assertTechnicianCloseWoAccess(pool, {
            idiw37: idParsed.data.idiw37,
            wkctr: bodyParsed.data.wkctr,
            userst: user.userst,
            loginWkctr: user.wkctr || user.username || null,
          })
        } catch (err) {
          if (err instanceof CloseWoAccessDeniedError) {
            res.status(403).json({ error: 'FORBIDDEN', message: err.message })
            return
          }
          throw err
        }

        await addConfirmationClose(pool, {
          idiw37: idParsed.data.idiw37,
          wkctr: bodyParsed.data.wkctr,
          startD: bodyParsed.data.startD,
          startT: bodyParsed.data.startT,
          endD: bodyParsed.data.endD,
          endT: bodyParsed.data.endT,
          cwkctr: user.wkctr || user.username || null,
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        res.status(400).json({ error: 'VALIDATION_ERROR', message })
        return
      }

      voidAudit(pool, req, {
        action: 'confirmation.close',
        resource: 'tbcofirm',
        resourceId: String(idParsed.data.idiw37),
        after: sanitizeAuditPayload(bodyParsed.data),
      })
      res.json(confirmationAddCloseResponseSchema.parse({ ok: true }))
    },
  )

  app.delete(
    '/api/v1/confirmation/close/:idclose',
    ...requireConfirmWrite,
    async (req: Request, res: Response) => {
      const parsed = confirmationCloseIdParamSchema.safeParse(req.params)
      if (!parsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid idclose' })
        return
      }
      await deleteConfirmationClose(pool, parsed.data.idclose)
      voidAudit(pool, req, {
        action: 'confirmation.close',
        resource: 'tbcofirm',
        resourceId: String(parsed.data.idclose),
        message: 'delete',
      })
      res.json(confirmationDeleteCloseResponseSchema.parse({ ok: true }))
    },
  )

  app.get(
    '/api/v1/confirmation/:idiw37/personnel-closes',
    ...requireConfirmRead,
    async (req: Request, res: Response) => {
      const parsed = confirmationIdParamSchema.safeParse(req.params)
      if (!parsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid idiw37' })
        return
      }
      try {
        const items = await listPersonnelCloses(pool, parsed.data.idiw37)
        res.json(personnelClosesResponseSchema.parse({ items }))
      } catch (err) {
        if (err instanceof Error && err.name === 'ZodError') throw err
        if (isSchemaMissing(err)) {
          res.status(503).json({
            error: 'SCHEMA_NOT_READY',
            message: 'Run database/migrations/073_tbwrkclose.sql',
          })
          return
        }
        throw err
      }
    },
  )

  app.post(
    '/api/v1/confirmation/:idiw37/personnel-close',
    ...requireConfirmWrite,
    async (req: Request, res: Response) => {
      const user = req.authUser
      if (!user) {
        res.status(401).json({ error: 'UNAUTHORIZED', message: 'ต้องเข้าสู่ระบบ' })
        return
      }

      const idParsed = confirmationIdParamSchema.safeParse(req.params)
      if (!idParsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid idiw37' })
        return
      }
      const bodyParsed = confirmationAddCloseBodySchema.safeParse(req.body)
      if (!bodyParsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid body' })
        return
      }
      try {
        const { assertTechnicianCloseWoAccess, CloseWoAccessDeniedError } = await import(
          '../lib/close-wo-access.js'
        )
        try {
          await assertTechnicianCloseWoAccess(pool, {
            idiw37: idParsed.data.idiw37,
            wkctr: bodyParsed.data.wkctr,
            userst: user.userst,
            loginWkctr: user.wkctr || user.username || null,
          })
        } catch (err) {
          if (err instanceof CloseWoAccessDeniedError) {
            res.status(403).json({ error: 'FORBIDDEN', message: err.message })
            return
          }
          throw err
        }

        await addPersonnelClose(pool, {
          idiw37: idParsed.data.idiw37,
          wkctr: bodyParsed.data.wkctr,
          startD: bodyParsed.data.startD,
          startT: bodyParsed.data.startT,
          endD: bodyParsed.data.endD,
          endT: bodyParsed.data.endT,
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        const isDup = message.includes('ปิดงานไปแล้ว')
        res.status(isDup ? 409 : 400).json({
          error: isDup ? 'DUPLICATE' : 'VALIDATION_ERROR',
          message,
        })
        return
      }
      voidAudit(pool, req, {
        action: 'confirmation.personnel_close',
        resource: 'tbwrkclose',
        resourceId: String(idParsed.data.idiw37),
        after: sanitizeAuditPayload(bodyParsed.data),
      })
      res.json(confirmationAddCloseResponseSchema.parse({ ok: true }))
    },
  )

  app.delete(
    '/api/v1/confirmation/personnel-close/:idwrkclose',
    ...requireConfirmWrite,
    async (req: Request, res: Response) => {
      const parsed = personnelCloseIdParamSchema.safeParse(req.params)
      if (!parsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid idwrkclose' })
        return
      }
      try {
        await deletePersonnelClose(pool, parsed.data.idwrkclose)
      } catch (err) {
        if (err instanceof Error && err.name === 'ZodError') throw err
        if (isSchemaMissing(err)) {
          res.status(503).json({
            error: 'SCHEMA_NOT_READY',
            message: 'Run database/migrations/073_tbwrkclose.sql',
          })
          return
        }
        throw err
      }
      voidAudit(pool, req, {
        action: 'confirmation.personnel_close',
        resource: 'tbwrkclose',
        resourceId: String(parsed.data.idwrkclose),
        message: 'delete',
      })
      res.json(confirmationDeleteCloseResponseSchema.parse({ ok: true }))
    },
  )

 // POST /api/v1/confirmation/import/preview — ตรวจก่อน commit ()
  app.post(
    '/api/v1/confirmation/import/preview',
    ...requireConfirmImport,
    uploadExcel.single('file'),
    async (req: Request, res: Response) => {
      const file = req.file
      if (!file?.buffer?.length) {
        res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'Multipart field "file" (.xls, .xlsx, .csv) is required',
        })
        return
      }

      const fileName = file.originalname || 'Confirm.xlsx'
      const lower = fileName.toLowerCase()
      if (!lower.endsWith('.xls') && !lower.endsWith('.xlsx') && !lower.endsWith('.csv')) {
        res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'Only .xls, .xlsx, or .csv files are allowed',
        })
        return
      }

      try {
        const result = await previewConfirmFile(pool, fileName, file.buffer)
        res.json(
          confirmationImportPreviewResponseSchema.parse({
            preview: true,
            fileName,
            ...result,
          }),
        )
      } catch (err) {
        if (err instanceof Error && err.name === 'ZodError') throw err
        if (isSchemaMissing(err)) {
          res.status(503).json({
            error: 'SCHEMA_NOT_READY',
            message:
              'Run migrations 026_confirmation_tables.sql และ 032_tbcofirm_import_uniq.sql',
          })
          return
        }
        const message = err instanceof Error ? err.message : 'Preview failed'
        res.status(400).json({ error: 'IMPORT_FAILED', message })
      }
    },
  )

 // POST /api/v1/confirmation/import (Admin only)
 // skip 2 rows + validate ตาม PHP บรรทัด 76 + insert/update upsert rules
  app.post(
    '/api/v1/confirmation/import',
    ...requireConfirmImport,
    uploadExcel.single('file'),
    async (req: Request, res: Response) => {
      const user = req.authUser
      if (!user) {
        res.status(401).json({ error: 'UNAUTHORIZED', message: 'ต้องเข้าสู่ระบบ' })
        return
      }

      const file = req.file
      if (!file?.buffer?.length) {
        res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'Multipart field "file" (.xls, .xlsx, .csv) is required',
        })
        return
      }

      const fileName = file.originalname || 'Confirm.xlsx'
      const lower = fileName.toLowerCase()
      if (!lower.endsWith('.xls') && !lower.endsWith('.xlsx') && !lower.endsWith('.csv')) {
        res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'Only .xls, .xlsx, or .csv files are allowed',
        })
        return
      }

      try {
        const summary = await importConfirmFile(pool, fileName, file.buffer)
        voidAudit(pool, req, {
          action: 'confirmation.import',
          resource: 'tbcofirm',
          after: { fileName, ...summary },
        })
        res.json(confirmationImportResponseSchema.parse({ fileName, ...summary }))
      } catch (err) {
        if (err instanceof Error && err.name === 'ZodError') throw err
        if (isSchemaMissing(err)) {
          res.status(503).json({
            error: 'SCHEMA_NOT_READY',
            message:
              'Run migrations 026_confirmation_tables.sql และ 032_tbcofirm_import_uniq.sql',
          })
          return
        }
        const message = err instanceof Error ? err.message : 'Import failed'
        res.status(400).json({ error: 'IMPORT_FAILED', message })
      }
    },
  )
}
