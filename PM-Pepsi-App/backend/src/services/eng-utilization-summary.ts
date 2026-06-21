import type { Pool } from 'pg'
import { resolveManhourChartRange, type ManhourChartRange } from './manhour-chart.js'
import { resolveHrConfirmPeriod } from './manhour-hr-confirm.js'
import { getEngUtilizationDailyFromDb } from './eng-utilization-db.js'

export type EngUtilizationPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly'

function resolveYearRange(year: number): ManhourChartRange {
  const y = Number.isFinite(year) ? year : new Date().getFullYear()
  const from = Math.floor(new Date(y, 0, 1, 0, 0, 0, 0).getTime() / 1000)
  const to = Math.floor(new Date(y, 11, 31, 0, 0, 0, 0).getTime() / 1000)
  // reuse manhour range formatting helper by round-tripping through resolver
  return resolveManhourChartRange(String(from), String(to))
}

function todayRange(): ManhourChartRange {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  const from = Math.floor(d.getTime() / 1000)
  const to = from
  return resolveManhourChartRange(String(from), String(to))
}

export async function getEngUtilizationSummary(
  pool: Pool,
  opts: {
    period?: string
    week?: string
    month?: string
    year?: number
    from?: string
    to?: string
  } = {},
) {
  const period: EngUtilizationPeriod =
    opts.period === 'weekly'
      ? 'weekly'
      : opts.period === 'monthly'
        ? 'monthly'
        : opts.period === 'yearly'
          ? 'yearly'
          : 'daily'

  let range: ManhourChartRange
  let periodLabel: string

  if (period === 'weekly') {
    const r = resolveHrConfirmPeriod({ period: 'week', week: opts.week })
    range = r.range
    periodLabel = r.periodLabel
  } else if (period === 'monthly') {
    const r = resolveHrConfirmPeriod({ period: 'month', month: opts.month, from: opts.from, to: opts.to })
    range = r.range
    periodLabel = r.periodLabel
  } else if (period === 'yearly') {
    const y = opts.year ?? new Date().getFullYear()
    range = resolveYearRange(y)
    periodLabel = String(y)
  } else {
    // daily
    if (opts.from?.trim() || opts.to?.trim()) {
      range = resolveManhourChartRange(opts.from, opts.to)
      periodLabel = `${range.fromDate} – ${range.toDate}`
    } else {
      range = todayRange()
      periodLabel = range.fromDate
    }
  }

  const data = await getEngUtilizationDailyFromDb(pool, { fromInput: String(range.from), toInput: String(range.to) })
  return {
    ...data,
    period,
    periodLabel,
  }
}

