import type { Pool } from 'pg'
import { resolveManhourChartRange, type ManhourChartRange } from './manhour-chart.js'
import { personnelIsActiveSql } from '../lib/personnel-active-sql.js'
import { pepsiWorkWeekDateRange, pepsiWorkWeekFromUnix } from '../lib/pepsi-work-week.js'

export type WorktimeOverallZbStat = {
  wktype: 'ZB01' | 'ZB02' | 'ZB05'
  planned: number
  completed: number
  percentCompleted: number
}

export type WorktimeOverallPmPeriodSummary = {
  label: string
  totalPmPlanned: number
  totalPmCompleted: number
  backlog: number
}

export type WorktimeOverallHoursYearSummary = {
  hrHours: number
  confirmHours: number
}

export type WorktimeOverallPmLineRow = {
  productline: string
  prolinedescrip: string | null
  planned: number
}

export type WorktimeOverallTechnicianRow = {
  idwkctr: string
  wkctr: string
  displayName: string | null
  hasImage: boolean
  completedOrders: number
  confirmHours: number
}

export type WorktimeSummaryOverallResponse = {
  range: ManhourChartRange
  year: number
  pmYear: WorktimeOverallPmPeriodSummary
  pmMonth: WorktimeOverallPmPeriodSummary
  pmWeek: WorktimeOverallPmPeriodSummary
  hoursYear: WorktimeOverallHoursYearSummary
  pmByLine: WorktimeOverallPmLineRow[]
  zb: WorktimeOverallZbStat[]
  technicians: WorktimeOverallTechnicianRow[]
}

function percentCompleted(planned: number, completed: number): number {
  if (planned <= 0) return 0
  return Math.round((completed / planned) * 10000) / 100
}

function yearRange(year: number): { fromInput: string; toInput: string } {
  const y = Math.max(1900, Math.min(2100, Math.floor(year)))
  return { fromInput: `${y}-01-01`, toInput: `${y}-12-31` }
}

function ymdFromDateUtc(d: Date): { y: number; m: number; d: number } {
  return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate() }
}

function isoDateUtc(d: Date): string {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function monthRange(year: number, month: number): { fromInput: string; toInput: string } {
  const m = Math.max(1, Math.min(12, Math.floor(month)))
  const from = new Date(Date.UTC(year, m - 1, 1, 12, 0, 0))
  const to = new Date(Date.UTC(year, m, 0, 12, 0, 0))
  return { fromInput: isoDateUtc(from), toInput: isoDateUtc(to) }
}

function parseWeekLabel(label: string): { year: number; week: number } | null {
  const m = /^(\d{4})-W(\d{2})$/.exec((label ?? '').trim())
  if (!m) return null
  const year = Number(m[1])
  const week = Number(m[2])
  if (!Number.isFinite(year) || !Number.isFinite(week) || week < 1 || week > 60) return null
  return { year, week }
}

function pmSummaryLabel(fromInput: string, toInput: string): string {
  return `${fromInput} ถึง ${toInput}`
}

async function pmSummary(
  pool: Pool,
  range: { from: number; to: number },
): Promise<{ planned: number; completed: number }> {
  const wktype = 'ZB02'
  const [plannedRes, completedRes] = await Promise.all([
    pool.query<{ n: string }>(
      `SELECT COUNT(*)::text AS n
       FROM app.view_planwork
       WHERE wktype = $1 AND bscstart BETWEEN $2 AND $3`,
      [wktype, range.from, range.to],
    ),
    pool.query<{ n: string }>(
      `SELECT COUNT(*)::text AS n
       FROM app.view_exportconfirm
       WHERE wktype = $1 AND endate BETWEEN $2 AND $3`,
      [wktype, range.from, range.to],
    ),
  ])
  return {
    planned: Number(plannedRes.rows[0]?.n ?? 0),
    completed: Number(completedRes.rows[0]?.n ?? 0),
  }
}

export async function getWorktimeSummaryOverall(
  pool: Pool,
  opts: { year?: number; month?: number; weekLabel?: string; fromInput?: string; toInput?: string } = {},
): Promise<WorktimeSummaryOverallResponse> {
  const year = Number.isFinite(opts.year) ? Math.floor(opts.year!) : new Date().getFullYear()
  const rangeInput =
    opts.fromInput?.trim() || opts.toInput?.trim()
      ? { fromInput: opts.fromInput, toInput: opts.toInput }
      : yearRange(year)
  const range = resolveManhourChartRange(rangeInput.fromInput, rangeInput.toInput)
  const { from, to } = range

  const now = new Date()
  const month =
    Number.isFinite(opts.month) && opts.month != null ? Math.floor(opts.month) : now.getMonth() + 1
  const monthInput = monthRange(year, month)
  const monthRangeResolved = resolveManhourChartRange(monthInput.fromInput, monthInput.toInput)

  const nowSec = Math.floor(now.getTime() / 1000)
  const wwFallback = pepsiWorkWeekFromUnix(nowSec)
  const parsed = opts.weekLabel?.trim() ? parseWeekLabel(opts.weekLabel) : null
  const ww = parsed ?? wwFallback
  const weekDates = pepsiWorkWeekDateRange(ww.year, ww.week)
  const weekYmdStart = ymdFromDateUtc(weekDates.start)
  const weekYmdEnd = ymdFromDateUtc(weekDates.end)
  const weekInput = {
    fromInput: `${weekYmdStart.y}-${String(weekYmdStart.m).padStart(2, '0')}-${String(weekYmdStart.d).padStart(2, '0')}`,
    toInput: `${weekYmdEnd.y}-${String(weekYmdEnd.m).padStart(2, '0')}-${String(weekYmdEnd.d).padStart(2, '0')}`,
  }
  const weekRangeResolved = resolveManhourChartRange(weekInput.fromInput, weekInput.toInput)

  const wktypeList = ['ZB01', 'ZB02', 'ZB05'] as const

  const [plannedRes, completedRes, techRes, pmYearCounts, pmMonthCounts, pmWeekCounts, hoursYearRes, pmByLineRes] =
    await Promise.all([
    pool.query<{ wktype: string; n: string }>(
      `SELECT wktype, COUNT(*)::text AS n
       FROM app.view_planwork
       WHERE wktype = ANY($1) AND bscstart BETWEEN $2 AND $3
       GROUP BY wktype`,
      [wktypeList, from, to],
    ),
    pool.query<{ wktype: string; n: string }>(
      `SELECT wktype, COUNT(*)::text AS n
       FROM app.view_exportconfirm
       WHERE wktype = ANY($1) AND endate BETWEEN $2 AND $3
       GROUP BY wktype`,
      [wktypeList, from, to],
    ),
    pool.query<{
      idwkctr: string
      wkctr: string
      display_name: string | null
      has_image: boolean
      completed_orders: string
      confirm_hours: string
    }>(
      `SELECT
         wc.idwkctr,
         wc.wkctr,
         NULLIF(TRIM(CONCAT(
           COALESCE(wc.titlewkctr,''),
           COALESCE(wc.namewkctr,''),
           ' ',
           COALESCE(wc.surnamewkctr,'')
         )), '') AS display_name,
         (octet_length(wc.imgmember_data) > 0) AS has_image,
         COUNT(*)::text AS completed_orders,
         COALESCE(SUM(c.timewk), 0)::text AS confirm_hours
       FROM app.view_exportconfirm c
       INNER JOIN app.tbworkcenter wc ON wc.wkctr = c.wkctr
       WHERE c.wktype = ANY($1)
         AND c.endate BETWEEN $2 AND $3
         AND ${personnelIsActiveSql('wc')}
       GROUP BY wc.idwkctr, wc.wkctr, wc.titlewkctr, wc.namewkctr, wc.surnamewkctr, wc.imgmember_data
       ORDER BY COALESCE(SUM(c.timewk), 0) DESC
       LIMIT 25`,
      [wktypeList, from, to],
    ),
    pmSummary(pool, range),
    pmSummary(pool, monthRangeResolved),
    pmSummary(pool, weekRangeResolved),
    pool.query<{ hr_hours: string; confirm_hours: string }>(
      `SELECT
         (SELECT COALESCE(SUM(m.wh + m.ot1 + m.ot15 + m.ot1hol + m.ot2 + m.ot3), 0)::text
          FROM app.tbmanhours m
          WHERE m.workday BETWEEN $1 AND $2
         ) AS hr_hours,
         (SELECT COALESCE(SUM(c.timewk), 0)::text
          FROM app.view_exportconfirm c
          WHERE c.endate BETWEEN $1 AND $2
         ) AS confirm_hours`,
      [from, to],
    ),
    pool.query<{ productline: string; prolinedescrip: string | null; planned: string }>(
      `WITH mntplan_to_line AS (
         SELECT DISTINCT ON (tl.mntplan)
           tl.mntplan,
           COALESCE(z.idproductline, 'UNKNOWN') AS productline,
           pl.prolinedescrip
         FROM app.tbtasklist tl
         LEFT JOIN app.tbzone z ON z.idzone = tl.idzone
         LEFT JOIN app.tbproductline pl ON pl.productline = z.idproductline
         WHERE tl.mntplan IS NOT NULL AND TRIM(tl.mntplan) <> ''
         ORDER BY tl.mntplan, tl.tasklist ASC, tl.machine ASC, tl.pmlist ASC
       )
       SELECT
         m.productline,
         m.prolinedescrip,
         COUNT(*)::text AS planned
       FROM app.view_planwork pw
       LEFT JOIN mntplan_to_line m ON m.mntplan = pw.mntplan
       WHERE pw.wktype = 'ZB02'
         AND pw.bscstart BETWEEN $1 AND $2
       GROUP BY m.productline, m.prolinedescrip
       ORDER BY COUNT(*) DESC, m.productline ASC`,
      [weekRangeResolved.from, weekRangeResolved.to],
    ),
  ])

  const plannedMap = new Map(plannedRes.rows.map((r) => [r.wktype, Number(r.n)]))
  const completedMap = new Map(completedRes.rows.map((r) => [r.wktype, Number(r.n)]))

  const zb: WorktimeOverallZbStat[] = wktypeList.map((wktype) => {
    const planned = plannedMap.get(wktype) ?? 0
    const completed = completedMap.get(wktype) ?? 0
    return {
      wktype,
      planned,
      completed,
      percentCompleted: percentCompleted(planned, completed),
    }
  })

  const pmYear: WorktimeOverallPmPeriodSummary = {
    label: String(year),
    totalPmPlanned: pmYearCounts.planned,
    totalPmCompleted: pmYearCounts.completed,
    backlog: Math.max(0, pmYearCounts.planned - pmYearCounts.completed),
  }
  const pmMonth: WorktimeOverallPmPeriodSummary = {
    label: pmSummaryLabel(monthRangeResolved.fromDate, monthRangeResolved.toDate),
    totalPmPlanned: pmMonthCounts.planned,
    totalPmCompleted: pmMonthCounts.completed,
    backlog: Math.max(0, pmMonthCounts.planned - pmMonthCounts.completed),
  }
  const pmWeek: WorktimeOverallPmPeriodSummary = {
    label: pmSummaryLabel(weekRangeResolved.fromDate, weekRangeResolved.toDate),
    totalPmPlanned: pmWeekCounts.planned,
    totalPmCompleted: pmWeekCounts.completed,
    backlog: Math.max(0, pmWeekCounts.planned - pmWeekCounts.completed),
  }

  const hoursRow = hoursYearRes.rows[0]
  const hoursYear: WorktimeOverallHoursYearSummary = {
    hrHours: Math.round(Number(hoursRow?.hr_hours ?? 0) * 10) / 10,
    confirmHours: Math.round(Number(hoursRow?.confirm_hours ?? 0) * 10) / 10,
  }

  const pmByLine: WorktimeOverallPmLineRow[] = pmByLineRes.rows.map((r) => ({
    productline: r.productline ?? 'UNKNOWN',
    prolinedescrip: r.prolinedescrip ?? null,
    planned: Number(r.planned ?? 0),
  }))

  const technicians: WorktimeOverallTechnicianRow[] = techRes.rows.map((r) => ({
    idwkctr: r.idwkctr,
    wkctr: r.wkctr,
    displayName: r.display_name,
    hasImage: Boolean(r.has_image),
    completedOrders: Number(r.completed_orders),
    confirmHours: Math.round(Number(r.confirm_hours) * 10) / 10,
  }))

  return { range, year, pmYear, pmMonth, pmWeek, hoursYear, pmByLine, zb, technicians }
}

