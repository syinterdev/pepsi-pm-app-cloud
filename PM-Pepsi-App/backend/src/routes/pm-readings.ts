import type { Express, Request, Response } from 'express'
import type { Pool } from 'pg'
import multer from 'multer'
import { voidAudit, sanitizeAuditPayload } from '../lib/audit-mutation.js'
import {
  buildPmReadingsImportTemplateBuffer,
  parsePmReadingsWorkbook,
} from '../lib/pm-readings-import.js'
import { createRequirePermission } from '../middleware/require-permission.js'
import {
  pmReadingBatchBodySchema,
  pmReadingImportResultSchema,
} from '../schemas/pm-readings-import.js'
import { batchCreatePmReadings, importPmReadingRows } from '../services/pm-readings-import.js'
import { resolveWorkOrderIdiw37 } from '../services/work-orders.js'

function isSchemaMissing(err: unknown): boolean {
  const message = err instanceof Error ? err.message : ''
  return (
    message.includes('does not exist') ||
    message.includes('undefined table') ||
    message.includes('tbwo_pm_reading') ||
    message.includes('tbwo_pm_note_entry') ||
    message.includes('tbwo_pm_note')
  )
}

const SCHEMA_HINT = 'Run database/migrations/092_wo_pm_execution.sql'

export function registerPmReadingsRoutes(app: Express, pool: Pool, sessionSecret: string) {
  const perm = createRequirePermission(pool, sessionSecret)
  const requireConfirmRead = perm('confirmation.read')
  const requireConfirmWrite = perm('confirmation.write')

  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
  })

  app.get(
    '/api/v1/pm-readings/import-template.xlsx',
    ...requireConfirmRead,
    (_req: Request, res: Response) => {
      const buf = buildPmReadingsImportTemplateBuffer()
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      )
      res.setHeader('Content-Disposition', 'attachment; filename="PM_Vibration_Template.xlsx"')
      res.status(200).send(buf)
    },
  )

  app.post(
    '/api/v1/pm-readings/batch',
    ...requireConfirmWrite,
    async (req: Request, res: Response) => {
      const user = req.authUser
      if (!user) {
        res.status(401).json({ error: 'UNAUTHORIZED', message: 'ต้องเข้าสู่ระบบ' })
        return
      }
      const parsed = pmReadingBatchBodySchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid body', issues: parsed.error.issues })
        return
      }
      const actor = user.wkctr || user.username || ''
      const orderKey = parsed.data.orderId?.trim() || parsed.data.wkorder?.trim() || ''
      try {
        let idiw37: number | null = null
        let wkorder = parsed.data.wkorder?.trim() ?? ''
        if (orderKey) {
          idiw37 = await resolveWorkOrderIdiw37(pool, orderKey)
          if (idiw37 == null) {
            res.status(404).json({ error: 'NOT_FOUND', message: 'ไม่พบใบงาน' })
            return
          }
        }
        const result = await batchCreatePmReadings(
          pool,
          parsed.data.items,
          actor,
          wkorder || orderKey,
          idiw37 ?? undefined,
        )
        voidAudit(pool, req, {
          action: 'confirmation.write',
          resource: 'tbwo_pm_reading',
          resourceId: orderKey || 'batch',
          after: sanitizeAuditPayload({ imported: result.imported, failed: result.failed }),
        })
        res.json(pmReadingImportResultSchema.parse({ ok: true, ...result }))
      } catch (err) {
        if (isSchemaMissing(err)) {
          res.status(503).json({ error: 'SCHEMA_NOT_READY', message: SCHEMA_HINT })
          return
        }
        throw err
      }
    },
  )

  app.post(
    '/api/v1/pm-readings/import',
    ...requireConfirmWrite,
    upload.single('file'),
    async (req: Request, res: Response) => {
      const user = req.authUser
      if (!user) {
        res.status(401).json({ error: 'UNAUTHORIZED', message: 'ต้องเข้าสู่ระบบ' })
        return
      }
      const file = req.file
      if (!file?.buffer?.length) {
        res.status(400).json({ error: 'VALIDATION_ERROR', message: 'เลือกไฟล์ .xlsx ก่อน' })
        return
      }
      const actor = user.wkctr || user.username || ''
      try {
        const wkorder =
          typeof req.body?.wkorder === 'string' ? req.body.wkorder.trim() : ''
        const { rows, issues } = parsePmReadingsWorkbook(file.buffer, { defaultWkorder: wkorder })
        const result = await importPmReadingRows(pool, rows, actor, issues)
        voidAudit(pool, req, {
          action: 'confirmation.write',
          resource: 'tbwo_pm_reading',
          resourceId: file.originalname,
          after: sanitizeAuditPayload({ imported: result.imported, failed: result.failed }),
        })
        res.json(pmReadingImportResultSchema.parse({ ok: true, ...result }))
      } catch (err) {
        if (isSchemaMissing(err)) {
          res.status(503).json({ error: 'SCHEMA_NOT_READY', message: SCHEMA_HINT })
          return
        }
        throw err
      }
    },
  )
}
