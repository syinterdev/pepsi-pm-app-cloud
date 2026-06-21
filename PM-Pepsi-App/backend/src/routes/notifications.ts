import type { Express, Request, Response } from 'express'
import type { Pool } from 'pg'
import { z } from 'zod'
import { createRequireApiAuth } from '../middleware/require-api-auth.js'
import {
  listAppNotificationsForUser,
  markAllAppNotificationsRead,
  markAppNotificationRead,
} from '../services/app-notifications.js'

const notificationItemSchema = z.object({
  id: z.number().int().positive(),
  notifyKind: z.string(),
  title: z.string(),
  body: z.string().nullable(),
  linkRoute: z.string().nullable(),
  idiw37: z.number().int().positive().nullable(),
  read: z.boolean(),
  createdAt: z.string(),
})

const listResponseSchema = z.object({
  items: z.array(notificationItemSchema),
  unreadCount: z.number().int().nonnegative(),
})

export function registerNotificationRoutes(
  app: Express,
  pool: Pool,
  sessionSecret: string,
) {
  const requireAuth = createRequireApiAuth(sessionSecret)

  app.get('/api/v1/notifications', requireAuth, async (req: Request, res: Response) => {
    const wkctr = (req.authUser?.wkctr || req.authUser?.username || '').trim()
    if (!wkctr) {
      res.status(401).json({ error: 'UNAUTHORIZED' })
      return
    }
    const payload = await listAppNotificationsForUser(pool, wkctr, req.authUser?.userst)
    res.json(listResponseSchema.parse(payload))
  })

  app.post(
    '/api/v1/notifications/:id/read',
    requireAuth,
    async (req: Request, res: Response) => {
      const id = Number(req.params.id)
      if (!Number.isFinite(id) || id <= 0) {
        res.status(400).json({ error: 'BAD_REQUEST' })
        return
      }
      const wkctr = (req.authUser?.wkctr || req.authUser?.username || '').trim()
      const ok = await markAppNotificationRead(pool, id, wkctr, req.authUser?.userst)
      res.json({ ok })
    },
  )

  app.post(
    '/api/v1/notifications/read-all',
    requireAuth,
    async (req: Request, res: Response) => {
      const wkctr = (req.authUser?.wkctr || req.authUser?.username || '').trim()
      const count = await markAllAppNotificationsRead(pool, wkctr, req.authUser?.userst)
      res.json({ ok: true, count })
    },
  )
}
