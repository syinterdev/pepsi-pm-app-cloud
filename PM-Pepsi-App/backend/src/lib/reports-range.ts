import { pepsiWorkWeekFromUnix } from './pepsi-work-week.js'
import { parseWorkday } from '../services/manhours.js'

export type ReportsDateRange = {
  from: number
  to: number
  fromDate: string
  toDate: string
}

function unixToIsoDate(sec: number): string {
  const d = new Date(sec * 1000)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function defaultRange(weeksBack: number): ReportsDateRange {
  const end = new Date()
  end.setHours(23, 59, 59, 999)
  const start = new Date(end)
  start.setDate(start.getDate() - weeksBack * 7)
  start.setHours(0, 0, 0, 0)
  const from = Math.floor(start.getTime() / 1000)
  const to = Math.floor(end.getTime() / 1000)
  return { from, to, fromDate: unixToIsoDate(from), toDate: unixToIsoDate(to) }
}

/** ช่วงวันที่รายงาน — รับ `from`/`to` (yyyy-mm-dd / dd.mm.yyyy) หรือ `weeksBack` */
export function resolveReportsRange(opts: {
  fromInput?: string
  toInput?: string
  weeksBack?: number
}): ReportsDateRange {
  if (opts.fromInput?.trim() && opts.toInput?.trim()) {
    const from = parseWorkday(opts.fromInput.trim())
    const to = parseWorkday(opts.toInput.trim())
    if (to < from) throw new Error('to must be >= from')
    return { from, to, fromDate: unixToIsoDate(from), toDate: unixToIsoDate(to) }
  }
  const weeks = Math.max(4, Math.min(16, opts.weeksBack ?? 8))
  return defaultRange(weeks)
}

/** ป้ายสัปดาห์ในช่วงรายงาน — Pepsi: สัปดาห์ 1 = 1 ม.ค. */
export function weekLabelsInRange(range: ReportsDateRange): string[] {
  const labels: string[] = []
  const seen = new Set<string>()
  const cursor = new Date(range.from * 1000)
  const end = new Date(range.to * 1000)
  while (cursor <= end) {
    const label = pepsiWorkWeekFromUnix(Math.floor(cursor.getTime() / 1000)).label
    if (!seen.has(label)) {
      seen.add(label)
      labels.push(label)
    }
    cursor.setDate(cursor.getDate() + 1)
  }
  return labels.length ? labels : [pepsiWorkWeekFromUnix(range.from).label]
}

export function safeRatio(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0
  return Math.round((numerator / denominator) * 10000) / 100
}

export function computeSummaryWeeklyPercents(
  hrHour: number,
  pmHours: number,
  reaHours: number,
  rcaHours: number,
) {
  const percentPm = safeRatio(pmHours, hrHour)
  const percentReactive = safeRatio(reaHours, hrHour)
  const percentRca = safeRatio(rcaHours, hrHour)
  return {
    percentPm,
    percentReactive,
    percentRca,
    percentTotal: Math.round((percentPm + percentReactive + percentRca) * 100) / 100,
  }
}
