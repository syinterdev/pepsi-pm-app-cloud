import type { Pool } from 'pg'
import { parseWorkday } from './manhours.js'

export type ManhourChartRange = {
  from: number
  to: number
  fromDate: string
  toDate: string
}

export type ManhourChartProfile = {
  idwkctr: string
  wkctr: string
  displayName: string
  position: string | null
  wkctrtype: string | null
  imgmember: string | null
  hasImage: boolean
}

export type ManhourZbStat = {
  wktype: string
  planned: number
  confirmed: number
  percent: number
}

export type ManhourChartPerformance = {
  range: ManhourChartRange
  profile: ManhourChartProfile
  totalPlannedOrders: number
  utilizationPercent: number
  confirmHours: number
  manhourTotal: number
  zb: ManhourZbStat[]
}

export type ManhourChartBreakdown = {
  range: ManhourChartRange
  wh: number
  ot1: number
  ot15: number
  ot1hol: number
  ot2: number
  ot3: number
  confirmHours: number
}

function unixToIsoDate(sec: number): string {
  const d = new Date(sec * 1000)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function defaultRange(): ManhourChartRange {
  const end = new Date()
  end.setHours(0, 0, 0, 0)
  const start = new Date(end)
  start.setDate(start.getDate() - 30)
  const from = Math.floor(start.getTime() / 1000)
  const to = Math.floor(end.getTime() / 1000)
  return { from, to, fromDate: unixToIsoDate(from), toDate: unixToIsoDate(to) }
}

export function resolveManhourChartRange(
  fromInput?: string,
  toInput?: string,
): ManhourChartRange {
  if (!fromInput?.trim() && !toInput?.trim()) return defaultRange()
  try {
    const from = fromInput?.trim() ? parseWorkday(fromInput.trim()) : undefined
    const to = toInput?.trim() ? parseWorkday(toInput.trim()) : undefined
    const base = defaultRange()
    const resolvedFrom = from ?? base.from
    const resolvedTo = to ?? base.to
    if (resolvedTo < resolvedFrom) throw new Error('to must be >= from')
    return {
      from: resolvedFrom,
      to: resolvedTo,
      fromDate: unixToIsoDate(resolvedFrom),
      toDate: unixToIsoDate(resolvedTo),
    }
  } catch {
    return defaultRange()
  }
}

function zbPercent(planned: number, confirmed: number): number {
  if (confirmed <= 0) return 0
  return Math.round((planned / confirmed) * 10000) / 100
}

/** แถว manhour ช่วง stworkday–workday ทับซ้อนช่วงที่เลือก (M_manhour) */
const MANHOUR_PERIOD_OVERLAP_SQL = 'stworkday <= $3 AND workday >= $2'

async function loadProfile(pool: Pool, idwkctr: string): Promise<ManhourChartProfile | null> {
  const r = await pool.query<{
    idwkctr: string
    wkctr: string
    titlewkctr: string | null
    namewkctr: string | null
    surnamewkctr: string | null
    position: string | null
    wkctrtype: string | null
    imgmember: string | null
    has_image: boolean
  }>(
    `SELECT
       wc.idwkctr,
       wc.wkctr,
       wc.titlewkctr,
       wc.namewkctr,
       wc.surnamewkctr,
       pos.position,
       typ.wkctrtype,
       wc.imgmember,
       (octet_length(wc.imgmember_data) > 0) AS has_image
     FROM app.tbworkcenter wc
     LEFT JOIN app.tbposition pos ON pos.idposition::text = wc.idposition::text
     LEFT JOIN app.tbwkctrtype typ ON typ.idwkctrtype::text = wc.idwkctrtype::text
     WHERE wc.idwkctr = $1
     LIMIT 1`,
    [idwkctr],
  )
  const row = r.rows[0]
  if (!row) return null
  const displayName = [row.titlewkctr, row.namewkctr, row.surnamewkctr]
    .filter(Boolean)
    .join('')
    .trim()
  return {
    idwkctr: row.idwkctr,
    wkctr: row.wkctr,
    displayName: displayName || row.idwkctr,
    position: row.position,
    wkctrtype: row.wkctrtype,
    imgmember: row.imgmember,
    hasImage: Boolean(row.has_image),
  }
}

export async function getManhourChartPerformance(
  pool: Pool,
  idwkctr: string,
  range: ManhourChartRange,
): Promise<ManhourChartPerformance | null> {
  const profile = await loadProfile(pool, idwkctr)
  if (!profile) return null
  const { from, to } = range
  const wkctr = profile.wkctr

  const [planRes, confirmSumRes, mhRes, zbTypes] = await Promise.all([
    pool.query<{ n: string }>(
      `SELECT COUNT(*)::text AS n
       FROM app.view_planwork
       WHERE wkctr = $1 AND bscstart BETWEEN $2 AND $3`,
      [wkctr, from, to],
    ),
    pool.query<{ total: string }>(
      `SELECT COALESCE(SUM(timewk), 0)::text AS total
       FROM app.view_exportconfirm
       WHERE wkctr = $1 AND endate BETWEEN $2 AND $3`,
      [wkctr, from, to],
    ),
    pool.query<{
      twh: string
      tot1: string
      tot15: string
      tot1hol: string
      tot2: string
      tot3: string
    }>(
      `SELECT
         COALESCE(SUM(wh), 0)::text AS twh,
         COALESCE(SUM(ot1), 0)::text AS tot1,
         COALESCE(SUM(ot15), 0)::text AS tot15,
         COALESCE(SUM(ot1hol), 0)::text AS tot1hol,
         COALESCE(SUM(ot2), 0)::text AS tot2,
         COALESCE(SUM(ot3), 0)::text AS tot3
       FROM app.tbmanhours
       WHERE idwkctr = $1 AND ${MANHOUR_PERIOD_OVERLAP_SQL}`,
      [idwkctr, from, to],
    ),
    Promise.all(
      (['ZB01', 'ZB02', 'ZB05'] as const).map(async (wktype) => {
        const [plannedRes, confirmedRes] = await Promise.all([
          pool.query<{ n: string }>(
            `SELECT COUNT(*)::text AS n
             FROM app.view_planwork
             WHERE wkctr = $1 AND wktype = $2 AND bscstart BETWEEN $3 AND $4`,
            [wkctr, wktype, from, to],
          ),
          pool.query<{ n: string }>(
            `SELECT COUNT(*)::text AS n
             FROM app.view_exportconfirm
             WHERE wkctr = $1 AND wktype = $2 AND endate BETWEEN $3 AND $4`,
            [wkctr, wktype, from, to],
          ),
        ])
        const planned = Number(plannedRes.rows[0]?.n ?? 0)
        const confirmed = Number(confirmedRes.rows[0]?.n ?? 0)
        return {
          wktype,
          planned,
          confirmed,
          percent: zbPercent(planned, confirmed),
        }
      }),
    ),
  ])

  const confirmHours = Number(confirmSumRes.rows[0]?.total ?? 0)
  const mh = mhRes.rows[0]
  const manhourTotal =
    Number(mh?.twh ?? 0) +
    Number(mh?.tot1 ?? 0) +
    Number(mh?.tot15 ?? 0) +
    Number(mh?.tot1hol ?? 0) +
    Number(mh?.tot2 ?? 0) +
    Number(mh?.tot3 ?? 0)

  const utilizationPercent =
    manhourTotal > 0 ? Math.round((confirmHours / manhourTotal) * 10000) / 100 : 0

  return {
    range,
    profile,
    totalPlannedOrders: Number(planRes.rows[0]?.n ?? 0),
    utilizationPercent,
    confirmHours,
    manhourTotal,
    zb: zbTypes,
  }
}

export async function getManhourChartBreakdown(
  pool: Pool,
  idwkctr: string,
  range: ManhourChartRange,
): Promise<ManhourChartBreakdown | null> {
  const profile = await loadProfile(pool, idwkctr)
  if (!profile) return null
  const wkctr = profile.wkctr
  const { from, to } = range
  const [mhRes, confirmRes] = await Promise.all([
    pool.query<{
      wh: string
      ot1: string
      ot15: string
      ot1hol: string
      ot2: string
      ot3: string
    }>(
      `SELECT
         COALESCE(SUM(wh), 0)::text AS wh,
         COALESCE(SUM(ot1), 0)::text AS ot1,
         COALESCE(SUM(ot15), 0)::text AS ot15,
         COALESCE(SUM(ot1hol), 0)::text AS ot1hol,
         COALESCE(SUM(ot2), 0)::text AS ot2,
         COALESCE(SUM(ot3), 0)::text AS ot3
       FROM app.tbmanhours
       WHERE idwkctr = $1 AND ${MANHOUR_PERIOD_OVERLAP_SQL}`,
      [idwkctr, from, to],
    ),
    pool.query<{ total: string }>(
      `SELECT COALESCE(SUM(timewk), 0)::text AS total
       FROM app.view_confirmation
       WHERE wkctr = $1 AND endate BETWEEN $2 AND $3`,
      [wkctr, from, to],
    ),
  ])
  const mh = mhRes.rows[0]
  return {
    range,
    wh: Number(mh?.wh ?? 0),
    ot1: Number(mh?.ot1 ?? 0),
    ot15: Number(mh?.ot15 ?? 0),
    ot1hol: Number(mh?.ot1hol ?? 0),
    ot2: Number(mh?.ot2 ?? 0),
    ot3: Number(mh?.ot3 ?? 0),
    confirmHours: Number(confirmRes.rows[0]?.total ?? 0),
  }
}
