import type { Express, Request, Response } from 'express'
import type { Pool } from 'pg'
import { voidAudit } from '../lib/audit-mutation.js'
import { createRequirePermission } from '../middleware/require-permission.js'
import {
  blockedIpDeleteResponseSchema,
  blockedIpListResponseSchema,
  blockedIpItemSchema,
  createBlockedIpBodySchema,
  failedLoginResponseSchema,
  securityDaysQuerySchema,
  securityDeniedQuerySchema,
  securityDeniedResponseSchema,
  securityOverviewResponseSchema,
} from '../schemas/admin-security.js'
import {
  blockIp,
  isBlockedIpTableMissing,
  listBlockedIps,
  unblockIp,
} from '../services/blocked-ip.js'
import {
  getFailedLoginByDay,
  isSecurityAuditMissing,
  countRateLimitHits,
  listRateLimitedIps,
  listRbacDenials,
  listSuspiciousIps,
} from '../services/admin-security.js'

const SCHEMA_HINT = 'รัน migration 050_tbl_audit_log.sql และ 072_tbl_blocked_ip.sql'
const BLOCKED_SCHEMA_HINT = 'รัน migration 072_tbl_blocked_ip.sql ก่อน Block IP'

function actorId(req: Request): string {
  const u = req.authUser
  if (!u) return 'unknown'
  return (u.username ?? u.idwkctr ?? u.fullnameTh ?? 'unknown').trim() || 'unknown'
}

const RATE_LIMIT_NOTE =
  'express-rate-limit ที่ /api/v1/auth/* และ /api/v1/admin/* (ค่าเริ่มต้น 100 คำขอ/นาที/IP) — รายการ IP รวม rbac deny และ security.rate_limit (≥3 ครั้ง)'

export function registerAdminSecurityRoutes(app: Express, pool: Pool, sessionSecret: string) {
  const requireRead = createRequirePermission(pool, sessionSecret)('admin.security.read')
  const requireWrite = createRequirePermission(pool, sessionSecret)('admin.security.write')

  app.get('/api/v1/admin/security', ...requireRead, async (req: Request, res: Response) => {
    const daysParsed = securityDaysQuerySchema.safeParse(req.query)
    const deniedParsed = securityDeniedQuerySchema.safeParse(req.query)
    if (!daysParsed.success || !deniedParsed.success) {
      res.status(400).json({
        error: 'VALIDATION_ERROR',
        issues: [...(daysParsed.error?.issues ?? []), ...(deniedParsed.error?.issues ?? [])],
      })
      return
    }
    try {
      const days = daysParsed.data.days
      const windowDays = Math.min(days, 90)
      const [failedLogin, denied, rateLimitedIps, rateLimitHits, suspiciousIps, blockedRows] =
        await Promise.all([
          getFailedLoginByDay(pool, days),
          listRbacDenials(pool, deniedParsed.data.limit, deniedParsed.data.offset),
          listRateLimitedIps(pool, windowDays),
          countRateLimitHits(pool, windowDays),
          listSuspiciousIps(pool, Math.min(days, 14)),
          listBlockedIps(pool).catch((err) => {
            if (isBlockedIpTableMissing(err)) return []
            throw err
          }),
        ])
      res.json(
        securityOverviewResponseSchema.parse({
          failedLogin: failedLoginResponseSchema.parse({
            days,
            total: failedLogin.total,
            series: failedLogin.series,
          }),
          denied: securityDeniedResponseSchema.parse({
            ...denied,
            limit: deniedParsed.data.limit,
            offset: deniedParsed.data.offset,
          }),
          rateLimitedIps,
          rateLimitHits,
          suspiciousIps,
          blockedIps: blockedIpListResponseSchema.parse({ items: blockedRows }),
          rateLimitNote: RATE_LIMIT_NOTE,
        }),
      )
    } catch (err) {
      if (isSecurityAuditMissing(err)) {
        res.status(503).json({ error: 'SCHEMA_MISSING', message: SCHEMA_HINT })
        return
      }
      throw err
    }
  })

  app.get(
    '/api/v1/admin/security/failed-login',
    ...requireRead,
    async (req: Request, res: Response) => {
      const parsed = securityDaysQuerySchema.safeParse(req.query)
      if (!parsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR', issues: parsed.error.issues })
        return
      }
      try {
        const result = await getFailedLoginByDay(pool, parsed.data.days)
        res.json(
          failedLoginResponseSchema.parse({
            days: parsed.data.days,
            total: result.total,
            series: result.series,
          }),
        )
      } catch (err) {
        if (isSecurityAuditMissing(err)) {
          res.status(503).json({ error: 'SCHEMA_MISSING', message: SCHEMA_HINT })
          return
        }
        throw err
      }
    },
  )

  app.get('/api/v1/admin/security/denied', ...requireRead, async (req: Request, res: Response) => {
    const parsed = securityDeniedQuerySchema.safeParse(req.query)
    if (!parsed.success) {
      res.status(400).json({ error: 'VALIDATION_ERROR', issues: parsed.error.issues })
      return
    }
    try {
      const denied = await listRbacDenials(pool, parsed.data.limit, parsed.data.offset)
      res.json(
        securityDeniedResponseSchema.parse({
          ...denied,
          limit: parsed.data.limit,
          offset: parsed.data.offset,
        }),
      )
    } catch (err) {
      if (isSecurityAuditMissing(err)) {
        res.status(503).json({ error: 'SCHEMA_MISSING', message: SCHEMA_HINT })
        return
      }
      throw err
    }
  })

  app.get(
    '/api/v1/admin/security/blocked-ips',
    ...requireRead,
    async (_req: Request, res: Response) => {
      try {
        const items = await listBlockedIps(pool)
        res.json(blockedIpListResponseSchema.parse({ items }))
      } catch (err) {
        if (isBlockedIpTableMissing(err)) {
          res.status(503).json({ error: 'SCHEMA_MISSING', message: BLOCKED_SCHEMA_HINT })
          return
        }
        throw err
      }
    },
  )

  app.post(
    '/api/v1/admin/security/blocked-ips',
    ...requireWrite,
    async (req: Request, res: Response) => {
      const parsed = createBlockedIpBodySchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR', issues: parsed.error.issues })
        return
      }
      try {
        const item = await blockIp(pool, {
          ip: parsed.data.ip,
          reason: parsed.data.reason ?? null,
          expiresAt: parsed.data.expiresAt ?? null,
          blockedBy: actorId(req),
        })
        voidAudit(pool, req, {
          action: 'security.ip_block',
          resource: 'tbl_blocked_ip',
          resourceId: String(item.id),
          status: 'ok',
          after: item,
        })
        res.status(201).json(blockedIpItemSchema.parse(item))
      } catch (err) {
        if (err instanceof Error && err.message === 'INVALID_IP') {
          res.status(400).json({ error: 'INVALID_IP', message: 'รูปแบบ IP ไม่ถูกต้อง' })
          return
        }
        if (isBlockedIpTableMissing(err)) {
          res.status(503).json({ error: 'SCHEMA_MISSING', message: BLOCKED_SCHEMA_HINT })
          return
        }
        throw err
      }
    },
  )

  app.delete(
    '/api/v1/admin/security/blocked-ips/:id',
    ...requireWrite,
    async (req: Request, res: Response) => {
      const id = Number(req.params.id)
      if (!Number.isFinite(id)) {
        res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid id' })
        return
      }
      try {
        const ok = await unblockIp(pool, id)
        if (!ok) {
          res.status(404).json({ error: 'NOT_FOUND' })
          return
        }
        voidAudit(pool, req, {
          action: 'security.ip_unblock',
          resource: 'tbl_blocked_ip',
          resourceId: String(id),
          status: 'ok',
        })
        res.json(blockedIpDeleteResponseSchema.parse({ ok: true, id }))
      } catch (err) {
        if (isBlockedIpTableMissing(err)) {
          res.status(503).json({ error: 'SCHEMA_MISSING', message: BLOCKED_SCHEMA_HINT })
          return
        }
        throw err
      }
    },
  )
}
