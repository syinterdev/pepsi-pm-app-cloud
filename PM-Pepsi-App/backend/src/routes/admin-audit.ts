import type { Express, Request, Response } from 'express'
import type { Pool } from 'pg'
import { voidAudit } from '../lib/audit-mutation.js'
import { createRequireAnyPermission, createRequirePermission } from '../middleware/require-permission.js'
import {
  auditDeleteQuerySchema,
  auditDeleteResponseSchema,
  auditListQuerySchema,
  auditListResponseSchema,
  auditMetaResponseSchema,
} from '../schemas/admin-audit.js'
import { auditRetentionCutoffDate, getAuditRetentionDays } from '../lib/audit-retention.js'
import {
  defaultAuditFromTo,
  deleteAuditOlderThan,
  exportAuditLogsCsv,
  getAuditMeta,
  isAuditTableMissing,
  listAuditLogs,
  searchAuditActors,
} from '../services/admin-audit.js'

const SCHEMA_HINT = 'รัน migration 050_tbl_audit_log.sql ก่อนใช้งาน Audit Log'

function parseListQuery(req: Request) {
  const raw = { ...req.query }
  if (!raw.from && !raw.to) {
    const defaults = defaultAuditFromTo()
    raw.from = defaults.from
    raw.to = defaults.to
  }
  return auditListQuerySchema.safeParse(raw)
}

export function registerAdminAuditRoutes(app: Express, pool: Pool, sessionSecret: string) {
  const requireRead = createRequireAnyPermission(pool, sessionSecret)([
    'admin.audit.read',
  ])
  const requireDelete = createRequirePermission(pool, sessionSecret)('admin.audit.delete')

  app.get('/api/v1/admin/audit', ...requireRead, async (req: Request, res: Response) => {
    const parsed = parseListQuery(req)
    if (!parsed.success) {
      res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Invalid audit query',
        issues: parsed.error.issues,
      })
      return
    }
    try {
      const { items, total } = await listAuditLogs(pool, parsed.data)
      res.json(
        auditListResponseSchema.parse({
          items,
          total,
          limit: parsed.data.limit,
          offset: parsed.data.offset,
        }),
      )
    } catch (err) {
      if (isAuditTableMissing(err)) {
        res.status(503).json({ error: 'SCHEMA_NOT_READY', message: SCHEMA_HINT })
        return
      }
      throw err
    }
  })

  app.get('/api/v1/admin/audit/meta', ...requireRead, async (_req: Request, res: Response) => {
    try {
      const data = await getAuditMeta(pool)
      res.json(auditMetaResponseSchema.parse(data))
    } catch (err) {
      if (isAuditTableMissing(err)) {
        res.status(503).json({ error: 'SCHEMA_NOT_READY', message: SCHEMA_HINT })
        return
      }
      throw err
    }
  })

  app.get('/api/v1/admin/audit/actors', ...requireRead, async (req: Request, res: Response) => {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : ''
    if (q.length < 1) {
      res.json({ items: [] })
      return
    }
    try {
      const items = await searchAuditActors(pool, q)
      res.json({ items })
    } catch (err) {
      if (isAuditTableMissing(err)) {
        res.status(503).json({ error: 'SCHEMA_NOT_READY', message: SCHEMA_HINT })
        return
      }
      throw err
    }
  })

  app.get('/api/v1/admin/audit/export', ...requireRead, async (req: Request, res: Response) => {
    const parsed = parseListQuery(req)
    if (!parsed.success) {
      res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Invalid audit export query',
        issues: parsed.error.issues,
      })
      return
    }
    try {
      const csv = await exportAuditLogsCsv(pool, parsed.data)
      const stamp = new Date().toISOString().slice(0, 10)
      res.setHeader('Content-Type', 'text/csv; charset=utf-8')
      res.setHeader('Content-Disposition', `attachment; filename="audit-log-${stamp}.csv"`)
      res.send(`\uFEFF${csv}`)
    } catch (err) {
      if (isAuditTableMissing(err)) {
        res.status(503).json({ error: 'SCHEMA_NOT_READY', message: SCHEMA_HINT })
        return
      }
      throw err
    }
  })

  app.delete('/api/v1/admin/audit', ...requireDelete, async (req: Request, res: Response) => {
    const parsed = auditDeleteQuerySchema.safeParse(req.query)
    if (!parsed.success) {
      res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'olderThan=YYYY-MM-DD is required',
        issues: parsed.error.issues,
      })
      return
    }
    try {
      const retentionDays = await getAuditRetentionDays(pool)
      const cutoff = auditRetentionCutoffDate(retentionDays)
      if (parsed.data.olderThan > cutoff) {
        res.status(400).json({
          error: 'RETENTION_POLICY',
          message: `ลบได้เฉพาะรายการก่อน ${cutoff} (เก็บ ${retentionDays} วัน)`,
          retentionDays,
          retentionCutoffDate: cutoff,
        })
        return
      }
      const deleted = await deleteAuditOlderThan(pool, parsed.data.olderThan)
      voidAudit(pool, req, {
        action: 'admin.audit.cleanup',
        resource: 'tbl_audit_log',
        message: `olderThan=${parsed.data.olderThan}`,
        after: { deleted },
      })
      res.json(auditDeleteResponseSchema.parse({ ok: true, deleted }))
    } catch (err) {
      if (isAuditTableMissing(err)) {
        res.status(503).json({ error: 'SCHEMA_NOT_READY', message: SCHEMA_HINT })
        return
      }
      throw err
    }
  })
}
