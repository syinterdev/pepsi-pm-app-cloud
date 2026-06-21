import type { Express, Request, Response } from 'express'
import type { Pool } from 'pg'
import { createRequireKioskOrAnyPermission } from '../middleware/require-kiosk-or-permission.js'
import { activeAnnouncementsResponseSchema } from '../schemas/admin-announcement.js'
import {
  isAnnouncementTableMissing,
  listActiveAnnouncements,
} from '../services/admin-announcement.js'

export function registerAnnouncementsRoutes(
  app: Express,
  pool: Pool,
  sessionSecret: string,
) {
  const requireBoardOrAuth = createRequireKioskOrAnyPermission(pool, sessionSecret, [
    'dashboard.read',
    'reports.read',
  ])

  app.get('/api/v1/announcements/active', ...requireBoardOrAuth, async (_req: Request, res: Response) => {
    try {
      const items = await listActiveAnnouncements(pool)
      res.json(
        activeAnnouncementsResponseSchema.parse({
          items: items.map((a) => ({
            id: a.id,
            level: a.level,
            title: a.title,
            body: a.body,
            startsAt: a.startsAt,
            endsAt: a.endsAt,
            dismissable: a.dismissable,
          })),
        }),
      )
    } catch (err) {
      if (isAnnouncementTableMissing(err)) {
        res.json(activeAnnouncementsResponseSchema.parse({ items: [] }))
        return
      }
      throw err
    }
  })
}
