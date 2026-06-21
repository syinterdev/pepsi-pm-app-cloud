import type { Pool } from 'pg'
import type { AuditLogItem } from '../schemas/admin-audit.js'
import { isAuditTableMissing } from '../lib/audit-log.js'

export { isAuditTableMissing as isSecurityAuditMissing }

type AuditRow = Record<string, unknown>

function mapRow(row: AuditRow): AuditLogItem {
  return {
    id: Number(row.id),
    actorId: row.actor_id != null ? String(row.actor_id) : null,
    actorRole: row.actor_role != null ? String(row.actor_role) : null,
    action: String(row.action),
    resource: row.resource != null ? String(row.resource) : null,
    resourceId: row.resource_id != null ? String(row.resource_id) : null,
    before: row.before_json ?? null,
    after: row.after_json ?? null,
    ip: row.ip != null ? String(row.ip) : null,
    userAgent: row.user_agent != null ? String(row.user_agent) : null,
    status: row.status as AuditLogItem['status'],
    message: row.message != null ? String(row.message) : null,
    createdAt: new Date(String(row.created_at)).toISOString(),
  }
}

export async function getFailedLoginByDay(
  pool: Pool,
  days: number,
): Promise<{ series: { date: string; count: number }[]; total: number }> {
  const { rows } = await pool.query<{ day: Date; count: string }>(
    `SELECT date_trunc('day', created_at AT TIME ZONE 'Asia/Bangkok')::date AS day,
            COUNT(*)::int AS count
     FROM app.tbl_audit_log
     WHERE action = 'auth.login'
       AND status = 'denied'
       AND created_at >= now() - ($1::int || ' days')::interval
     GROUP BY 1
     ORDER BY 1`,
    [days],
  )

  const byDay = new Map<string, number>()
  for (const row of rows) {
    const key = new Date(row.day).toISOString().slice(0, 10)
    byDay.set(key, Number(row.count))
  }

  const series: { date: string; count: number }[] = []
  const end = new Date()
  end.setHours(0, 0, 0, 0)
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(end)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    series.push({ date: key, count: byDay.get(key) ?? 0 })
  }

  const total = series.reduce((sum, p) => sum + p.count, 0)
  return { series, total }
}

export async function listRbacDenials(
  pool: Pool,
  limit: number,
  offset: number,
): Promise<{ items: AuditLogItem[]; total: number }> {
  const where = `WHERE status = 'denied' AND action = 'rbac.deny'`

  const [countRes, listRes] = await Promise.all([
    pool.query<{ total: number }>(
      `SELECT COUNT(*)::int AS total FROM app.tbl_audit_log ${where}`,
    ),
    pool.query(
      `SELECT id, actor_id, actor_role, action, resource, resource_id,
              before_json, after_json, host(ip) AS ip, user_agent, status, message, created_at
       FROM app.tbl_audit_log
       ${where}
       ORDER BY created_at DESC, id DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset],
    ),
  ])

  return {
    items: listRes.rows.map((r) => mapRow(r as AuditRow)),
    total: countRes.rows[0]?.total ?? 0,
  }
}

export async function listRateLimitedIps(
  pool: Pool,
  days: number,
): Promise<{ ip: string; hits: number; lastAt: string }[]> {
  const { rows } = await pool.query<{ ip: string; hits: string; last_at: Date }>(
    `SELECT host(ip) AS ip,
            COUNT(*)::int AS hits,
            MAX(created_at) AS last_at
     FROM app.tbl_audit_log
     WHERE action = 'security.rate_limit'
       AND ip IS NOT NULL
       AND created_at >= now() - ($1::int || ' days')::interval
     GROUP BY host(ip)
     ORDER BY hits DESC, last_at DESC
     LIMIT 30`,
    [days],
  )

  return rows.map((r) => ({
    ip: r.ip,
    hits: Number(r.hits),
    lastAt: r.last_at.toISOString(),
  }))
}

/** IP ที่ถูก deny บ่อย (rbac + login + rate limit รวม) */
export async function listSuspiciousIps(
  pool: Pool,
  days: number,
): Promise<{ ip: string; hits: number; lastAt: string }[]> {
  const { rows } = await pool.query<{ ip: string; hits: string; last_at: Date }>(
    `SELECT host(ip) AS ip,
            COUNT(*)::int AS hits,
            MAX(created_at) AS last_at
     FROM app.tbl_audit_log
     WHERE status = 'denied'
       AND ip IS NOT NULL
       AND created_at >= now() - ($1::int || ' days')::interval
     GROUP BY host(ip)
     HAVING COUNT(*) >= 3
     ORDER BY hits DESC, last_at DESC
     LIMIT 30`,
    [days],
  )

  return rows.map((r) => ({
    ip: r.ip,
    hits: Number(r.hits),
    lastAt: r.last_at.toISOString(),
  }))
}

export async function countRateLimitHits(pool: Pool, days: number): Promise<number> {
  const { rows } = await pool.query<{ total: number }>(
    `SELECT COUNT(*)::int AS total
     FROM app.tbl_audit_log
     WHERE action = 'security.rate_limit'
       AND created_at >= now() - ($1::int || ' days')::interval`,
    [days],
  )
  return rows[0]?.total ?? 0
}
