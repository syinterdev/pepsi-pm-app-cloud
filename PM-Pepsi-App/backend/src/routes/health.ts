import type { Express, Request, Response } from 'express'
import type { Pool } from 'pg'
import { readPackageVersion } from '../lib/read-package-version.js'

const API_VERSION = readPackageVersion('../package.json')
const WEB_VERSION = readPackageVersion('../../../frontend/package.json')

export function registerHealthRoutes(app: Express, pool: Pool) {
  app.get('/api/v1/health', async (_req: Request, res: Response) => {
    const time = new Date().toISOString()
    let db: 'ok' | 'error' = 'error'
    try {
      const r = await pool.query('SELECT 1 AS ok')
      if (r.rows[0]?.ok == 1) db = 'ok'
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[health] database ping failed:', err)
      }
      db = 'error'
    }
    res.json({
      ok: true,
      service: 'pm-api',
      time,
      db,
      apiVersion: API_VERSION,
      webVersion: WEB_VERSION,
    })
  })
}
