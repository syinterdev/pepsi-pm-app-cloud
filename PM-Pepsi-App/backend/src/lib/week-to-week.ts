export type WeekToWeekRow = {
  weekLabel: string
  prevWeekLabel: string
  utilization: number
  utilizationPrev: number
  utilizationDelta: number
  backlogHours: number
  backlogHoursPrev: number
  backlogDelta: number
}

/** เปรียบเทียบสัปดาห์ต่อสัปดาห์จาก KPI arrays (Pepsi week labels) */
export function buildWeekToWeek(
  labels: string[],
  utilization: number[],
  backlogHours: number[],
): WeekToWeekRow[] {
  const rows: WeekToWeekRow[] = []
  for (let i = 1; i < labels.length; i++) {
    const util = utilization[i] ?? 0
    const utilPrev = utilization[i - 1] ?? 0
    const bl = backlogHours[i] ?? 0
    const blPrev = backlogHours[i - 1] ?? 0
    rows.push({
      weekLabel: labels[i]!,
      prevWeekLabel: labels[i - 1]!,
      utilization: util,
      utilizationPrev: utilPrev,
      utilizationDelta: Math.round((util - utilPrev) * 100) / 100,
      backlogHours: bl,
      backlogHoursPrev: blPrev,
      backlogDelta: Math.round((bl - blPrev) * 100) / 100,
    })
  }
  return rows
}
