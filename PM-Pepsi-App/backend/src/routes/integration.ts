import type { Express, Request, Response } from 'express'
import type { Pool } from 'pg'
import { voidAudit } from '../lib/audit-mutation.js'
import { hasPermission } from '../lib/has-permission.js'
import { createRequireAnyPermission } from '../middleware/require-permission.js'
import {
  integrationJobsResponseSchema,
  integrationRunResponseSchema,
  integrationStatusResponseSchema,
} from '../schemas/integration.js'
import {
  isIntegrationTableMissing,
  listIntegrationJobs,
} from '../services/integration-job.js'
import {
  getIntegrationStatus,
  runInboundIntegrationScan,
  type InboundIntegrationSummary,
} from '../services/integration-watch.js'

function schemaMessage(): string {
  return 'Run migrations 075_integration_job.sql and 076_integration_confirm_in.sql'
}

export function registerIntegrationRoutes(
  app: Express,
  pool: Pool,
  sessionSecret: string,
) {
  const requireIntegrationRead = createRequireAnyPermission(pool, sessionSecret)([
    'integration.admin',
    'iw37n.read',
  ])
  const requireIntegrationRun = createRequireAnyPermission(pool, sessionSecret)([
    'integration.admin',
    'iw37n.import',
    'confirmation.import',
  ])

  app.get(
    '/api/v1/integration/status',
    ...requireIntegrationRead,
    async (_req: Request, res: Response) => {
      try {
        const status = await getIntegrationStatus(pool)
        res.json(integrationStatusResponseSchema.parse(status))
      } catch (err) {
        if (isIntegrationTableMissing(err)) {
          res.status(503).json({ error: 'SCHEMA_NOT_READY', message: schemaMessage() })
          return
        }
        throw err
      }
    },
  )

  app.get(
    '/api/v1/integration/jobs',
    ...requireIntegrationRead,
    async (req: Request, res: Response) => {
      const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50))
      try {
        const items = await listIntegrationJobs(pool, limit)
        res.json(integrationJobsResponseSchema.parse({ items }))
      } catch (err) {
        if (isIntegrationTableMissing(err)) {
          res.status(503).json({ error: 'SCHEMA_NOT_READY', message: schemaMessage() })
          return
        }
        throw err
      }
    },
  )

  app.post(
    '/api/v1/integration/jobs/run',
    ...requireIntegrationRun,
    async (req: Request, res: Response) => {
      const user = req.authUser
      if (!user) {
        res.status(401).json({ error: 'UNAUTHORIZED', message: 'ต้องเข้าสู่ระบบ' })
        return
      }
      try {
        const role = user.userst
        const scanIw37n =
          (await hasPermission(pool, role, 'integration.admin')) ||
          (await hasPermission(pool, role, 'iw37n.import'))
        const scanConfirm =
          (await hasPermission(pool, role, 'integration.admin')) ||
          (await hasPermission(pool, role, 'confirmation.import'))

        if (!scanIw37n && !scanConfirm) {
          res.status(403).json({
            error: 'FORBIDDEN',
            message: 'ต้องมีสิทธิ์ iw37n.import หรือ confirmation.import',
          })
          return
        }

        const job = await runInboundIntegrationScan(pool, {
          trigger: 'manual',
          startedBy: user.username,
          scanIw37n,
          scanConfirm,
        })

        const summary = job.summary as InboundIntegrationSummary
        if (summary.iw37n?.filesFound) {
          voidAudit(pool, req, {
            action: 'integration.iw37n.in',
            resource: 'integration_job',
            resourceId: job.id,
            after: { iw37n: summary.iw37n, jobStatus: job.status },
          })
        }
        if (summary.confirm?.filesFound) {
          voidAudit(pool, req, {
            action: 'integration.confirm.in',
            resource: 'integration_job',
            resourceId: job.id,
            after: { confirm: summary.confirm, jobStatus: job.status },
          })
        }

        res.json(integrationRunResponseSchema.parse({ job }))
      } catch (err) {
        if (isIntegrationTableMissing(err)) {
          res.status(503).json({ error: 'SCHEMA_NOT_READY', message: schemaMessage() })
          return
        }
        if (err instanceof Error && err.message === 'INTEGRATION_JOB_ALREADY_RUNNING') {
          res.status(409).json({
            error: 'JOB_ALREADY_RUNNING',
            message: 'มี job สแกนโฟลเดอร์กำลังรันอยู่',
          })
          return
        }
        throw err
      }
    },
  )
}
