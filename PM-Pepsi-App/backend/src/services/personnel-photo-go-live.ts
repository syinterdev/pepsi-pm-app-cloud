import type { Pool } from 'pg'
import { personnelIsActiveSql } from '../lib/personnel-active-sql.js'
import { resolveReportsRange, type ReportsDateRange } from '../lib/reports-range.js'

/** สถานะที่ซ่อนจาก Eng Utilization (is_active=false ใน tbwkctrstatus) */
export const PHOTO_GO_LIVE_DEACTIVATE_STATUS = 'TERMINATED' as const

export type PhotoGoLiveGapRow = {
  idwkctr: string
  wkctr: string
  displayName: string | null
  workstatus: string | null
  manhourHours: number
}

export async function listPhotoGoLiveGaps(
  pool: Pool,
  opts: { fromInput?: string; toInput?: string; weeksBack?: number } = {},
): Promise<{ range: { from: string; to: string }; items: PhotoGoLiveGapRow[] }> {
  let range: ReportsDateRange
  try {
    range = resolveReportsRange(opts)
  } catch {
    range = resolveReportsRange({ weeksBack: opts.weeksBack ?? 8 })
  }

  const active = personnelIsActiveSql('wc')
  const res = await pool.query<{
    idwkctr: string
    wkctr: string
    display_name: string | null
    workstatus: string | null
    hours: string
  }>(
    `SELECT
       wc.idwkctr,
       wc.wkctr,
       NULLIF(TRIM(CONCAT(COALESCE(wc.titlewkctr,''), COALESCE(wc.namewkctr,''), ' ', COALESCE(wc.surnamewkctr,''))), '') AS display_name,
       wc.workstatus,
       COALESCE(SUM(m.wh + m.ot1 + m.ot15 + m.ot1hol + m.ot2 + m.ot3), 0)::text AS hours
     FROM app.tbworkcenter wc
     INNER JOIN app.tbmanhours m ON m.idwkctr = wc.idwkctr
       AND m.workday >= $1 AND m.workday <= $2
     WHERE ${active}
       AND NOT (octet_length(wc.imgmember_data) > 0)
     GROUP BY wc.idwkctr, wc.wkctr, wc.titlewkctr, wc.namewkctr, wc.surnamewkctr, wc.workstatus
     ORDER BY SUM(m.wh + m.ot1 + m.ot15 + m.ot1hol + m.ot2 + m.ot3) DESC`,
    [range.from, range.to],
  )

  return {
    range: { from: range.fromDate, to: range.toDate },
    items: res.rows.map((r) => ({
      idwkctr: r.idwkctr,
      wkctr: r.wkctr,
      displayName: r.display_name,
      workstatus: r.workstatus,
      manhourHours: Math.round(Number(r.hours) * 100) / 100,
    })),
  }
}

export async function deactivateWithoutPhoto(
  pool: Pool,
  opts: {
    idwkctrs: string[]
    workstatus?: string
  },
): Promise<{ updated: number; workstatus: string; skipped: string[] }> {
  const workstatus = opts.workstatus?.trim() || PHOTO_GO_LIVE_DEACTIVATE_STATUS
  const ids = [...new Set(opts.idwkctrs.map((id) => id.trim()).filter(Boolean))]
  if (ids.length === 0) {
    return { updated: 0, workstatus, skipped: [] }
  }

  const active = personnelIsActiveSql('wc')
  const res = await pool.query<{ idwkctr: string }>(
    `UPDATE app.tbworkcenter wc
     SET workstatus = $1
     WHERE wc.idwkctr = ANY($2::text[])
       AND ${active}
       AND NOT (octet_length(wc.imgmember_data) > 0)
     RETURNING wc.idwkctr`,
    [workstatus, ids],
  )

  const updatedSet = new Set(res.rows.map((r) => r.idwkctr))
  const skipped = ids.filter((id) => !updatedSet.has(id))
  return { updated: res.rowCount ?? 0, workstatus, skipped }
}
