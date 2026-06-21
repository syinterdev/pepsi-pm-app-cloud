/**
 * Personnel routes — Personal Dashboard ของ user ปัจจุบัน + Admin CRUD (personnel admin)
 * รวมถึง upload ภาพ (แปลงเป็น WebP เก็บใน DB) และ Excel import
 */
import { getMulterFileSizeLimit } from '../lib/upload-settings.js'
import { WkctrCodeConflictError } from '../lib/wkctr-code.js'
import type { Express, Request, Response } from 'express'
import type { Pool } from 'pg'
import multer from 'multer'
import { voidAudit, sanitizeAuditPayload } from '../lib/audit-mutation.js'
import { createRequireApiAuth } from '../middleware/require-api-auth.js'
import { createRequirePermission } from '../middleware/require-permission.js'
import { personnelDashboardResponseSchema } from '../schemas/personnel.js'
import {
  personnelAdminItemSchema,
  personnelAdminListResponseSchema,
  personnelAdminOkSchema,
  personnelAdminUpsertBodySchema,
  personnelImageUploadResponseSchema,
  personnelImportResponseSchema,
  personnelWorkstatusOptionsResponseSchema,
} from '../schemas/personnel-admin.js'
import { personnelConfirmListResponseSchema } from '../schemas/personnel-confirm.js'
import { getPersonnelDashboard } from '../services/personnel.js'
import {
  clearPersonnelImage,
  deletePersonnelAdmin,
  getPersonnelAdminOne,
  getPersonnelImage,
  importPersonnelFile,
  listPersonnelAdmin,
  listPersonnelWorkstatuses,
  setPersonnelImage,
  upsertPersonnelAdmin,
} from '../services/personnel-admin.js'
import { listPersonnelConfirm } from '../services/personnel-confirm.js'

function isSchemaMissing(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : ''
  return (
    msg.includes('does not exist') ||
    msg.includes('undefined table') ||
    msg.includes('imgmember_data') ||
    msg.includes('tbworkcenter') ||
    msg.includes('relation')
  )
}

const SCHEMA_HINT_DASHBOARD =
  'Run migrations 001 (tbworkcenter), 007 (view_planwork), 026 (tbcofirm), 041 (tbworkcenter.userrole) ก่อนเปิดใช้งาน Personal Dashboard'
const SCHEMA_HINT_ADMIN =
  'Run migrations 035_tbworkcenter_full_personnel_columns.sql และ 041_tbworkcenter_userrole.sql (ขยายตาราง + imgmember WebP + explicit userrole)'
const SCHEMA_HINT_CONFIRM =
  'Run migration 036_view_countpersonelclose.sql (view สรุป % การปิดงานของช่างต่อ WO)'
const SCHEMA_HINT_WORKSTATUS =
  'Run migration 039_tbwkctrstatus.sql (lookup สถานะบุคลากร ACTIVE/INACTIVE/LEAVE/RESIGNED/RETIRED/TERMINATED)'

export function registerPersonnelRoutes(
  app: Express,
  pool: Pool,
  sessionSecret: string,
) {
  const perm = createRequirePermission(pool, sessionSecret)
  const requirePersonnelRead = perm('personnel.read')
  const requirePersonnelWrite = perm('personnel.write')
  const requirePersonnelImport = perm('personnel.import')
  const requirePersonnelConfirmRead = perm('personnel.confirm.read')
  const requireAuthOnly = createRequireApiAuth(sessionSecret)

  // multer สำหรับภาพประจำตัว (ต้นฉบับก่อนแปลงเป็น WebP) — รองรับ jpeg/png/webp/gif/avif/heif
  const uploadImage = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 8 * 1024 * 1024 },
  })
  // multer สำหรับ Excel/CSV นำเข้า (Personel.xlsx)
  const uploadExcel = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: getMulterFileSizeLimit() },
  })

  app.get(
    '/api/v1/personnel/me/dashboard',
    ...requirePersonnelRead,
    async (req: Request, res: Response) => {
      const user = req.authUser
      if (!user) {
        res.status(401).json({ error: 'UNAUTHORIZED', message: 'ต้องเข้าสู่ระบบ' })
        return
      }

      try {
        const data = await getPersonnelDashboard(pool, user)
        res.json(personnelDashboardResponseSchema.parse(data))
      } catch (err) {
        if (isSchemaMissing(err)) {
          res.status(503).json({ error: 'SCHEMA_NOT_READY', message: SCHEMA_HINT_DASHBOARD })
          return
        }
        throw err
      }
    },
  )

  /* ───────────────────────── Admin CRUD ───────────────────────── */

  app.get(
    '/api/v1/personnel/admin',
    ...requirePersonnelWrite,
    async (req: Request, res: Response) => {
      const q = typeof req.query.q === 'string' ? req.query.q : undefined
      const limit = req.query.limit ? Number(req.query.limit) : undefined
      const offset = req.query.offset ? Number(req.query.offset) : undefined
      const status =
        typeof req.query.status === 'string' && req.query.status.trim()
          ? req.query.status.trim()
          : undefined
      try {
        const data = await listPersonnelAdmin(pool, { q, limit, offset, status })
        res.json(personnelAdminListResponseSchema.parse(data))
      } catch (err) {
        if (isSchemaMissing(err)) {
          res.status(503).json({ error: 'SCHEMA_NOT_READY', message: SCHEMA_HINT_ADMIN })
          return
        }
        throw err
      }
    },
  )

  // ลำดับสำคัญ: ต้องวางก่อน `/personnel/admin/:idwkctr` เพื่อกัน Express match `:idwkctr=workstatus-options`
  app.get(
    '/api/v1/personnel/admin/workstatus-options',
    ...requirePersonnelWrite,
    async (req: Request, res: Response) => {
      try {
        const items = await listPersonnelWorkstatuses(pool)
        res.json(personnelWorkstatusOptionsResponseSchema.parse({ items }))
      } catch (err) {
        if (isSchemaMissing(err)) {
          res.status(503).json({ error: 'SCHEMA_NOT_READY', message: SCHEMA_HINT_WORKSTATUS })
          return
        }
        throw err
      }
    },
  )

 /* ─────── Personnel Confirmation Dashboard ─────── */

  app.get(
    '/api/v1/personnel/admin/confirm',
    ...requirePersonnelConfirmRead,
    async (req: Request, res: Response) => {
      const q = typeof req.query.q === 'string' ? req.query.q : undefined
      const status =
        typeof req.query.status === 'string' &&
        ['all', 'not_started', 'in_progress', 'done', 'qc_pending'].includes(
          req.query.status,
        )
          ? (req.query.status as
              | 'all'
              | 'not_started'
              | 'in_progress'
              | 'done'
              | 'qc_pending')
          : 'all'
      const systRaw = req.query.syst
      const syst =
        typeof systRaw === 'string' && systRaw.length > 0
          ? systRaw.split(',').map((s) => s.trim()).filter(Boolean)
          : undefined
      const limit = req.query.limit ? Number(req.query.limit) : undefined
      const offset = req.query.offset ? Number(req.query.offset) : undefined
      try {
        const data = await listPersonnelConfirm(pool, {
          q,
          status,
          syst,
          limit,
          offset,
        })
        res.json(personnelConfirmListResponseSchema.parse(data))
      } catch (err) {
        if (isSchemaMissing(err)) {
          res
            .status(503)
            .json({ error: 'SCHEMA_NOT_READY', message: SCHEMA_HINT_CONFIRM })
          return
        }
        throw err
      }
    },
  )

  app.get(
    '/api/v1/personnel/admin/:idwkctr',
    ...requirePersonnelWrite,
    async (req: Request, res: Response) => {
      try {
        const item = await getPersonnelAdminOne(pool, req.params.idwkctr)
        if (!item) {
          res.status(404).json({ error: 'NOT_FOUND' })
          return
        }
        res.json(personnelAdminItemSchema.parse(item))
      } catch (err) {
        if (isSchemaMissing(err)) {
          res.status(503).json({ error: 'SCHEMA_NOT_READY', message: SCHEMA_HINT_ADMIN })
          return
        }
        throw err
      }
    },
  )

  app.post(
    '/api/v1/personnel/admin',
    ...requirePersonnelWrite,
    async (req: Request, res: Response) => {
      const parsed = personnelAdminUpsertBodySchema.safeParse(req.body)
      if (!parsed.success) {
        res
          .status(400)
          .json({ error: 'VALIDATION_ERROR', message: parsed.error.message })
        return
      }
      try {
        const out = await upsertPersonnelAdmin(pool, parsed.data)
        voidAudit(pool, req, {
          action: out.mode === 'inserted' ? 'admin.users.create' : 'admin.users.update',
          resource: 'tbworkcenter',
          resourceId: out.idwkctr,
          after: sanitizeAuditPayload(parsed.data),
        })
        res
          .status(out.mode === 'inserted' ? 201 : 200)
          .json(personnelAdminOkSchema.parse({ ok: true, idwkctr: out.idwkctr }))
      } catch (err) {
        if (err instanceof WkctrCodeConflictError) {
          res.status(409).json({ error: 'WKCTR_CONFLICT', message: err.message })
          return
        }
        if (isSchemaMissing(err)) {
          res.status(503).json({ error: 'SCHEMA_NOT_READY', message: SCHEMA_HINT_ADMIN })
          return
        }
        throw err
      }
    },
  )

  app.put(
    '/api/v1/personnel/admin/:idwkctr',
    ...requirePersonnelWrite,
    async (req: Request, res: Response) => {
      const body = { ...req.body, idwkctr: req.params.idwkctr }
      const parsed = personnelAdminUpsertBodySchema.safeParse(body)
      if (!parsed.success) {
        res
          .status(400)
          .json({ error: 'VALIDATION_ERROR', message: parsed.error.message })
        return
      }
      try {
        const out = await upsertPersonnelAdmin(pool, parsed.data)
        voidAudit(pool, req, {
          action: 'admin.users.update',
          resource: 'tbworkcenter',
          resourceId: out.idwkctr,
          after: sanitizeAuditPayload(parsed.data),
        })
        res.json(personnelAdminOkSchema.parse({ ok: true, idwkctr: out.idwkctr }))
      } catch (err) {
        if (err instanceof WkctrCodeConflictError) {
          res.status(409).json({ error: 'WKCTR_CONFLICT', message: err.message })
          return
        }
        if (isSchemaMissing(err)) {
          res.status(503).json({ error: 'SCHEMA_NOT_READY', message: SCHEMA_HINT_ADMIN })
          return
        }
        throw err
      }
    },
  )

  app.delete(
    '/api/v1/personnel/admin/:idwkctr',
    ...requirePersonnelWrite,
    async (req: Request, res: Response) => {
      const ok = await deletePersonnelAdmin(pool, req.params.idwkctr).catch(
        (err) => {
          if (isSchemaMissing(err)) return null
          throw err
        },
      )
      if (ok === null) {
        res.status(503).json({ error: 'SCHEMA_NOT_READY', message: SCHEMA_HINT_ADMIN })
        return
      }
      if (!ok) {
        res.status(404).json({ error: 'NOT_FOUND' })
        return
      }
      voidAudit(pool, req, {
        action: 'admin.users.delete',
        resource: 'tbworkcenter',
        resourceId: req.params.idwkctr,
      })
      res.json(personnelAdminOkSchema.parse({ ok: true, idwkctr: req.params.idwkctr }))
    },
  )

 /* ───────────────────────── Import ───────────────────────── */

  app.post(
    '/api/v1/personnel/admin/import',
    ...requirePersonnelImport,
    uploadExcel.single('file'),
    async (req: Request, res: Response) => {
      const file = req.file
      if (!file) {
        res.status(400).json({ error: 'VALIDATION_ERROR', message: 'file is required' })
        return
      }
      const lower = (file.originalname || '').toLowerCase()
      if (
        !lower.endsWith('.xls') &&
        !lower.endsWith('.xlsx') &&
        !lower.endsWith('.csv')
      ) {
        res.status(400).json({ error: 'VALIDATION_ERROR', message: 'รองรับเฉพาะ .xls/.xlsx/.csv' })
        return
      }
      try {
        const result = await importPersonnelFile(pool, {
          fileName: file.originalname || 'Personel.xlsx',
          buffer: file.buffer,
        })
        voidAudit(pool, req, {
          action: 'admin.users.import',
          resource: 'tbworkcenter',
          after: { fileName: file.originalname, totalRows: result.totalRows },
        })
        res.json(personnelImportResponseSchema.parse(result))
      } catch (err) {
        if (isSchemaMissing(err)) {
          res.status(503).json({ error: 'SCHEMA_NOT_READY', message: SCHEMA_HINT_ADMIN })
          return
        }
        throw err
      }
    },
  )

  /* ───────────────────────── Image (WebP in DB) ───────────────────────── */

  app.post(
    '/api/v1/personnel/admin/:idwkctr/image',
    ...requirePersonnelWrite,
    uploadImage.single('file'),
    async (req: Request, res: Response) => {
      const file = req.file
      if (!file) {
        res.status(400).json({ error: 'VALIDATION_ERROR', message: 'file is required' })
        return
      }
      const mime = file.mimetype || ''
      if (!mime.startsWith('image/')) {
        res
          .status(400)
          .json({ error: 'VALIDATION_ERROR', message: 'รองรับเฉพาะไฟล์ภาพ (image/*)' })
        return
      }
      try {
        const out = await setPersonnelImage(pool, req.params.idwkctr, file.buffer)
        if (!out) {
          res.status(404).json({ error: 'NOT_FOUND', message: 'idwkctr not found' })
          return
        }
        voidAudit(pool, req, {
          action: 'admin.users.update',
          resource: 'tbworkcenter',
          resourceId: req.params.idwkctr,
          message: 'image_upload',
          after: { imgmember: out.fileName, bytes: out.bytes },
        })
        res.json(
          personnelImageUploadResponseSchema.parse({
            idwkctr: req.params.idwkctr,
            imgmember: out.fileName,
            mime: 'image/webp',
            bytes: out.bytes,
            width: out.width,
            height: out.height,
          }),
        )
      } catch (err) {
        if (isSchemaMissing(err)) {
          res.status(503).json({ error: 'SCHEMA_NOT_READY', message: SCHEMA_HINT_ADMIN })
          return
        }
        const message = err instanceof Error ? err.message : String(err)
        res.status(400).json({ error: 'IMAGE_ERROR', message })
      }
    },
  )

  app.delete(
    '/api/v1/personnel/admin/:idwkctr/image',
    ...requirePersonnelWrite,
    async (req: Request, res: Response) => {
      const ok = await clearPersonnelImage(pool, req.params.idwkctr).catch(
        (err) => {
          if (isSchemaMissing(err)) return null
          throw err
        },
      )
      if (ok === null) {
        res.status(503).json({ error: 'SCHEMA_NOT_READY', message: SCHEMA_HINT_ADMIN })
        return
      }
      if (!ok) {
        res.status(404).json({ error: 'NOT_FOUND' })
        return
      }
      voidAudit(pool, req, {
        action: 'admin.users.update',
        resource: 'tbworkcenter',
        resourceId: req.params.idwkctr,
        message: 'image_delete',
      })
      res.json(personnelAdminOkSchema.parse({ ok: true, idwkctr: req.params.idwkctr }))
    },
  )

 // เปิดให้ทุก user ที่ login แล้วโหลดภาพได้ (เห็นกันได้ในระบบ) — <img src="imgMember/..."> ของ PHP
  app.get(
    '/api/v1/personnel/:idwkctr/image',
    requireAuthOnly,
    async (req: Request, res: Response) => {
      try {
        const out = await getPersonnelImage(pool, req.params.idwkctr)
        if (!out) {
          res.status(404).end()
          return
        }
        res.setHeader('Content-Type', out.mime)
        res.setHeader('Content-Length', String(out.bytes))
        res.setHeader('Cache-Control', 'private, max-age=60')
        res.status(200).send(out.data)
      } catch (err) {
        if (isSchemaMissing(err)) {
          res.status(503).json({ error: 'SCHEMA_NOT_READY', message: SCHEMA_HINT_ADMIN })
          return
        }
        throw err
      }
    },
  )
}
