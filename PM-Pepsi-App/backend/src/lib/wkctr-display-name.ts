export type WkctrNameRow = {
  titlewkctr: string | null
  namewkctr: string | null
  surnamewkctr: string | null
  titlewkctreng: string | null
  namewkctreng: string | null
  surnamewkctreng: string | null
}

export function displayNameFromWkctrRow(row: WkctrNameRow): string {
  const th = [row.titlewkctr, row.namewkctr, row.surnamewkctr].filter(Boolean).join(' ').trim()
  if (th) return th
  return [row.titlewkctreng, row.namewkctreng, row.surnamewkctreng].filter(Boolean).join(' ').trim()
}

export function formatDdMmYyyyFromDate(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${dd}.${mm}.${d.getFullYear()}`
}

export function formatDdMmYyyyFromEpochSeconds(sec: number): string {
  return formatDdMmYyyyFromDate(new Date(sec * 1000))
}
