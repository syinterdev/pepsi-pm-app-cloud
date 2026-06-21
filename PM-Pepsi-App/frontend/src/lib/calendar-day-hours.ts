/** ป้ายรวมชั่วโมงในช่องวัน — เทียบสไลด์ลูกค้า "0.5 Hour" */
export function formatCalendarDayHourLabel(hours: number): string {
  if (!Number.isFinite(hours) || hours <= 0) return ''
  const rounded = Math.round(hours * 10) / 10
  const n = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
  return `${n} Hour`
}

function formatHourSuffix(hours: number): string {
  const rounded = Math.round(hours * 10) / 10
  const n = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
  const unit = rounded === 1 ? 'Hr' : 'Hrs'
  return `${n} ${unit}`
}

/** 4.2 — จำนวน WO + ชั่วโมงรวม (แผน + confirm) มุมซ้ายช่องวัน */
export function formatCalendarDayCellSummary(orderCount: number, hours: number): string {
  const parts: string[] = []
  if (orderCount > 0) parts.push(`${orderCount} WO`)
  if (Number.isFinite(hours) && hours > 0) parts.push(formatHourSuffix(hours))
  return parts.join(' ')
}
