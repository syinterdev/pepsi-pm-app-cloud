import { format } from 'date-fns'
import { currentPepsiWorkWeekLabel } from '@/lib/manhour-hr-confirm-period'
import {
  describePepsiWorkWeekLabel,
  pepsiWorkWeekDateRange,
  utcDateToIso,
} from '@/lib/pepsi-work-week'

export type ManhourPerformancePeriod = 'daily' | 'weekly' | 'yearly'

export type ManhourPerformanceRange = {
  from: string
  to: string
  periodLabel: string
}

function isoToday(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

export function resolveManhourPerformanceRange(opts: {
  period: ManhourPerformancePeriod
  day?: string
  week?: string
  year?: number
}): ManhourPerformanceRange {
  const { period } = opts

  if (period === 'daily') {
    const day = opts.day?.trim() || isoToday()
    const [y, m, d] = day.split('-')
    const fmt = new Intl.DateTimeFormat('th-TH', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    const periodLabel = y && m && d ? fmt.format(new Date(Number(y), Number(m) - 1, Number(d))) : day
    return { from: day, to: day, periodLabel }
  }

  if (period === 'weekly') {
    const week = opts.week?.trim() || currentPepsiWorkWeekLabel()
    const m = /^(\d{4})-W(\d{2})$/.exec(week)
    if (!m) throw new Error('Invalid week')
    const { start, end } = pepsiWorkWeekDateRange(Number(m[1]), Number(m[2]))
    return {
      from: utcDateToIso(start),
      to: utcDateToIso(end),
      periodLabel: describePepsiWorkWeekLabel(week),
    }
  }

  const year = opts.year ?? new Date().getFullYear()
  const from = `${year}-01-01`
  const thisYear = new Date().getFullYear()
  const to = year >= thisYear ? isoToday() : `${year}-12-31`
  const fmt = new Intl.DateTimeFormat('th-TH', { year: 'numeric' })
  return { from, to, periodLabel: fmt.format(new Date(year, 0, 1)) }
}
