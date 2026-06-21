import type { Pool } from 'pg'
import type { AuditListQuery, AuditLogItem } from '../schemas/admin-audit.js'
import {
  auditRetentionCutoffDate,
  getAuditRetentionDays,
} from '../lib/audit-retention.js'
import { isAuditTableMissing } from '../lib/audit-log.js'

export { isAuditTableMissing }

type SqlParts = { where: string; params: unknown[] }

function buildAuditWhere(filters: AuditListQuery): SqlParts {
  const clauses: string[] = []
  const params: unknown[] = []

  const push = (sql: string, value: unknown) => {
    params.push(value)
    clauses.push(sql.replace('?', `$${params.length}`))
  }

  if (filters.from) push('created_at >= ?::timestamptz', filters.from)
  if (filters.to) push('created_at <= ?::timestamptz', filters.to)
  if (filters.actorId) push('actor_id ILIKE ?', `%${filters.actorId}%`)
  if (filters.resource) push('resource ILIKE ?', `%${filters.resource}%`)
  if (filters.status && filters.status !== 'all') push('status = ?', filters.status)

  if (filters.action?.length) {
    push('action = ANY(?::text[])', filters.action)
  }

  if (filters.actionPrefix?.length) {
    const prefixClauses = filters.actionPrefix.map((p) => {
      params.push(`${p}%`)
      return `action LIKE $${params.length}`
    })
    clauses.push(`(${prefixClauses.join(' OR ')})`)
  }

  if (filters.q) {
    const like = `%${filters.q}%`
    params.push(like)
    const i = params.length
    clauses.push(
      `(action ILIKE $${i} OR COALESCE(resource, '') ILIKE $${i} OR COALESCE(resource_id, '') ILIKE $${i} OR COALESCE(message, '') ILIKE $${i})`,
    )
  }

  return {
    where: clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '',
    params,
  }
}

function mapRow(row: Record<string, unknown>): AuditLogItem {
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

export async function listAuditLogs(
  pool: Pool,
  filters: AuditListQuery,
): Promise<{ items: AuditLogItem[]; total: number }> {
  const { where, params } = buildAuditWhere(filters)
  const limit = filters.limit
  const offset = filters.offset

  const countSql = `SELECT COUNT(*)::int AS total FROM app.tbl_audit_log ${where}`
  const listSql = `
    SELECT id, actor_id, actor_role, action, resource, resource_id,
           before_json, after_json, host(ip) AS ip, user_agent, status, message, created_at
    FROM app.tbl_audit_log
    ${where}
    ORDER BY created_at DESC, id DESC
    LIMIT $${params.length + 1} OFFSET $${params.length + 2}`

  const [countRes, listRes] = await Promise.all([
    pool.query<{ total: number }>(countSql, params),
    pool.query(listSql, [...params, limit, offset]),
  ])

  return {
    items: listRes.rows.map((r) => mapRow(r as Record<string, unknown>)),
    total: countRes.rows[0]?.total ?? 0,
  }
}

export async function getAuditMeta(pool: Pool): Promise<{
  actions: string[]
  actors: { actorId: string; count: number }[]
  retentionDays: number
  retentionCutoffDate: string
}> {
  const retentionDays = await getAuditRetentionDays(pool)
  const retentionCutoffDate = auditRetentionCutoffDate(retentionDays)

  const [actionsRes, actorsRes] = await Promise.all([
    pool.query<{ action: string }>(
      `SELECT DISTINCT action FROM app.tbl_audit_log ORDER BY action LIMIT 500`,
    ),
    pool.query<{ actor_id: string; count: string }>(
      `SELECT actor_id, COUNT(*)::int AS count
       FROM app.tbl_audit_log
       WHERE actor_id IS NOT NULL AND actor_id <> ''
       GROUP BY actor_id
       ORDER BY count DESC, actor_id
       LIMIT 100`,
    ),
  ])
  return {
    actions: actionsRes.rows.map((r) => r.action),
    actors: actorsRes.rows.map((r) => ({
      actorId: r.actor_id,
      count: Number(r.count),
    })),
    retentionDays,
    retentionCutoffDate,
  }
}

export async function searchAuditActors(
  pool: Pool,
  q: string,
  limit = 20,
): Promise<string[]> {
  const like = `%${q.trim()}%`
  const { rows } = await pool.query<{ actor_id: string }>(
    `SELECT DISTINCT actor_id
     FROM app.tbl_audit_log
     WHERE actor_id ILIKE $1
     ORDER BY actor_id
     LIMIT $2`,
    [like, limit],
  )
  return rows.map((r) => r.actor_id)
}

export async function deleteAuditOlderThan(
  pool: Pool,
  olderThan: string,
): Promise<number> {
  const { rowCount } = await pool.query(
    `DELETE FROM app.tbl_audit_log WHERE created_at < $1::date`,
    [olderThan],
  )
  return rowCount ?? 0
}

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

function jsonCell(v: unknown): string {
  if (v === null || v === undefined) return ''
  try {
    return JSON.stringify(v)
  } catch {
    return String(v)
  }
}

export function auditLogsToCsv(items: AuditLogItem[]): string {
  const header = [
    'id',
    'created_at',
    'actor_id',
    'actor_role',
    'action',
    'resource',
    'resource_id',
    'status',
    'ip',
    'message',
    'before_json',
    'after_json',
  ]
  const lines = [header.join(',')]
  for (const row of items) {
    lines.push(
      [
        String(row.id),
        row.createdAt,
        row.actorId ?? '',
        row.actorRole ?? '',
        row.action,
        row.resource ?? '',
        row.resourceId ?? '',
        row.status,
        row.ip ?? '',
        row.message ?? '',
        jsonCell(row.before),
        jsonCell(row.after),
      ]
        .map((c) => csvEscape(c))
        .join(','),
    )
  }
  return lines.join('\n')
}

/** Export up to 50k rows matching filters (for CSV download). */
export async function exportAuditLogsCsv(pool: Pool, filters: AuditListQuery): Promise<string> {
  const capped: AuditListQuery = { ...filters, limit: 50_000, offset: 0 }
  const { items } = await listAuditLogs(pool, capped)
  return auditLogsToCsv(items)
}

/** Default filter window: last 24 hours (ISO strings). */
export function defaultAuditFromTo(): { from: string; to: string } {
  const to = new Date()
  const from = new Date(to.getTime() - 24 * 60 * 60 * 1000)
  return { from: from.toISOString(), to: to.toISOString() }
}
