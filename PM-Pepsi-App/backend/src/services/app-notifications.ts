import type { Pool } from 'pg'
import { hasPermission } from '../lib/has-permission.js'

export type AppNotificationRow = {
  id: number
  notify_kind: string
  audience: string
  recipient_wkctr: string | null
  idiw37: number | null
  title: string
  body: string | null
  link_route: string | null
  read_at: Date | null
  created_at: Date
}

export type AppNotificationItem = {
  id: number
  notifyKind: string
  title: string
  body: string | null
  linkRoute: string | null
  idiw37: number | null
  read: boolean
  createdAt: string
}

let tableAvailable: boolean | null = null

export async function hasAppNotificationTable(pool: Pool): Promise<boolean> {
  if (tableAvailable != null) return tableAvailable
  try {
    const r = await pool.query<{ reg: string | null }>(
      `SELECT to_regclass('app.tbl_app_notification')::text AS reg`,
    )
    tableAvailable = Boolean(r.rows[0]?.reg)
  } catch {
    tableAvailable = false
  }
  return tableAvailable
}

function mapRow(row: AppNotificationRow): AppNotificationItem {
  return {
    id: row.id,
    notifyKind: row.notify_kind,
    title: row.title,
    body: row.body,
    linkRoute: row.link_route,
    idiw37: row.idiw37,
    read: row.read_at != null,
    createdAt: row.created_at.toISOString(),
  }
}

export async function createAppNotification(
  pool: Pool,
  input: {
    notifyKind: string
    audience?: 'planner' | 'wkctr'
    recipientWkctr?: string | null
    idiw37?: number | null
    title: string
    body?: string | null
    linkRoute?: string | null
  },
): Promise<void> {
  if (!(await hasAppNotificationTable(pool))) return
  await pool.query(
    `INSERT INTO app.tbl_app_notification
       (notify_kind, audience, recipient_wkctr, idiw37, title, body, link_route)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      input.notifyKind,
      input.audience ?? 'planner',
      input.recipientWkctr?.trim() || null,
      input.idiw37 ?? null,
      input.title,
      input.body?.trim() || null,
      input.linkRoute?.trim() || null,
    ],
  )
}

async function userCanSeePlannerNotifications(
  pool: Pool,
  userst: string | null | undefined,
): Promise<boolean> {
  return hasPermission(pool, userst, 'confirmation.import')
}

export async function listAppNotificationsForUser(
  pool: Pool,
  wkctr: string,
  userst: string | null | undefined,
  limit = 30,
): Promise<{ items: AppNotificationItem[]; unreadCount: number }> {
  if (!(await hasAppNotificationTable(pool))) {
    return { items: [], unreadCount: 0 }
  }

  const w = wkctr.trim()
  const planner = await userCanSeePlannerNotifications(pool, userst)

  const { rows } = await pool.query<AppNotificationRow>(
    `SELECT id, notify_kind, audience, recipient_wkctr, idiw37, title, body, link_route, read_at, created_at
     FROM app.tbl_app_notification
     WHERE (
       (recipient_wkctr IS NOT NULL AND recipient_wkctr = $1)
       OR ($2::boolean AND audience = 'planner' AND recipient_wkctr IS NULL)
     )
     ORDER BY created_at DESC
     LIMIT $3`,
    [w, planner, limit],
  )

  const unreadR = await pool.query<{ n: string }>(
    `SELECT COUNT(*)::text AS n
     FROM app.tbl_app_notification
     WHERE read_at IS NULL
       AND (
         (recipient_wkctr IS NOT NULL AND recipient_wkctr = $1)
         OR ($2::boolean AND audience = 'planner' AND recipient_wkctr IS NULL)
       )`,
    [w, planner],
  )

  return {
    items: rows.map(mapRow),
    unreadCount: Number(unreadR.rows[0]?.n ?? 0),
  }
}

export async function markAppNotificationRead(
  pool: Pool,
  id: number,
  wkctr: string,
  userst: string | null | undefined,
): Promise<boolean> {
  if (!(await hasAppNotificationTable(pool))) return false
  const planner = await userCanSeePlannerNotifications(pool, userst)
  const r = await pool.query(
    `UPDATE app.tbl_app_notification
     SET read_at = COALESCE(read_at, now())
     WHERE id = $1
       AND read_at IS NULL
       AND (
         (recipient_wkctr IS NOT NULL AND recipient_wkctr = $2)
         OR ($3::boolean AND audience = 'planner' AND recipient_wkctr IS NULL)
       )`,
    [id, wkctr.trim(), planner],
  )
  return (r.rowCount ?? 0) > 0
}

export async function markAllAppNotificationsRead(
  pool: Pool,
  wkctr: string,
  userst: string | null | undefined,
): Promise<number> {
  if (!(await hasAppNotificationTable(pool))) return 0
  const planner = await userCanSeePlannerNotifications(pool, userst)
  const r = await pool.query(
    `UPDATE app.tbl_app_notification
     SET read_at = COALESCE(read_at, now())
     WHERE read_at IS NULL
       AND (
         (recipient_wkctr IS NOT NULL AND recipient_wkctr = $1)
         OR ($2::boolean AND audience = 'planner' AND recipient_wkctr IS NULL)
       )`,
    [wkctr.trim(), planner],
  )
  return r.rowCount ?? 0
}
