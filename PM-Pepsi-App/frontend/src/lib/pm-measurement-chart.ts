import type { WoPmReading } from '@/api/schemas'

export type PmReadingKind = WoPmReading['kind']

export type PmChartPoint = {
  label: string
  v1: number
  v2: number
  v3: number
}

export function filterReadingsForTask(
  readings: WoPmReading[],
  machine: string,
  pmlist: string,
  kind?: PmReadingKind,
): WoPmReading[] {
  return readings.filter((r) => {
    if (r.machine !== machine || r.pmlist !== pmlist) return false
    if (kind != null && r.kind !== kind) return false
    return true
  })
}

export function readingsToChartPoints(readings: WoPmReading[]): PmChartPoint[] {
  return readings.map((r) => {
    const d = new Date(r.measuredAt)
    const label = Number.isNaN(d.getTime())
      ? r.measuredAt.slice(0, 16)
      : `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    return { label, v1: r.v1, v2: r.v2, v3: r.v3 ?? 0 }
  })
}
