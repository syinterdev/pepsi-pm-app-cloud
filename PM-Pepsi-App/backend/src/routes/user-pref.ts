import type { Express, Request, Response } from 'express'
import type { Pool } from 'pg'
import { voidAudit } from '../lib/audit-mutation.js'
import { createRequireApiAuth } from '../middleware/require-api-auth.js'
import {
  markTourSeenBodySchema,
  patchUserPrefBodySchema,
  userPrefSchema,
} from '../schemas/user-pref.js'
import { getUserPref, isUserPrefTableMissing, markTourSeen, patchUserPref } from '../services/user-pref.js'

const SCHEMA_HINT = 'รัน migration 068_tbl_user_pref.sql ก่อนใช้งาน User preferences'

function prefUserId(req: Request): string {
  const u = req.authUser
  if (!u) return 'unknown'
  return (u.memId ?? u.idwkctr ?? u.username).trim() || 'unknown'
}

export function registerUserPrefRoutes(app: Express, pool: Pool, sessionSecret: string) {
  const requireAuth = createRequireApiAuth(sessionSecret)

  app.get('/api/v1/user/preferences', requireAuth, async (req: Request, res: Response) => {
    try {
      const pref = await getUserPref(pool, prefUserId(req))
      res.json(userPrefSchema.parse(pref))
    } catch (err) {
      if (isUserPrefTableMissing(err)) {
        res.status(503).json({ error: 'SCHEMA_MISSING', message: SCHEMA_HINT })
        return
      }
      throw err
    }
  })

  app.patch('/api/v1/user/preferences', requireAuth, async (req: Request, res: Response) => {
    const parsed = patchUserPrefBodySchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: 'VALIDATION_ERROR', issues: parsed.error.issues })
      return
    }
    try {
      const pref = await patchUserPref(pool, prefUserId(req), parsed.data)
      voidAudit(pool, req, {
        action: 'user.pref.update',
        resource: 'tbl_user_pref',
        resourceId: prefUserId(req),
        after: parsed.data,
      })
      res.json(userPrefSchema.parse(pref))
    } catch (err) {
      if (isUserPrefTableMissing(err)) {
        res.status(503).json({ error: 'SCHEMA_MISSING', message: SCHEMA_HINT })
        return
      }
      throw err
    }
  })

  app.post('/api/v1/user/preferences/tour-seen', requireAuth, async (req: Request, res: Response) => {
    const parsed = markTourSeenBodySchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: 'VALIDATION_ERROR', issues: parsed.error.issues })
      return
    }
    try {
      const pref = await markTourSeen(pool, prefUserId(req), parsed.data.tourKey)
      voidAudit(pool, req, {
        action: 'user.pref.tour_seen',
        resource: 'tbl_user_pref',
        resourceId: prefUserId(req),
        after: { tourKey: parsed.data.tourKey },
      })
      res.json(userPrefSchema.parse(pref))
    } catch (err) {
      if (isUserPrefTableMissing(err)) {
        res.status(503).json({ error: 'SCHEMA_MISSING', message: SCHEMA_HINT })
        return
      }
      throw err
    }
  })
}
