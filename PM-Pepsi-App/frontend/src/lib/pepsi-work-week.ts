/** สัปดาห์ทำงาน Pepsi — สอดคล้อง backend `pepsi-work-week.ts` */

export function formatPepsiWorkWeekLabel(year: number, week: number): string {
  return `${year}-W${String(week).padStart(2, '0')}`
}

export function pepsiWorkWeekFromYmd(year: number, month: number, day: number): {
  year: number
  week: number
  label: string
} {
  const doy = dayOfYear(year, month, day)
  const week = Math.floor((doy - 1) / 7) + 1
  return { year, week, label: formatPepsiWorkWeekLabel(year, week) }
}

function dayOfYear(year: number, month: number, day: number): number {
  const ms = Date.UTC(year, month - 1, day) - Date.UTC(year, 0, 0)
  return Math.floor(ms / 86400000)
}

function daysInYear(year: number): number {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 366 : 365
}

function doyToMonthDay(year: number, doy: number): { month: number; day: number } {
  const d = new Date(Date.UTC(year, 0, doy))
  return { month: d.getUTCMonth() + 1, day: d.getUTCDate() }
}

function ymdToUtcDate(year: number, md: { month: number; day: number }): Date {
  return new Date(Date.UTC(year, md.month - 1, md.day, 12, 0, 0))
}

/** ช่วงวันเริ่ม–สิ้นสุดของสัปดาห์ที่ n ในปี y */
export function pepsiWorkWeekDateRange(year: number, week: number): { start: Date; end: Date } {
  const startDoy = (week - 1) * 7 + 1
  const endDoy = Math.min(startDoy + 6, daysInYear(year))
  return {
    start: ymdToUtcDate(year, doyToMonthDay(year, startDoy)),
    end: ymdToUtcDate(year, doyToMonthDay(year, endDoy)),
  }
}

export function utcDateToIso(d: Date): string {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function describePepsiWorkWeekLabel(label: string): string {
  const m = /^(\d{4})-W(\d{2})$/.exec(label)
  if (!m) return label
  const year = Number(m[1])
  const week = Number(m[2])
  const { start, end } = pepsiWorkWeekDateRange(year, week)
  const fmt = new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short' })
  return `สัปดาห์ที่ ${week}/${year} (${fmt.format(start)} – ${fmt.format(end)})`
}

export const PEPSI_WORK_WEEK_HELP =
  'สัปดาห์ทำงานนับจาก 1 ม.ค. = สัปดาห์ที่ 1 (7 วันต่อสัปดาห์ · ไม่ใช่ ISO week)'
