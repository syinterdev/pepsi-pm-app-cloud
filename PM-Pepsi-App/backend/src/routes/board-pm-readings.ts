import type { Express, Request, Response } from 'express'
import type { Pool } from 'pg'
import { createRequireKioskOrPermission } from '../middleware/require-kiosk-or-permission.js'
import { createRequirePermission } from '../middleware/require-permission.js'
import {
  boardPmReadingsQuerySchema,
  boardPmReadingsResponseSchema,
  pmReadingsExportQuerySchema,
} from '../schemas/board-pm-readings.js'
import {
  buildPmReadingsXlsxBuffer,
  getBoardPmReadings,
  listPmReadingExportRows,
} from '../services/pm-readings-query.js'

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

export function registerBoardPmReadingsRoutes(
  app: Express,
  pool: Pool,
  sessionSecret: string,
) {
  const requireBoardRead = createRequireKioskOrPermission(pool, sessionSecret, 'dashboard.read')
  const perm = createRequirePermission(pool, sessionSecret)
  const requirePmExportRead = perm('confirmation.read')

  app.get(
    '/api/v1/board/pm-readings',
    ...requireBoardRead,
    async (req: Request, res: Response) => {
      try {
        const q = boardPmReadingsQuerySchema.parse(req.query)
        const data = await getBoardPmReadings(pool, {
          period: q.period,
          limit: q.limit,
          team: q.team,
        })
        res.json(boardPmReadingsResponseSchema.parse(data))
      } catch (err) {
        if (isSchemaMissing(err)) {
          res.status(503).json({ error: 'SCHEMA_NOT_READY', message: SCHEMA_HINT })
          return
        }
        throw err
      }
    },
  )

  app.get(
    '/api/v1/pm-readings/export.xlsx',
    ...requirePmExportRead,
    async (req: Request, res: Response) => {
      const parsed = pmReadingsExportQuerySchema.safeParse(req.query)
      if (!parsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR', message: 'ต้องระบุ from และ to (YYYY-MM-DD)' })
        return
      }
      try {
        const rows = await listPmReadingExportRows(pool, {
          from: parsed.data.from,
          to: parsed.data.to,
          team: parsed.data.team,
        })
        const buf = buildPmReadingsXlsxBuffer(rows)
        const fname = `PM_Readings_${parsed.data.from}_${parsed.data.to}.xlsx`
        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        )
        res.setHeader('Content-Disposition', `attachment; filename="${fname}"`)
        res.status(200).send(buf)
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
