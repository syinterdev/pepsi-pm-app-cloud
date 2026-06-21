import type { Pool } from 'pg'
import {
  describePepsiWorkWeekLabel,
  formatPepsiWorkWeekLabel,
  pepsiWorkWeekDateRange,
  pepsiWorkWeekFromYmd,
} from '../lib/pepsi-work-week.js'
import { personnelIsActiveSql } from '../lib/personnel-active-sql.js'
import { safeRatio } from '../lib/reports-range.js'
import { parseWorkday } from './manhours.js'
import {
  resolveManhourChartRange,
  type ManhourChartBreakdown,
  type ManhourChartRange,
} from './manhour-chart.js'

export type HrConfirmPeriod = 'month' | 'week'

export type ManhourHrConfirmRow = {
  idwkctr: string
  wkctr: string
  displayName: string | null
  wh: number
  ot1: number
  ot15: number
  ot1hol: number
  ot2: number
  ot3: number
  totalManhours: number
  confirmHours: number
  utilizationPercent: number
}

export type ManhourHrConfirmReport = {
  range: ManhourChartRange
  period: HrConfirmPeriod
  periodLabel: string
  totals: ManhourChartBreakdown
  rows: ManhourHrConfirmRow[]
}

function unixToIsoDate(sec: number): string {
  const d = new Date(sec * 1000)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function monthEndDay(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

function resolveMonthRange(monthInput: string): ManhourChartRange {
  const m = /^(\d{4})-(\d{2})$/.exec(monthInput.trim())
  if (!m) throw new Error('Invalid month (expected yyyy-mm)')
  const year = Number(m[1])
  const month = Number(m[2])
  if (month < 1 || month > 12) throw new Error('Invalid month')
  const from = parseWorkday(`${year}-${String(month).padStart(2, '0')}-01`)
  const lastDay = monthEndDay(year, month)
  const to = parseWorkday(
    `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`,
  )
  return {
    from,
    to,
    fromDate: unixToIsoDate(from),
    toDate: unixToIsoDate(to),
  }
}

function resolveWeekRange(weekInput: string): ManhourChartRange {
  const m = /^(\d{4})-W(\d{2})$/.exec(weekInput.trim())
  if (!m) throw new Error('Invalid week (expected yyyy-Wnn)')
  const year = Number(m[1])
  const week = Number(m[2])
  if (week < 1 || week > 53) throw new Error('Invalid week')
  const { start, end } = pepsiWorkWeekDateRange(year, week)
  const from = parseWorkday(
    `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, '0')}-${String(start.getUTCDate()).padStart(2, '0')}`,
  )
  const to = parseWorkday(
    `${end.getUTCFullYear()}-${String(end.getUTCMonth() + 1).padStart(2, '0')}-${String(end.getUTCDate()).padStart(2, '0')}`,
  )
  return {
    from,
    to,
    fromDate: unixToIsoDate(from),
    toDate: unixToIsoDate(to),
  }
}

function defaultMonthInput(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function defaultWeekInput(): string {
  const d = new Date()
  return pepsiWorkWeekFromYmd(d.getFullYear(), d.getMonth() + 1, d.getDate()).label
}

function monthPeriodLabel(monthInput: string): string {
  const m = /^(\d{4})-(\d{2})$/.exec(monthInput.trim())
  if (!m) return monthInput
  const year = Number(m[1])
  const month = Number(m[2])
  const fmt = new Intl.DateTimeFormat('th-TH', { month: 'long', year: 'numeric' })
  return fmt.format(new Date(year, month - 1, 1))
}

export function resolveHrConfirmPeriod(opts: {
  period?: string
  month?: string
  week?: string
  from?: string
  to?: string
}): { range: ManhourChartRange; period: HrConfirmPeriod; periodLabel: string } {
  const period: HrConfirmPeriod = opts.period === 'week' ? 'week' : 'month'

  if (period === 'week') {
    const week = opts.week?.trim() || defaultWeekInput()
    const range = resolveWeekRange(week)
    return { range, period, periodLabel: describePepsiWorkWeekLabel(week) }
  }

  if (opts.month?.trim()) {
    const range = resolveMonthRange(opts.month.trim())
    return { range, period, periodLabel: monthPeriodLabel(opts.month.trim()) }
  }

  if (opts.from?.trim() || opts.to?.trim()) {
    const range = resolveManhourChartRange(opts.from, opts.to)
    return {
      range,
      period,
      periodLabel: `${range.fromDate} – ${range.toDate}`,
    }
  }

  const month = defaultMonthInput()
  const range = resolveMonthRange(month)
  return { range, period, periodLabel: monthPeriodLabel(month) }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

export async function getManhourHrConfirmReport(
  pool: Pool,
  opts: {
    period?: string
    month?: string
    week?: string
    from?: string
    to?: string
    idwkctrgroup?: string
    filterIdwkctr?: string
  } = {},
): Promise<ManhourHrConfirmReport> {
  const { range, period, periodLabel } = resolveHrConfirmPeriod(opts)
  const { from, to } = range
  const activeWc = personnelIsActiveSql('wc')

  const params: unknown[] = [from, to]
  const groupCond = opts.idwkctrgroup?.trim()
    ? (() => {
        params.push(opts.idwkctrgroup!.trim())
        return `AND wc.idwkctrgroup::text = $${params.length}`
      })()
    : ''
  const selfCond = opts.filterIdwkctr?.trim()
    ? (() => {
        params.push(opts.filterIdwkctr!.trim())
        return `AND wc.idwkctr = $${params.length}`
      })()
    : ''

  const r = await pool.query<{
    idwkctr: string
    wkctr: string
    display_name: string | null
    wh: string
    ot1: string
    ot15: string
    ot1hol: string
    ot2: string
    ot3: string
    confirm_hours: string
  }>(
    `WITH people AS (
       SELECT
         wc.idwkctr,
         wc.wkctr,
         NULLIF(TRIM(CONCAT(
           COALESCE(wc.titlewkctr,''),
           COALESCE(wc.namewkctr,''),
           ' ',
           COALESCE(wc.surnamewkctr,'')
         )), '') AS display_name
       FROM app.tbworkcenter wc
       WHERE ${activeWc}
         ${groupCond}
         ${selfCond}
     ),
     mh AS (
       SELECT
         m.idwkctr,
         COALESCE(SUM(m.wh), 0)::text AS wh,
         COALESCE(SUM(m.ot1), 0)::text AS ot1,
         COALESCE(SUM(m.ot15), 0)::text AS ot15,
         COALESCE(SUM(m.ot1hol), 0)::text AS ot1hol,
         COALESCE(SUM(m.ot2), 0)::text AS ot2,
         COALESCE(SUM(m.ot3), 0)::text AS ot3
       FROM app.tbmanhours m
       INNER JOIN people p ON p.idwkctr = m.idwkctr
       WHERE m.workday >= $1 AND m.workday <= $2
       GROUP BY m.idwkctr
     ),
     conf AS (
       SELECT
         p.wkctr,
         COALESCE(SUM(c.timewk), 0)::text AS confirm_hours
       FROM app.view_exportconfirm c
       INNER JOIN people p ON p.wkctr = c.wkctr
       WHERE c.endate >= $1 AND c.endate <= $2
       GROUP BY p.wkctr
     )
     SELECT
       p.idwkctr,
       p.wkctr,
       p.display_name,
       COALESCE(mh.wh, '0') AS wh,
       COALESCE(mh.ot1, '0') AS ot1,
       COALESCE(mh.ot15, '0') AS ot15,
       COALESCE(mh.ot1hol, '0') AS ot1hol,
       COALESCE(mh.ot2, '0') AS ot2,
       COALESCE(mh.ot3, '0') AS ot3,
       COALESCE(conf.confirm_hours, '0') AS confirm_hours
     FROM people p
     LEFT JOIN mh ON mh.idwkctr = p.idwkctr
     LEFT JOIN conf ON conf.wkctr = p.wkctr
     WHERE COALESCE(mh.wh, '0')::numeric > 0
        OR COALESCE(mh.ot1, '0')::numeric > 0
        OR COALESCE(mh.ot15, '0')::numeric > 0
        OR COALESCE(mh.ot1hol, '0')::numeric > 0
        OR COALESCE(mh.ot2, '0')::numeric > 0
        OR COALESCE(mh.ot3, '0')::numeric > 0
        OR COALESCE(conf.confirm_hours, '0')::numeric > 0
     ORDER BY p.wkctr ASC`,
    params,
  )

  const rows: ManhourHrConfirmRow[] = r.rows.map((row) => {
    const wh = Number(row.wh)
    const ot1 = Number(row.ot1)
    const ot15 = Number(row.ot15)
    const ot1hol = Number(row.ot1hol)
    const ot2 = Number(row.ot2)
    const ot3 = Number(row.ot3)
    const totalManhours = wh + ot1 + ot15 + ot1hol + ot2 + ot3
    const confirmHours = Number(row.confirm_hours)
    return {
      idwkctr: row.idwkctr,
      wkctr: row.wkctr,
      displayName: row.display_name,
      wh: round2(wh),
      ot1: round2(ot1),
      ot15: round2(ot15),
      ot1hol: round2(ot1hol),
      ot2: round2(ot2),
      ot3: round2(ot3),
      totalManhours: round2(totalManhours),
      confirmHours: round2(confirmHours),
      utilizationPercent: safeRatio(confirmHours, totalManhours),
    }
  })

  const totals = rows.reduce(
    (acc, row) => ({
      wh: acc.wh + row.wh,
      ot1: acc.ot1 + row.ot1,
      ot15: acc.ot15 + row.ot15,
      ot1hol: acc.ot1hol + row.ot1hol,
      ot2: acc.ot2 + row.ot2,
      ot3: acc.ot3 + row.ot3,
      confirmHours: acc.confirmHours + row.confirmHours,
    }),
    { wh: 0, ot1: 0, ot15: 0, ot1hol: 0, ot2: 0, ot3: 0, confirmHours: 0 },
  )

  return {
    range,
    period,
    periodLabel,
    totals: {
      range,
      wh: round2(totals.wh),
      ot1: round2(totals.ot1),
      ot15: round2(totals.ot15),
      ot1hol: round2(totals.ot1hol),
      ot2: round2(totals.ot2),
      ot3: round2(totals.ot3),
      confirmHours: round2(totals.confirmHours),
    },
    rows,
  }
}

export { formatPepsiWorkWeekLabel }
