/** ป้าย Available hour ในแท็บ Planning — ข้อมูลจาก modal-detail API */

export type PlanningWorkcenterHours = {
  wkctr: string
  displayName: string
  hrHours?: number | null
  plannedHours?: number | null
  availableHours?: number | null
  shiftTags?: ('AA' | 'BB')[]
  craftTags?: ('EE' | 'UT')[]
}

export function formatPlanningHourValue(hours: number | null | undefined): string {
  if (hours == null || !Number.isFinite(hours)) return '—'
  const rounded = Math.round(hours * 10) / 10
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
}

/** บรรทัดย่อใต้การ์ดช่าง เช่น "ว่าง 5.0 ชม. (HR 8 − แผน 3)" */
export function formatPlanningAvailableLine(w: PlanningWorkcenterHours): string | null {
  if (w.hrHours == null && w.plannedHours == null && w.availableHours == null) return null
  if (w.hrHours == null) {
    if (w.plannedHours != null && w.plannedHours > 0) {
      return `แผนแล้ว ${formatPlanningHourValue(w.plannedHours)} ชม. (ไม่มีข้อมูล HR)`
    }
    return null
  }
  const avail = formatPlanningHourValue(w.availableHours ?? 0)
  const hr = formatPlanningHourValue(w.hrHours)
  const planned = formatPlanningHourValue(w.plannedHours ?? 0)
  return `ว่าง ${avail} ชม. · HR ${hr} − แผน ${planned}`
}
