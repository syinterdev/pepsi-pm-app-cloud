import type { Pool } from 'pg'
import {
  activityActionLabel,
  extractJobDetailFromPayload,
  extractLineFromPayload,
  extractResourceFromPayload,
  extractTimeRangeFromPayload,
  extractWorkOrderFromPayload,
  formatActivityResourceLabel,
} from '../lib/activity-log-enrich.js'
import { isAuditTableMissing } from '../lib/audit-log.js'
import type { ActivityLogListResponse } from '../schemas/activity-log.js'

export type ActivityLogQuery = {
  from?: string
  to?: string
  q?: string
  limit?: number
  offset?: number
}

type AuditRow = {
  id: string
  actor_id: string | null
  actor_role: string | null
  action: string
  resource: string | null
  resource_id: string | null
  before_json: unknown
  after_json: unknown
  status: string
  message: string | null
  created_at: Date
  actor_display_name: string | null
  actor_wkctr: string | null
  wkorder: string | null
  functionalloc: string | null
  operationshorttext: string | null
  wo_wkctr: string | null
}

function mapAuditRow(row: AuditRow) {
  const lineFromJson = extractLineFromPayload(row.before_json, row.after_json)
  const woFromJson = extractWorkOrderFromPayload(row.before_json, row.after_json)
  const productLine = lineFromJson ?? (row.functionalloc?.trim() || null)
  const workOrder = woFromJson ?? (row.wkorder?.trim() || null)
  const payloadResource = extractResourceFromPayload(row.before_json, row.after_json)
  const { startedAt, endedAt } = extractTimeRangeFromPayload(row.before_json, row.after_json)
  const jobDetail =
    row.operationshorttext?.trim() ||
    extractJobDetailFromPayload(row.before_json, row.after_json) ||
    null
  const resourceLabel = formatActivityResourceLabel(
    row.resource,
    row.resource_id,
    payloadResource,
    row.wo_wkctr,
  )

  return {
    id: `audit-${row.id}`,
    source: 'audit' as const,
    actorId: row.actor_id?.trim() || null,
    actorRole: row.actor_role?.trim() || null,
    actorDisplayName: row.actor_display_name?.trim() || row.actor_wkctr?.trim() || row.actor_id,
    productLine,
    workOrder,
    jobDetail,
    resourceLabel,
    startedAt,
    endedAt,
    action: row.action,
    actionLabel: activityActionLabel(row.action),
    resource: row.resource?.trim() || null,
    resourceId: row.resource_id?.trim() || null,
    status: row.status as 'ok' | 'denied' | 'error',
    message: row.message?.trim() || null,
    createdAt: row.created_at.toISOString(),
  }
}

type UserLogRow = {
  id: string
  username: string | null
  user_ip: string | null
  action: string
  created_at: Date
  display_name: string | null
  wkctr: string | null
}

function mapUserLogRow(row: UserLogRow) {
  const action = row.action === 'out' ? 'auth.logout' : 'auth.login'
  return {
    id: `userlog-${row.id}`,
    source: 'userlog' as const,
    actorId: row.username?.trim() || null,
    actorRole: null,
    actorDisplayName: row.display_name?.trim() || row.wkctr?.trim() || row.username,
    productLine: null,
    workOrder: null,
    jobDetail: null,
    resourceLabel: row.wkctr?.trim() || row.username?.trim() || null,
    startedAt: null,
    endedAt: null,
    action,
    actionLabel: activityActionLabel(action),
    resource: 'tbworkcenter_userlog',
    resourceId: row.username,
    status: 'ok' as const,
    message: row.user_ip ? `IP ${row.user_ip}` : null,
    createdAt: row.created_at.toISOString(),
  }
}

export async function listActivityLog(
  pool: Pool,
  query: ActivityLogQuery,
): Promise<ActivityLogListResponse> {
  const limit = Math.max(1, Math.min(query.limit ?? 100, 500))
  const offset = Math.max(0, query.offset ?? 0)
  const params: unknown[] = []
  const auditWhere: string[] = []
  const userWhere: string[] = ['1=1']

  if (query.from) {
    params.push(query.from)
    auditWhere.push(`a.created_at >= $${params.length}::timestamptz`)
    userWhere.push(`u.created_at >= $${params.length}::timestamptz`)
  }
  if (query.to) {
    params.push(query.to)
    auditWhere.push(`a.created_at <= $${params.length}::timestamptz`)
    userWhere.push(`u.created_at <= $${params.length}::timestamptz`)
  }
  if (query.q?.trim()) {
    params.push(`%${query.q.trim()}%`)
    const i = params.length
    auditWhere.push(
      `(a.action ILIKE $${i} OR COALESCE(a.resource,'') ILIKE $${i} OR COALESCE(a.resource_id,'') ILIKE $${i} OR COALESCE(a.message,'') ILIKE $${i} OR COALESCE(a.actor_id,'') ILIKE $${i} OR COALESCE(wc.wkctr,'') ILIKE $${i} OR COALESCE(i.wkorder,'') ILIKE $${i} OR COALESCE(i.functionalloc,'') ILIKE $${i} OR COALESCE(i.operationshorttext,'') ILIKE $${i} OR COALESCE(i.wkctr,'') ILIKE $${i})`,
    )
    userWhere.push(
      `(COALESCE(u.username,'') ILIKE $${i} OR COALESCE(wc2.wkctr,'') ILIKE $${i})`,
    )
  }

  const auditWhereSql = auditWhere.length ? `WHERE ${auditWhere.join(' AND ')}` : ''

  try {
    const auditSql = `
      SELECT
        a.id::text,
        a.actor_id,
        a.actor_role,
        a.action,
        a.resource,
        a.resource_id,
        a.before_json,
        a.after_json,
        a.status,
        a.message,
        a.created_at,
        NULLIF(TRIM(CONCAT(
          COALESCE(wc.titlewkctr,''),
          COALESCE(wc.namewkctr,''),
          ' ',
          COALESCE(wc.surnamewkctr,'')
        )), '') AS actor_display_name,
        wc.wkctr AS actor_wkctr,
        i.wkorder,
        i.functionalloc,
        i.operationshorttext,
        i.wkctr AS wo_wkctr
      FROM app.tbl_audit_log a
      LEFT JOIN app.tbworkcenter wc
        ON wc.idwkctr = a.actor_id OR wc.wkctr = a.actor_id
      LEFT JOIN app.tbiw37n i
        ON a.resource IN ('tbiw37n', 'tbcofirm', 'tbwrkclose', 'tbconfirm_comment', 'tbconfirm_image')
        AND a.resource_id ~ '^[0-9]+$'
        AND i.idiw37::text = a.resource_id
      ${auditWhereSql}
      ORDER BY a.created_at DESC
      LIMIT 2000`

    const userSql = `
      SELECT DISTINCT ON (u.id)
        u.id::text,
        u.username,
        u.user_ip,
        u.action,
        u.created_at,
        NULLIF(TRIM(CONCAT(
          COALESCE(wc2.titlewkctr,''),
          COALESCE(wc2.namewkctr,''),
          ' ',
          COALESCE(wc2.surnamewkctr,'')
        )), '') AS display_name,
        wc2.wkctr
      FROM app.tbworkcenter_userlog u
      LEFT JOIN app.tbworkcenter wc2 ON wc2.idwkctr = u.user_id OR wc2.wkctr = u.username
      WHERE ${userWhere.join(' AND ')}
      ORDER BY u.id, u.created_at DESC
      LIMIT 500`

    const [auditRes, userRes] = await Promise.all([
      pool.query<AuditRow>(auditSql, params),
      pool.query<UserLogRow>(userSql, params),
    ])

    const merged = [
      ...auditRes.rows.map(mapAuditRow),
      ...userRes.rows.map(mapUserLogRow),
    ].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))

    const total = merged.length
    const items = merged.slice(offset, offset + limit)

    return { items, total, limit, offset }
  } catch (err) {
    if (isAuditTableMissing(err)) {
      return { items: [], total: 0, limit, offset }
    }
    throw err
  }
}
