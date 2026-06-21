import type { Pool } from 'pg'
import {
  type BoardPeriodId,
  resolveBoardPeriodDateRange,
} from '../lib/board-period.js'
import type { BoardActivityItem, BoardActivityResponse } from '../schemas/board-activity.js'
import { fetchSettings, settingAsString } from './setting-store.js'

const DEFAULT_TZ = 'Asia/Bangkok'
const FETCH_PER_SOURCE = 24
const MIN_UNIX = 946_684_800 // 2000-01-01
const MAX_UNIX = 4_102_444_800 // 2100-01-01

type RawRow = {
  source_id: string
  kind: 'assigned' | 'closed'
  event_unix: string | number | null
  wkorder: string
  idwkctr: string
  wkctr: string
  display_name: string | null
  has_image: boolean
}

export async function getAppTimezone(pool: Pool): Promise<string> {
  try {
    const map = await fetchSettings(pool, ['app.timezone'])
    return settingAsString(map.get('app.timezone'))?.trim() || DEFAULT_TZ
  } catch {
    return DEFAULT_TZ
  }
}

function sanitizeUnix(raw: string | number | null | undefined): number | null {
  if (raw === null || raw === undefined || raw === '') return null
  const n = Number(raw)
  if (!Number.isFinite(n) || n < MIN_UNIX || n > MAX_UNIX) return null
  return Math.floor(n)
}

function toIsoFromUnix(unix: number): string {
  return new Date(unix * 1000).toISOString()
}

function actionLabel(kind: RawRow['kind']): string {
  return kind === 'assigned' ? 'รับงาน' : 'ปิดงาน'
}

export function mergeBoardActivityItems(
  rows: RawRow[],
  limit: number,
): BoardActivityItem[] {
  const items: BoardActivityItem[] = []
  for (const row of rows) {
    const unix = sanitizeUnix(row.event_unix)
    if (unix == null) continue
    items.push({
      id: row.source_id,
      kind: row.kind,
      occurredAt: toIsoFromUnix(unix),
      wkorder: row.wkorder.trim() || '—',
      idwkctr: row.idwkctr,
      wkctr: row.wkctr,
      displayName: row.display_name?.trim() || null,
      hasImage: Boolean(row.has_image),
      label: actionLabel(row.kind),
    })
  }
  items.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
  return items.slice(0, limit)
}

export async function getBoardActivity(
  pool: Pool,
  opts: { period: BoardPeriodId; limit: number; team?: 'A' | 'B' | 'EE' | 'UT' },
): Promise<BoardActivityResponse> {
  const timezone = await getAppTimezone(pool)
  const range = resolveBoardPeriodDateRange(opts.period, timezone)
  const limit = Math.min(12, Math.max(1, opts.limit))
  const fetchN = Math.max(limit, FETCH_PER_SOURCE)
  const team = opts.team?.trim()

  const assignedSql = `
    SELECT
      ('assign-' || p.idplanw::text) AS source_id,
      'assigned'::text AS kind,
      ev.event_unix,
      i.wkorder,
      wc.idwkctr::text AS idwkctr,
      p.wkctr,
      NULLIF(TRIM(CONCAT(COALESCE(wc.namewkctr, ''), ' ', COALESCE(wc.surnamewkctr, ''))), '') AS display_name,
      (octet_length(wc.imgmember_data) > 0) AS has_image
    FROM app.tbplangingwork p
    INNER JOIN app.tbiw37n i ON i.idiw37 = p.idiw37
    LEFT JOIN app.tbworkcenter wc ON wc.wkctr = p.wkctr
    LEFT JOIN app.tbmoveplan mov ON mov.idiw37 = p.idiw37
    CROSS JOIN LATERAL (
      SELECT COALESCE(
        CASE WHEN p.pwcomment ~ '^[0-9]{9,11}$' THEN p.pwcomment::bigint ELSE NULL END,
        NULLIF(mov.cday, 0),
        NULLIF(i.bscstart, 0)
      ) AS event_unix
    ) ev
    WHERE COALESCE(p.wkctr, '') <> ''
      AND ev.event_unix IS NOT NULL
      AND timezone($1, to_timestamp(ev.event_unix))::date >= $2::date
      AND timezone($1, to_timestamp(ev.event_unix))::date <= $3::date
      AND ($5::text IS NULL OR i.team = $5::text)
    ORDER BY ev.event_unix DESC
    LIMIT $4
  `

  const closedSql = `
    SELECT
      ('close-' || c.idclose::text) AS source_id,
      'closed'::text AS kind,
      c.timeclose AS event_unix,
      i.wkorder,
      wc.idwkctr::text AS idwkctr,
      c.wkctr,
      NULLIF(TRIM(CONCAT(COALESCE(wc.namewkctr, ''), ' ', COALESCE(wc.surnamewkctr, ''))), '') AS display_name,
      (octet_length(wc.imgmember_data) > 0) AS has_image
    FROM app.tbcofirm c
    INNER JOIN app.tbiw37n i ON i.idiw37 = c.idiw37
    LEFT JOIN app.tbworkcenter wc ON wc.wkctr = c.wkctr
    WHERE i.confirm_qc_status = 'approved'
      AND c.timeclose > 0
      AND timezone($1, to_timestamp(c.timeclose))::date >= $2::date
      AND timezone($1, to_timestamp(c.timeclose))::date <= $3::date
      AND ($5::text IS NULL OR i.team = $5::text)
    ORDER BY c.timeclose DESC
    LIMIT $4
  `

  const params = [timezone, range.from, range.to, fetchN, team ?? null]

  const [assignedR, closedR] = await Promise.all([
    pool.query<RawRow>(assignedSql, params),
    pool.query<RawRow>(closedSql, params),
  ])

  const merged = mergeBoardActivityItems([...assignedR.rows, ...closedR.rows], limit)

  return {
    period: opts.period,
    range,
    timezone,
    limit,
    items: merged,
  }
}
