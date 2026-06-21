import type { Express, Request, Response } from 'express'
import type { Pool } from 'pg'
import { createRequireKioskOrPermission } from '../middleware/require-kiosk-or-permission.js'
import {
  boardActivityQuerySchema,
  boardActivityResponseSchema,
} from '../schemas/board-activity.js'
import { getBoardActivity } from '../services/board-activity.js'

function isSchemaMissing(err: unknown): boolean {
  const message = err instanceof Error ? err.message : ''
  return (
    message.includes('does not exist') ||
    message.includes('undefined table') ||
    message.includes('relation')
  )
}

const SCHEMA_HINT =
  'Run migrations 007 (tbplangingwork/view_planwork), 026 (tbcofirm), 080 (confirm_qc_status)'

export function registerBoardActivityRoutes(app: Express, pool: Pool, sessionSecret: string) {
  const requireBoardRead = createRequireKioskOrPermission(pool, sessionSecret, 'dashboard.read')

  app.get(
    '/api/v1/board/activity',
    ...requireBoardRead,
    async (req: Request, res: Response) => {
      try {
        const q = boardActivityQuerySchema.parse(req.query)
        const data = await getBoardActivity(pool, {
          period: q.period,
          limit: q.limit,
          team: q.team,
        })
        res.json(boardActivityResponseSchema.parse(data))
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
