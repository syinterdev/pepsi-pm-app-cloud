import type { Express, Request, Response } from 'express'
import type { Pool } from 'pg'
import { voidAudit } from '../lib/audit-mutation.js'
import { createRequirePermission } from '../middleware/require-permission.js'
import {
  announcementDeleteResponseSchema,
  announcementItemSchema,
  announcementListResponseSchema,
  createAnnouncementBodySchema,
  patchAnnouncementBodySchema,
} from '../schemas/admin-announcement.js'
import {
  createAnnouncement,
  deleteAnnouncement,
  isAnnouncementTableMissing,
  listAnnouncements,
  patchAnnouncement,
} from '../services/admin-announcement.js'

const SCHEMA_HINT = 'รัน migration 064_tbl_announcement.sql ก่อนใช้งานประกาศ'

function actorId(req: Request): string {
  const u = req.authUser
  if (!u) return 'unknown'
  return (u.username ?? u.idwkctr ?? u.fullnameTh ?? 'unknown').trim() || 'unknown'
}

export function registerAdminAnnouncementRoutes(
  app: Express,
  pool: Pool,
  sessionSecret: string,
) {
  const requireRead = createRequirePermission(pool, sessionSecret)('admin.announcement.read')
  const requireWrite = createRequirePermission(pool, sessionSecret)('admin.announcement.write')

  app.get('/api/v1/admin/announcements', ...requireRead, async (_req: Request, res: Response) => {
    try {
      const items = await listAnnouncements(pool)
      res.json(announcementListResponseSchema.parse({ items }))
    } catch (err) {
      if (isAnnouncementTableMissing(err)) {
        res.status(503).json({ error: 'SCHEMA_MISSING', message: SCHEMA_HINT })
        return
      }
      throw err
    }
  })

  app.post('/api/v1/admin/announcements', ...requireWrite, async (req: Request, res: Response) => {
    const parsed = createAnnouncementBodySchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: 'VALIDATION_ERROR', issues: parsed.error.issues })
      return
    }
    try {
      const item = await createAnnouncement(pool, parsed.data, actorId(req))
      voidAudit(pool, req, {
        action: 'admin.announcement.create',
        resource: 'tbl_announcement',
        resourceId: String(item.id),
        status: 'ok',
        after: item,
      })
      res.status(201).json(announcementItemSchema.parse(item))
    } catch (err) {
      if (isAnnouncementTableMissing(err)) {
        res.status(503).json({ error: 'SCHEMA_MISSING', message: SCHEMA_HINT })
        return
      }
      throw err
    }
  })

  app.put('/api/v1/admin/announcements/:id', ...requireWrite, async (req: Request, res: Response) => {
    const parsed = patchAnnouncementBodySchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: 'VALIDATION_ERROR', issues: parsed.error.issues })
      return
    }
    const id = Number(req.params.id)
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid id' })
      return
    }
    try {
      const item = await patchAnnouncement(pool, id, parsed.data)
      if (!item) {
        res.status(404).json({ error: 'NOT_FOUND' })
        return
      }
      voidAudit(pool, req, {
        action: 'admin.announcement.update',
        resource: 'tbl_announcement',
        resourceId: String(id),
        status: 'ok',
        after: item,
      })
      res.json(announcementItemSchema.parse(item))
    } catch (err) {
      if (isAnnouncementTableMissing(err)) {
        res.status(503).json({ error: 'SCHEMA_MISSING', message: SCHEMA_HINT })
        return
      }
      throw err
    }
  })

  app.delete('/api/v1/admin/announcements/:id', ...requireWrite, async (req: Request, res: Response) => {
    const id = Number(req.params.id)
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid id' })
      return
    }
    try {
      const ok = await deleteAnnouncement(pool, id)
      if (!ok) {
        res.status(404).json({ error: 'NOT_FOUND' })
        return
      }
      voidAudit(pool, req, {
        action: 'admin.announcement.delete',
        resource: 'tbl_announcement',
        resourceId: String(id),
        status: 'ok',
      })
      res.json(announcementDeleteResponseSchema.parse({ ok: true, id }))
    } catch (err) {
      if (isAnnouncementTableMissing(err)) {
        res.status(503).json({ error: 'SCHEMA_MISSING', message: SCHEMA_HINT })
        return
      }
      throw err
    }
  })
}
