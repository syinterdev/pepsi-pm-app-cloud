import type { SummaryWeeklyRow } from '@/api/schemas'
import { i18n } from '@/i18n'
import { format, startOfMonth, subDays } from 'date-fns'

/** ป้ายแกน X แบบ Excel: `PAC010 (Narit)` */
export function formatEngUtilizationLabel(
  wkctr: string,
  displayName: string | null | undefined,
): string {
  if (!displayName?.trim()) return wkctr
  const first = displayName.trim().split(/\s+/)[0]
  return first ? `${wkctr} (${first})` : wkctr
}

/** Total ใน Excel = %PM + %Reactive (ไม่รวม RCA) — ค่า 0–100 */
export function excelStylePercentTotal(percentPm: number, percentReactive: number): number {
  return Math.round((percentPm + percentReactive) * 100) / 100
}

export type EngUtilizationChartRow = {
  idwkctr: string
  label: string
  wkctr: string
  hasImage: boolean
  percentPm: number
  percentReactive: number
  percentRca: number
  percentTotalExcel: number
  pmHours: number
  reactiveHours: number
  rcaHours: number
  hrHour: number
  otHour: number
  woCount: number
}

/** ชั่วโมง HR สำหรับแสดงบนการ์ด — ทศนิยม 1 ตำแหน่ง */
export function formatEngUtilizationHrHour(hrHour: number): string {
  const locale = i18n.language === 'th' ? 'th-TH' : 'en-US'
  return hrHour.toLocaleString(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  })
}

export function toEngUtilizationChartRows(rows: SummaryWeeklyRow[]): EngUtilizationChartRow[] {
  return rows
    .filter((r) => r.hrHour > 0)
    .map((r) => ({
      idwkctr: r.idwkctr,
      label: formatEngUtilizationLabel(r.wkctr, r.displayName),
      wkctr: r.wkctr,
      hasImage: r.hasImage,
      percentPm: r.percentPm,
      percentReactive: r.percentReactive,
      percentRca: r.percentRca,
      percentTotalExcel: excelStylePercentTotal(r.percentPm, r.percentReactive),
      pmHours: r.pmHours,
      reactiveHours: r.reactiveHours,
      rcaHours: r.rcaWork,
      hrHour: r.hrHour,
      otHour: r.otHour,
      woCount: r.woCount,
    }))
}

export type EngUtilizationPeriodId = 'daily' | 'weekly' | 'monthly' | 'yearly'

export type EngUtilizationPeriodPreset = {
  id: EngUtilizationPeriodId
  label: string
  hint: string
}

/** ปีเต็มสำหรับปุ่ม「รายปี」— ปีปฏิทินก่อนหน้าของวันอ้างอิง (เช่น 2026 → 2025) */
export function engUtilizationFullYear(refDate: Date = new Date()): number {
  return refDate.getFullYear() - 1
}

export function resolveEngUtilizationDateRange(
  periodId: EngUtilizationPeriodId,
  refDate: Date = new Date(),
): { from: string; to: string } {
  let from: Date
  let to: Date
  switch (periodId) {
    case 'daily': {
      const yesterday = subDays(refDate, 1)
      from = yesterday
      to = yesterday
      break
    }
    case 'weekly':
      from = subDays(refDate, 6)
      to = refDate
      break
    case 'monthly':
      from = startOfMonth(refDate)
      to = refDate
      break
    case 'yearly': {
      const y = engUtilizationFullYear(refDate)
      from = new Date(y, 0, 1)
      to = new Date(y, 11, 31)
      break
    }
  }
  return {
    from: format(from, 'yyyy-MM-dd'),
    to: format(to, 'yyyy-MM-dd'),
  }
}

/** Year-range hint for Eng Utilization yearly preset */
export function engUtilizationYearlyHint(refDate: Date = new Date()): string {
  const y = engUtilizationFullYear(refDate)
  return i18n.t('engUtil.period.yearlyDetail', { ns: 'reports', year: y })
}
