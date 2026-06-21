import type { Express, Request, Response } from 'express'
import type { Pool } from 'pg'
import { createRequireKioskOrPermission } from '../middleware/require-kiosk-or-permission.js'
import { createRequireAnyPermission, createRequirePermission } from '../middleware/require-permission.js'
import {
  boardKioskAdminSchema,
  boardKioskRotateResponseSchema,
  boardKioskStatusSchema,
  patchBoardKioskBodySchema,
} from '../schemas/board-kiosk.js'
import {
  clearBoardKioskToken,
  getBoardKioskAdmin,
  getBoardKioskStatus,
  rotateBoardKioskToken,
  setBoardKioskEnabled,
} from '../services/board-kiosk.js'
import { getPersonnelImage } from '../services/personnel-admin.js'
import { isSettingTableMissing } from '../services/setting-store.js'

function isPersonnelImageSchemaMissing(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : ''
  return (
    msg.includes('does not exist') ||
    msg.includes('undefined table') ||
    msg.includes('imgmember_data') ||
    msg.includes('tbworkcenter') ||
    msg.includes('relation')
  )
}

const SCHEMA_HINT = 'รัน migration 082_board_kiosk_settings.sql'

function actorId(req: Request): string {
  const u = req.authUser
  if (!u) return 'unknown'
  return (u.username ?? u.idwkctr ?? u.fullnameTh ?? 'unknown').trim() || 'unknown'
}

export function registerBoardKioskRoutes(app: Express, pool: Pool, sessionSecret: string) {
  const requireBoardRead = createRequireKioskOrPermission(pool, sessionSecret, 'dashboard.read')

  /** รูปประจำตัวช่างบน `/board` — session+cookie หรือ `?kiosk_token=` (ไม่ใช้ Bearer ใน `<img>`) */
  app.get(
    '/api/v1/board/personnel/:idwkctr/avatar',
    ...requireBoardRead,
    async (req: Request, res: Response) => {
      try {
        const out = await getPersonnelImage(pool, req.params.idwkctr)
        if (!out) {
          res.status(404).end()
          return
        }
        res.setHeader('Content-Type', out.mime)
        res.setHeader('Content-Length', String(out.bytes))
        res.setHeader('Cache-Control', 'private, max-age=120')
        res.status(200).send(out.data)
      } catch (err) {
        if (isPersonnelImageSchemaMissing(err)) {
          res.status(503).json({
            error: 'SCHEMA_NOT_READY',
            message: 'รัน migration tbworkcenter (imgmember) ก่อนเปิดรูปช่างบน board',
          })
          return
        }
        throw err
      }
    },
  )

  const requireAdminRead = createRequireAnyPermission(pool, sessionSecret)([
    'admin.settings.read',
    'admin.settings.write',
  ])
  const requireAdminWrite = createRequirePermission(pool, sessionSecret)('admin.settings.write')

  app.get('/api/v1/board/kiosk-status', async (_req: Request, res: Response) => {
    try {
      const status = await getBoardKioskStatus(pool)
      res.json(boardKioskStatusSchema.parse(status))
    } catch (err) {
      if (isSettingTableMissing(err)) {
        res.json(boardKioskStatusSchema.parse({ enabled: true, tokenRequired: false }))
        return
      }
      throw err
    }
  })

  app.get('/api/v1/admin/board-kiosk', ...requireAdminRead, async (_req: Request, res: Response) => {
    try {
      const data = await getBoardKioskAdmin(pool)
      res.json(boardKioskAdminSchema.parse(data))
    } catch (err) {
      if (isSettingTableMissing(err)) {
        res.status(503).json({ error: 'SCHEMA_NOT_READY', message: SCHEMA_HINT })
        return
      }
      throw err
    }
  })

  app.patch('/api/v1/admin/board-kiosk', ...requireAdminWrite, async (req: Request, res: Response) => {
    try {
      const body = patchBoardKioskBodySchema.parse(req.body)
      const data = await setBoardKioskEnabled(pool, body.enabled, actorId(req))
      res.json(boardKioskAdminSchema.parse(data))
    } catch (err) {
      if (isSettingTableMissing(err)) {
        res.status(503).json({ error: 'SCHEMA_NOT_READY', message: SCHEMA_HINT })
        return
      }
      throw err
    }
  })

  app.post(
    '/api/v1/admin/board-kiosk/rotate-token',
    ...requireAdminWrite,
    async (req: Request, res: Response) => {
      try {
        const out = await rotateBoardKioskToken(pool, actorId(req))
        res.json(
          boardKioskRotateResponseSchema.parse({
            ...out,
            boardPath: '/board',
          }),
        )
      } catch (err) {
        if (isSettingTableMissing(err)) {
          res.status(503).json({ error: 'SCHEMA_NOT_READY', message: SCHEMA_HINT })
          return
        }
        throw err
      }
    },
  )

  app.delete('/api/v1/admin/board-kiosk/token', ...requireAdminWrite, async (req: Request, res: Response) => {
    try {
      const data = await clearBoardKioskToken(pool, actorId(req))
      res.json(boardKioskAdminSchema.parse(data))
    } catch (err) {
      if (isSettingTableMissing(err)) {
        res.status(503).json({ error: 'SCHEMA_NOT_READY', message: SCHEMA_HINT })
        return
      }
      throw err
    }
  })
}
