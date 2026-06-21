import type { Pool } from 'pg'
import type {
  AnnouncementItem,
  CreateAnnouncementBody,
  PatchAnnouncementBody,
} from '../schemas/admin-announcement.js'

export function isAnnouncementTableMissing(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err)
  return (
    message.includes('tbl_announcement') ||
    message.includes('does not exist') ||
    message.includes('relation')
  )
}

type AnnouncementRow = {
  id: string
  level: string
  title: string
  body: string | null
  starts_at: Date
  ends_at: Date | null
  dismissable: boolean
  active: boolean
  created_by: string | null
  created_at: Date
}

function mapRow(row: AnnouncementRow): AnnouncementItem {
  return {
    id: Number(row.id),
    level: row.level as AnnouncementItem['level'],
    title: row.title,
    body: row.body,
    startsAt: row.starts_at.toISOString(),
    endsAt: row.ends_at?.toISOString() ?? null,
    dismissable: row.dismissable,
    active: row.active,
    createdBy: row.created_by,
    createdAt: row.created_at.toISOString(),
  }
}

export async function listAnnouncements(pool: Pool): Promise<AnnouncementItem[]> {
  const { rows } = await pool.query<AnnouncementRow>(
    `SELECT id, level, title, body, starts_at, ends_at, dismissable, active, created_by, created_at
     FROM app.tbl_announcement
     ORDER BY starts_at DESC, id DESC`,
  )
  return rows.map(mapRow)
}

export async function listActiveAnnouncements(pool: Pool): Promise<AnnouncementItem[]> {
  const { rows } = await pool.query<AnnouncementRow>(
    `SELECT id, level, title, body, starts_at, ends_at, dismissable, active, created_by, created_at
     FROM app.tbl_announcement
     WHERE active = true
       AND starts_at <= now()
       AND (ends_at IS NULL OR ends_at > now())
     ORDER BY starts_at DESC, id DESC`,
  )
  return rows.map(mapRow)
}

export async function createAnnouncement(
  pool: Pool,
  body: CreateAnnouncementBody,
  createdBy: string,
): Promise<AnnouncementItem> {
  const { rows } = await pool.query<AnnouncementRow>(
    `INSERT INTO app.tbl_announcement
       (level, title, body, starts_at, ends_at, dismissable, active, created_by)
     VALUES ($1, $2, $3, COALESCE($4::timestamptz, now()), $5::timestamptz, $6, $7, $8)
     RETURNING id, level, title, body, starts_at, ends_at, dismissable, active, created_by, created_at`,
    [
      body.level ?? 'info',
      body.title,
      body.body ?? null,
      body.startsAt ?? null,
      body.endsAt ?? null,
      body.dismissable ?? true,
      body.active ?? true,
      createdBy,
    ],
  )
  return mapRow(rows[0]!)
}

export async function patchAnnouncement(
  pool: Pool,
  id: number,
  body: PatchAnnouncementBody,
): Promise<AnnouncementItem | null> {
  const fields: string[] = []
  const values: unknown[] = []
  let i = 1

  if (body.level !== undefined) {
    fields.push(`level = $${i++}`)
    values.push(body.level)
  }
  if (body.title !== undefined) {
    fields.push(`title = $${i++}`)
    values.push(body.title)
  }
  if (body.body !== undefined) {
    fields.push(`body = $${i++}`)
    values.push(body.body)
  }
  if (body.startsAt !== undefined) {
    fields.push(`starts_at = $${i++}::timestamptz`)
    values.push(body.startsAt)
  }
  if (body.endsAt !== undefined) {
    fields.push(`ends_at = $${i++}::timestamptz`)
    values.push(body.endsAt)
  }
  if (body.dismissable !== undefined) {
    fields.push(`dismissable = $${i++}`)
    values.push(body.dismissable)
  }
  if (body.active !== undefined) {
    fields.push(`active = $${i++}`)
    values.push(body.active)
  }

  if (fields.length === 0) {
    const { rows } = await pool.query<AnnouncementRow>(
      `SELECT id, level, title, body, starts_at, ends_at, dismissable, active, created_by, created_at
       FROM app.tbl_announcement WHERE id = $1`,
      [id],
    )
    return rows[0] ? mapRow(rows[0]) : null
  }

  values.push(id)
  const { rows } = await pool.query<AnnouncementRow>(
    `UPDATE app.tbl_announcement SET ${fields.join(', ')}
     WHERE id = $${i}
     RETURNING id, level, title, body, starts_at, ends_at, dismissable, active, created_by, created_at`,
    values,
  )
  return rows[0] ? mapRow(rows[0]) : null
}

export async function deleteAnnouncement(pool: Pool, id: number): Promise<boolean> {
  const { rowCount } = await pool.query(`DELETE FROM app.tbl_announcement WHERE id = $1`, [id])
  return (rowCount ?? 0) > 0
}
