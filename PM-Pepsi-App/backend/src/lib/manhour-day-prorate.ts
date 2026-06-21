/** แบ่งชม. manhour (stworkday–workday) ตามสัดส่วนวันปฏิทินที่ทับกับวันที่เลือก */

const SEC_PER_DAY = 86400

/** เริ่มต้นวันปฏิทิน (local) จาก unix sec */
export function calendarDayStartSec(unixSec: number): number {
  const d = new Date(unixSec * 1000)
  return Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 1000)
}

/** จำนวนวันปฏิทินแบบรวมปลาย (inclusive) ระหว่าง stworkday กับ workday */
export function manhourInclusivePeriodDays(stworkday: number, workday: number): number {
  const start = calendarDayStartSec(Math.min(stworkday, workday))
  const end = calendarDayStartSec(Math.max(stworkday, workday))
  const days = Math.floor((end - start) / SEC_PER_DAY) + 1
  return days > 0 ? days : 1
}

/** จำนวนวันปฏิทิน (inclusive) ของช่วง manhour ที่ทับกับ [dayStart, dayEnd) */
export function manhourOverlapDaysOnTarget(
  stworkday: number,
  workday: number,
  dayStart: number,
  dayEnd: number,
): number {
  const periodStart = calendarDayStartSec(Math.min(stworkday, workday))
  const periodEndExclusive = calendarDayStartSec(Math.max(stworkday, workday)) + SEC_PER_DAY
  const overlapStart = Math.max(periodStart, dayStart)
  const overlapEnd = Math.min(periodEndExclusive, dayEnd)
  if (overlapEnd <= overlapStart) return 0
  return Math.floor((overlapEnd - overlapStart) / SEC_PER_DAY)
}

/**
 * ชม.ที่จัดสรรให้วันเป้าหมาย = ชม.รวมแถว × (วันทับ / วันในช่วง manhour)
 */
export function prorateManhourHoursToDay(
  totalHours: number,
  stworkday: number,
  workday: number,
  dayStart: number,
  dayEnd: number,
): number {
  if (!Number.isFinite(totalHours) || totalHours <= 0) return 0
  const periodDays = manhourInclusivePeriodDays(stworkday, workday)
  const overlapDays = manhourOverlapDaysOnTarget(stworkday, workday, dayStart, dayEnd)
  if (overlapDays <= 0 || periodDays <= 0) return 0
  return (totalHours * overlapDays) / periodDays
}
