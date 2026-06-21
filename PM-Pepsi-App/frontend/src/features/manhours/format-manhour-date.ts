/** แสดงวันที่แบบ legacy PHP `date("d.m.Y", unix)` */
export function formatManhourDate(iso: string | null | undefined, unixSec?: number): string {
  const d =
    iso && /^\d{4}-\d{2}-\d{2}$/.test(iso)
      ? new Date(`${iso}T12:00:00`)
      : unixSec && unixSec > 0
        ? new Date(unixSec * 1000)
        : null
  if (!d || Number.isNaN(d.getTime())) return '—'
  const day = String(d.getDate()).padStart(2, '0')
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${day}.${m}.${d.getFullYear()}`
}

export function manhourOtNet(row: {
  ot1: number
  ot15: number
  ot1hol: number
  ot2: number
  ot3: number
}): number {
  return row.ot1 + row.ot15 + row.ot1hol + row.ot2 + row.ot3
}
