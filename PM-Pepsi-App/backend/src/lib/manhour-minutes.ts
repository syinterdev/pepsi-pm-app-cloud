/** Business rules for manhour summary and HR / tbmanhours APIs */

export function formatUntimeUnit(untime: string | number | null | undefined): 'H' | 'MIN' {
  if (untime == null || untime === '') return 'MIN'
  return String(untime).trim().toUpperCase() === 'H' ? 'H' : 'MIN'
}

export function workValueToMinutes(
  value: number,
  untime: string | number | null | undefined,
): number {
  const n = Number.isFinite(value) ? value : 0
  return formatUntimeUnit(untime) === 'H' ? n * 60 : n
}

export function manhourSummaryW(row: {
  wh: number
  ot1: number
  ot15: number
  ot1hol: number
  ot2: number
  ot3: number
}): number {
  return row.wh + row.ot1 + row.ot15 + row.ot1hol + row.ot2 + row.ot3
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

export function manhourDateWhereSql(singleDay: boolean): string {
  if (singleDay) {
    return `(bscstart = $2 OR cday = $2)`
  }
  return `(
    (bscstart IS NOT NULL AND bscstart >= $2 AND bscstart < $3)
    OR (cday IS NOT NULL AND cday >= $2 AND cday < $3)
  )`
}
