import type { Pool } from 'pg'

export type WorktimePlanningRow = {
  idplanw: number
  idiw37: number
  mntplan: string | null
  wkorder: string
  startDate: string | null
  endDate: string | null
  assigner: string | null
  comment: string | null
}

function unixToIsoDate(sec: string | number | null): string | null {
  if (sec == null || sec === '') return null
  const n = Number(sec)
  if (!Number.isFinite(n) || n <= 0) return null
  const d = new Date(n * 1000)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * ตารางมอบหมายงานของช่าง
 */
export async function listWorktimePlanningAssignments(
  pool: Pool,
  idwkctr: string,
  opts: { limit?: number } = {},
): Promise<WorktimePlanningRow[]> {
  const limit = Math.max(1, Math.min(1000, opts.limit ?? 500))
  const r = await pool.query<{
    idplanw: string
    idiw37: string
    mntplan: string | null
    wkorder: string
    bscstart: string | null
    actfinish: string | null
    wkctrpw: string | null
    pwcomment: string | null
  }>(
    `SELECT
       p.idplanw::text,
       p.idiw37::text,
       i.mntplan,
       i.wkorder,
       i.bscstart::text,
       i.actfinish::text,
       p.wkctrpw,
       p.pwcomment
     FROM app.tbplangingwork p
     INNER JOIN app.tbiw37n i ON i.idiw37 = p.idiw37
     INNER JOIN app.tbworkcenter wc ON wc.wkctr = p.wkctr
     WHERE wc.idwkctr = $1
     ORDER BY i.bscstart DESC NULLS LAST, p.idplanw DESC
     LIMIT $2`,
    [idwkctr, limit],
  )

  return r.rows.map((row) => ({
    idplanw: Number(row.idplanw),
    idiw37: Number(row.idiw37),
    mntplan: row.mntplan?.trim() || null,
    wkorder: row.wkorder,
    startDate: unixToIsoDate(row.bscstart),
    endDate: unixToIsoDate(row.actfinish),
    assigner: row.wkctrpw?.trim() || null,
    comment: row.pwcomment?.trim() || null,
  }))
}
