/** สัปดาห์ทำงาน Pepsi — สัปดาห์ที่ 1 เริ่ม 1 มกราคม (ไม่ใช่ ISO 8601) */
export const PEPSI_WORK_WEEK_TZ = 'Asia/Bangkok'

export type PepsiWorkWeek = {
  year: number
  week: number
  /** เช่น `2026-W03` */
  label: string
}

/** วันที่ (ค.ศ.) ใน timezone กรุงเทพ → สัปดาห์ที่เท่าไร */
export function pepsiWorkWeekFromYmd(year: number, month: number, day: number): PepsiWorkWeek {
  const doy = dayOfYear(year, month, day)
  const week = Math.floor((doy - 1) / 7) + 1
  return {
    year,
    week,
    label: formatPepsiWorkWeekLabel(year, week),
  }
}

export function formatPepsiWorkWeekLabel(year: number, week: number): string {
  return `${year}-W${String(week).padStart(2, '0')}`
}

/** unix epoch (วินาที) → สัปดาห์ Pepsi ตาม Asia/Bangkok */
export function pepsiWorkWeekFromUnix(unixSec: number): PepsiWorkWeek {
  const parts = bangkokYmdParts(unixSec)
  return pepsiWorkWeekFromYmd(parts.year, parts.month, parts.day)
}

/** ช่วงวันเริ่ม–สิ้นสุดของสัปดาห์ที่ n ในปี y (สำหรับแสดงใน UI) */
export function pepsiWorkWeekDateRange(year: number, week: number): { start: Date; end: Date } {
  const startDoy = (week - 1) * 7 + 1
  const endDoy = Math.min(startDoy + 6, daysInYear(year))
  return {
    start: ymdToUtcDate(year, doyToMonthDay(year, startDoy)),
    end: ymdToUtcDate(year, doyToMonthDay(year, endDoy)),
  }
}

/** ข้อความไทยสั้นๆ สำหรับ legend */
export function describePepsiWorkWeekLabel(label: string): string {
  const m = /^(\d{4})-W(\d{2})$/.exec(label)
  if (!m) return label
  const year = Number(m[1])
  const week = Number(m[2])
  const { start, end } = pepsiWorkWeekDateRange(year, week)
  const fmt = new Intl.DateTimeFormat('th-TH', {
    timeZone: PEPSI_WORK_WEEK_TZ,
    day: 'numeric',
    month: 'short',
  })
  return `สัปดาห์ที่ ${week}/${year} (${fmt.format(start)} – ${fmt.format(end)})`
}

/**
 * SQL expression สำหรับคอลัมน์ unix epoch (วินาที) → label `YYYY-Wnn`
 * ใช้ใน GROUP BY รายงาน / manhours
 */
export function pepsiWorkWeekSql(unixEpochExpr: string): string {
  const dt = `(to_timestamp(${unixEpochExpr}) AT TIME ZONE '${PEPSI_WORK_WEEK_TZ}')::date`
  return `(
    EXTRACT(YEAR FROM ${dt})::text || '-W' ||
    LPAD((FLOOR((EXTRACT(DOY FROM ${dt})::int - 1) / 7) + 1)::text, 2, '0')
  )`
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

function bangkokYmdParts(unixSec: number): { year: number; month: number; day: number } {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: PEPSI_WORK_WEEK_TZ,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  })
  const parts = fmt.formatToParts(new Date(unixSec * 1000))
  const year = Number(parts.find((p) => p.type === 'year')?.value)
  const month = Number(parts.find((p) => p.type === 'month')?.value)
  const day = Number(parts.find((p) => p.type === 'day')?.value)
  return { year, month, day }
}
