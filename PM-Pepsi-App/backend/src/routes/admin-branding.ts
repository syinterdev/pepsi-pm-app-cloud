import type { Express, Request, Response } from 'express'
import multer from 'multer'
import type { Pool } from 'pg'
import { auditLogFromRequest } from '../lib/audit-log.js'
import { sanitizeAuditPayload, voidAudit } from '../lib/audit-mutation.js'
import { createRequireAnyPermission, createRequirePermission } from '../middleware/require-permission.js'
import {
  adminBrandingResponseSchema,
  brandingImageUploadResponseSchema,
  brandingOkSchema,
} from '../schemas/admin-branding.js'
import {
  clearBrandingFavicon,
  clearBrandingLoginBackground,
  clearBrandingLogo,
  getAdminBranding,
  patchAdminBranding,
  resetBrandingDefaults,
  setBrandingFavicon,
  setBrandingLoginBackground,
  setBrandingLogo,
} from '../services/admin-branding.js'
import { parseRemoveBackgroundField } from '../lib/remove-light-background.js'
import { getMulterFileSizeLimit } from '../lib/upload-settings.js'
import { isSettingTableMissing } from '../services/setting-store.js'

const SCHEMA_HINT = 'รัน migration 047_tbl_setting.sql ก่อนใช้งาน Branding'

function actorId(req: Request): string {
  const u = req.authUser
  if (!u) return 'unknown'
  return (u.username ?? u.idwkctr ?? u.fullnameTh ?? 'unknown').trim() || 'unknown'
}

export function registerAdminBrandingRoutes(app: Express, pool: Pool, sessionSecret: string) {
  const requireRead = createRequireAnyPermission(pool, sessionSecret)([
    'admin.branding.read',
    'admin.branding.write',
  ])
  const requireWrite = createRequirePermission(pool, sessionSecret)('admin.branding.write')

  const uploadImage = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: Math.min(4 * 1024 * 1024, getMulterFileSizeLimit()),
    },
  })

  const uploadLoginBackground = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: Math.min(8 * 1024 * 1024, getMulterFileSizeLimit()),
    },
  })

  app.get('/api/v1/admin/branding', ...requireRead, async (_req: Request, res: Response) => {
    try {
      const data = await getAdminBranding(pool)
      res.json(adminBrandingResponseSchema.parse(data))
    } catch (err) {
      if (isSettingTableMissing(err)) {
        res.status(503).json({ error: 'SCHEMA_NOT_READY', message: SCHEMA_HINT })
        return
      }
      throw err
    }
  })

  app.patch('/api/v1/admin/branding', ...requireWrite, async (req: Request, res: Response) => {
    try {
      const data = await patchAdminBranding(pool, req.body, actorId(req))
      void auditLogFromRequest(pool, req, {
        action: 'admin.branding.update',
        resource: 'tbl_setting',
        after: sanitizeAuditPayload(req.body),
      })
      res.json(adminBrandingResponseSchema.parse(data))
    } catch (err) {
      if (isSettingTableMissing(err)) {
        res.status(503).json({ error: 'SCHEMA_NOT_READY', message: SCHEMA_HINT })
        return
      }
      const message = err instanceof Error ? err.message : String(err)
      if (message.includes('ต้องระบุอย่างน้อย')) {
        res.status(400).json({ error: 'VALIDATION_ERROR', message })
        return
      }
      throw err
    }
  })

  app.post(
    '/api/v1/admin/branding/reset',
    ...requireWrite,
    async (req: Request, res: Response) => {
      try {
        const data = await resetBrandingDefaults(pool, actorId(req))
        void auditLogFromRequest(pool, req, {
          action: 'admin.branding.reset',
          resource: 'tbl_setting',
        })
        res.json(adminBrandingResponseSchema.parse(data))
      } catch (err) {
        if (isSettingTableMissing(err)) {
          res.status(503).json({ error: 'SCHEMA_NOT_READY', message: SCHEMA_HINT })
          return
        }
        throw err
      }
    },
  )

  app.post(
    '/api/v1/admin/branding/logo',
    ...requireWrite,
    uploadImage.single('file'),
    async (req: Request, res: Response) => {
      const file = req.file
      if (!file) {
        res.status(400).json({ error: 'VALIDATION_ERROR', message: 'file is required' })
        return
      }
      const mime = file.mimetype ?? ''
      const allowed =
        mime === 'image/png' ||
        mime === 'image/jpeg' ||
        mime === 'image/webp' ||
        mime === 'image/gif' ||
        mime === 'image/svg+xml'
      if (!allowed) {
        res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'รองรับ PNG, JPEG, WebP, GIF, SVG เท่านั้น',
        })
        return
      }
      try {
        const removeBackground = parseRemoveBackgroundField(req.body?.removeBackground)
        const out = await setBrandingLogo(pool, file.buffer, actorId(req), mime, { removeBackground })
        voidAudit(pool, req, {
          action: 'admin.branding.update',
          resource: 'tbl_setting',
          resourceId: 'app.logo_bytes',
          after: { bytes: out.bytes, width: out.width, height: out.height },
        })
        res.json(brandingImageUploadResponseSchema.parse(out))
      } catch (err) {
        if (isSettingTableMissing(err)) {
          res.status(503).json({ error: 'SCHEMA_NOT_READY', message: SCHEMA_HINT })
          return
        }
        const message = err instanceof Error ? err.message : String(err)
        res.status(400).json({ error: 'IMAGE_ERROR', message })
      }
    },
  )

  app.delete('/api/v1/admin/branding/logo', ...requireWrite, async (req: Request, res: Response) => {
    try {
      await clearBrandingLogo(pool, actorId(req))
      voidAudit(pool, req, {
        action: 'admin.branding.update',
        resource: 'tbl_setting',
        resourceId: 'app.logo_bytes',
        message: 'logo_reset',
      })
      res.json(brandingOkSchema.parse({ ok: true }))
    } catch (err) {
      if (isSettingTableMissing(err)) {
        res.status(503).json({ error: 'SCHEMA_NOT_READY', message: SCHEMA_HINT })
        return
      }
      throw err
    }
  })

  app.post(
    '/api/v1/admin/branding/favicon',
    ...requireWrite,
    uploadImage.single('file'),
    async (req: Request, res: Response) => {
      const file = req.file
      if (!file) {
        res.status(400).json({ error: 'VALIDATION_ERROR', message: 'file is required' })
        return
      }
      const mime = file.mimetype ?? ''
      if (mime !== 'image/png' && mime !== 'image/jpeg' && mime !== 'image/webp') {
        res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'Favicon รองรับ PNG, JPEG, WebP เท่านั้น',
        })
        return
      }
      try {
        const removeBackground = parseRemoveBackgroundField(req.body?.removeBackground)
        const out = await setBrandingFavicon(pool, file.buffer, actorId(req), mime, { removeBackground })
        voidAudit(pool, req, {
          action: 'admin.branding.update',
          resource: 'tbl_setting',
          resourceId: 'app.favicon_bytes',
          after: { bytes: out.bytes },
        })
        res.json(brandingImageUploadResponseSchema.parse(out))
      } catch (err) {
        if (isSettingTableMissing(err)) {
          res.status(503).json({ error: 'SCHEMA_NOT_READY', message: SCHEMA_HINT })
          return
        }
        const message = err instanceof Error ? err.message : String(err)
        res.status(400).json({ error: 'IMAGE_ERROR', message })
      }
    },
  )

  app.delete('/api/v1/admin/branding/favicon', ...requireWrite, async (req: Request, res: Response) => {
    try {
      await clearBrandingFavicon(pool, actorId(req))
      voidAudit(pool, req, {
        action: 'admin.branding.update',
        resource: 'tbl_setting',
        resourceId: 'app.favicon_bytes',
        message: 'favicon_reset',
      })
      res.json(brandingOkSchema.parse({ ok: true }))
    } catch (err) {
      if (isSettingTableMissing(err)) {
        res.status(503).json({ error: 'SCHEMA_NOT_READY', message: SCHEMA_HINT })
        return
      }
      throw err
    }
  })

  app.post(
    '/api/v1/admin/branding/login-background',
    ...requireWrite,
    uploadLoginBackground.single('file'),
    async (req: Request, res: Response) => {
      const file = req.file
      if (!file) {
        res.status(400).json({ error: 'VALIDATION_ERROR', message: 'file is required' })
        return
      }
      const mime = file.mimetype ?? ''
      const allowed =
        mime === 'image/png' ||
        mime === 'image/jpeg' ||
        mime === 'image/webp' ||
        mime === 'image/gif' ||
        mime === 'image/svg+xml'
      if (!allowed) {
        res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'รองรับ PNG, JPEG, WebP, GIF, SVG เท่านั้น',
        })
        return
      }
      try {
        const out = await setBrandingLoginBackground(pool, file.buffer, actorId(req), mime)
        voidAudit(pool, req, {
          action: 'admin.branding.update',
          resource: 'tbl_setting',
          resourceId: 'app.login_bg_bytes',
          after: { bytes: out.bytes, width: out.width, height: out.height },
        })
        res.json(brandingImageUploadResponseSchema.parse(out))
      } catch (err) {
        if (isSettingTableMissing(err)) {
          res.status(503).json({ error: 'SCHEMA_NOT_READY', message: SCHEMA_HINT })
          return
        }
        const message = err instanceof Error ? err.message : String(err)
        res.status(400).json({ error: 'IMAGE_ERROR', message })
      }
    },
  )

  app.delete(
    '/api/v1/admin/branding/login-background',
    ...requireWrite,
    async (req: Request, res: Response) => {
      try {
        await clearBrandingLoginBackground(pool, actorId(req))
        voidAudit(pool, req, {
          action: 'admin.branding.update',
          resource: 'tbl_setting',
          resourceId: 'app.login_bg_bytes',
          message: 'login_bg_reset',
        })
        res.json(brandingOkSchema.parse({ ok: true }))
      } catch (err) {
        if (isSettingTableMissing(err)) {
          res.status(503).json({ error: 'SCHEMA_NOT_READY', message: SCHEMA_HINT })
          return
        }
        throw err
      }
    },
  )
}
