import type { Express, Request, Response } from 'express'
import type { Pool } from 'pg'
import { auditLogFromRequest } from '../lib/audit-log.js'
import { sanitizeAuditPayload } from '../lib/audit-mutation.js'
import { createRequireAnyPermission, createRequirePermission } from '../middleware/require-permission.js'
import {
  adminSecretSettingsResponseSchema,
  adminSettingsResponseSchema,
  settingsResetSectionSchema,
} from '../schemas/admin-settings.js'
import { listMaskedSecretSettings } from '../lib/setting-secrets.js'
import {
  getAdminSettings,
  patchAdminSettings,
  resetAdminSettings,
  resetAdminSettingsSection,
} from '../services/admin-settings.js'
import { isSettingTableMissing } from '../services/setting-store.js'

const SCHEMA_HINT = 'รัน migration 047_tbl_setting.sql ก่อนใช้งาน System Settings'

function actorId(req: Request): string {
  const u = req.authUser
  if (!u) return 'unknown'
  return (u.username ?? u.idwkctr ?? u.fullnameTh ?? 'unknown').trim() || 'unknown'
}

export function registerAdminSettingsRoutes(app: Express, pool: Pool, sessionSecret: string) {
  const requireRead = createRequireAnyPermission(pool, sessionSecret)([
    'admin.settings.read',
    'admin.settings.write',
  ])
  const requireWrite = createRequirePermission(pool, sessionSecret)('admin.settings.write')

  app.get('/api/v1/admin/settings/secrets', ...requireRead, async (_req: Request, res: Response) => {
    try {
      const items = await listMaskedSecretSettings(pool)
      res.json(adminSecretSettingsResponseSchema.parse({ items }))
    } catch (err) {
      if (isSettingTableMissing(err)) {
        res.status(503).json({ error: 'SCHEMA_NOT_READY', message: SCHEMA_HINT })
        return
      }
      throw err
    }
  })

  app.get('/api/v1/admin/settings', ...requireRead, async (_req: Request, res: Response) => {
    try {
      const data = await getAdminSettings(pool)
      res.json(adminSettingsResponseSchema.parse(data))
    } catch (err) {
      if (isSettingTableMissing(err)) {
        res.status(503).json({ error: 'SCHEMA_NOT_READY', message: SCHEMA_HINT })
        return
      }
      throw err
    }
  })

  app.patch('/api/v1/admin/settings', ...requireWrite, async (req: Request, res: Response) => {
    try {
      const data = await patchAdminSettings(pool, req.body, actorId(req))
      void auditLogFromRequest(pool, req, {
        action: 'admin.settings.update',
        resource: 'tbl_setting',
        after: sanitizeAuditPayload(req.body),
      })
      res.json(adminSettingsResponseSchema.parse(data))
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
    '/api/v1/admin/settings/reset/:section',
    ...requireWrite,
    async (req: Request, res: Response) => {
      const parsed = settingsResetSectionSchema.safeParse(req.params.section)
      if (!parsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR', message: 'section ไม่ถูกต้อง' })
        return
      }
      try {
        const data = await resetAdminSettingsSection(pool, parsed.data, actorId(req))
        void auditLogFromRequest(pool, req, {
          action: 'admin.settings.reset',
          resource: 'tbl_setting',
          resourceId: parsed.data,
        })
        res.json(adminSettingsResponseSchema.parse(data))
      } catch (err) {
        if (isSettingTableMissing(err)) {
          res.status(503).json({ error: 'SCHEMA_NOT_READY', message: SCHEMA_HINT })
          return
        }
        throw err
      }
    },
  )

  app.post('/api/v1/admin/settings/reset', ...requireWrite, async (req: Request, res: Response) => {
    try {
      const data = await resetAdminSettings(pool, actorId(req))
      void auditLogFromRequest(pool, req, {
        action: 'admin.settings.reset',
        resource: 'tbl_setting',
      })
      res.json(adminSettingsResponseSchema.parse(data))
    } catch (err) {
      if (isSettingTableMissing(err)) {
        res.status(503).json({ error: 'SCHEMA_NOT_READY', message: SCHEMA_HINT })
        return
      }
      throw err
    }
  })
}
