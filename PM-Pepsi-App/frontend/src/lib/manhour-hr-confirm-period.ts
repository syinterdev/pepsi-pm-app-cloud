/** ช่วงเวลา HR vs Confirm — รายเดือน / สัปดาห์ Pepsi */

import { format } from 'date-fns'
import { describePepsiWorkWeekLabel } from './pepsi-work-week'

export type HrConfirmPeriod = 'month' | 'week'

export function defaultHrConfirmMonth(): string {
  return format(new Date(), 'yyyy-MM')
}

/** สัปดาห์ Pepsi ปัจจุบัน — สอดคล้อง backend `pepsiWorkWeekFromYmd` */
export function currentPepsiWorkWeekLabel(): string {
  const d = new Date()
  const year = d.getFullYear()
  const start = new Date(year, 0, 0)
  const doy = Math.floor((d.getTime() - start.getTime()) / 86400000)
  const week = Math.floor((doy - 1) / 7) + 1
  return `${year}-W${String(week).padStart(2, '0')}`
}

export function pepsiWeekSelectOptions(count = 20): { value: string; label: string }[] {
  const out: { value: string; label: string }[] = []
  const d = new Date()
  let year = d.getFullYear()
  let month = d.getMonth() + 1
  let day = d.getDate()
  for (let i = 0; i < count; i++) {
    const start = new Date(year, 0, 0)
    const doy = Math.floor((new Date(year, month - 1, day).getTime() - start.getTime()) / 86400000)
    const week = Math.floor((doy - 1) / 7) + 1
    const value = `${year}-W${String(week).padStart(2, '0')}`
    out.push({ value, label: describePepsiWorkWeekLabel(value) })
    day -= 7
    if (day < 1) {
      month -= 1
      if (month < 1) {
        month = 12
        year -= 1
      }
      day = new Date(year, month, 0).getDate() + day
    }
  }
  return out
}

export function formatHrConfirmMonthLabel(yyyyMm: string): string {
  const m = /^(\d{4})-(\d{2})$/.exec(yyyyMm.trim())
  if (!m) return yyyyMm
  const fmt = new Intl.DateTimeFormat('th-TH', { month: 'long', year: 'numeric' })
  return fmt.format(new Date(Number(m[1]), Number(m[2]) - 1, 1))
}
