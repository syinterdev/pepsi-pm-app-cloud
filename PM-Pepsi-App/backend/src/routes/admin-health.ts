import type { Express, Request, Response } from 'express'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Pool } from 'pg'
import { getSlowApiMetrics } from '../lib/api-metrics.js'
import { auditLogFromRequest } from '../lib/audit-log.js'
import { createRequirePermission } from '../middleware/require-permission.js'
import {
  adminHealthResponseSchema,
  healthErrorLogResponseSchema,
  healthMigrateResultSchema,
  healthSlowApiResponseSchema,
} from '../schemas/admin-health.js'
import { HealthMigrateError, runPendingMigrations } from '../services/admin-health-migrate.js'
import {
  getAdminHealth,
  getDiskHealth,
  getMigrationHealth,
  getPoolStats,
  listHealthErrorLogs,
  pingDatabase,
} from '../services/admin-health.js'

function readApiVersion(): string {
  try {
    const here = path.dirname(fileURLToPath(import.meta.url))
    const pkgPath = path.resolve(here, '../../package.json')
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as { version?: string }
    return pkg.version ?? '0.0.0'
  } catch {
    return '0.0.0'
  }
}

const API_VERSION = readApiVersion()

export function registerAdminHealthRoutes(
  app: Express,
  pool: Pool,
  sessionSecret: string,
  databaseUrl: string,
) {
  const requireRead = createRequirePermission(pool, sessionSecret)('admin.health.read')
  const requireMigrate = createRequirePermission(pool, sessionSecret)('admin.health.migrate')

  app.get('/api/v1/admin/health', ...requireRead, async (req: Request, res: Response) => {
    const diskPath = typeof req.query.diskPath === 'string' ? req.query.diskPath : undefined
    const data = await getAdminHealth(pool, { diskPath, version: API_VERSION })
    res.json(adminHealthResponseSchema.parse(data))
  })

  app.get('/api/v1/admin/health/disk', ...requireRead, async (req: Request, res: Response) => {
    const diskPath = typeof req.query.path === 'string' ? req.query.path : undefined
    res.json(getDiskHealth(diskPath))
  })

  app.get('/api/v1/admin/health/migration', ...requireRead, async (_req: Request, res: Response) => {
    const migration = await getMigrationHealth(pool)
    res.json(migration)
  })

  app.get('/api/v1/admin/health/db', ...requireRead, async (_req: Request, res: Response) => {
    const ping = await pingDatabase(pool)
    res.json({
      ...ping,
      pool: getPoolStats(pool),
      time: new Date().toISOString(),
    })
  })

  app.get('/api/v1/admin/health/errors', ...requireRead, async (req: Request, res: Response) => {
    const limitRaw = Number(req.query.limit ?? 100)
    const limit = Number.isFinite(limitRaw) ? Math.min(200, Math.max(1, limitRaw)) : 100
    const items = await listHealthErrorLogs(pool, limit)
    res.json(healthErrorLogResponseSchema.parse({ items }))
  })

  app.get('/api/v1/admin/health/slow-apis', ...requireRead, async (req: Request, res: Response) => {
    const thresholdRaw = Number(req.query.thresholdMs ?? 1000)
    const thresholdMs = Number.isFinite(thresholdRaw)
      ? Math.min(60_000, Math.max(100, thresholdRaw))
      : 1000
    const limitRaw = Number(req.query.limit ?? 20)
    const limit = Number.isFinite(limitRaw) ? Math.min(50, Math.max(1, limitRaw)) : 20
    const items = getSlowApiMetrics({ p95ThresholdMs: thresholdMs, limit })
    res.json(healthSlowApiResponseSchema.parse({ thresholdMs, items }))
  })

  app.post('/api/v1/admin/health/migrate', ...requireMigrate, async (req: Request, res: Response) => {
    try {
      const result = await runPendingMigrations(pool, databaseUrl)
      void auditLogFromRequest(pool, req, {
        action: 'health.migrate',
        resource: 'migration',
        status: result.stoppedAt ? 'error' : 'ok',
        message: result.stoppedAt?.message ?? `applied ${result.applied.length}`,
        after: { applied: result.applied.map((a) => a.file), pendingRemaining: result.pendingRemaining },
      })
      res.json(healthMigrateResultSchema.parse(result))
    } catch (err) {
      if (err instanceof HealthMigrateError) {
        const status =
          err.code === 'MAINTENANCE_REQUIRED'
            ? 409
            : err.code === 'PSQL_UNAVAILABLE'
              ? 503
              : 400
        res.status(status).json({ error: err.code, message: err.message })
        return
      }
      throw err
    }
  })
}
