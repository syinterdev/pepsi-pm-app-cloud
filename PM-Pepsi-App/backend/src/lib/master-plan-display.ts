export type MasterPlanDisplayRow = {
  rowIndex: number
  cells: Record<string, string>
  display: Record<string, string>
}

/** Columns that Excel merges vertically — empty cells inherit from row above. */
const FILL_DOWN_PATTERNS = [
  /^zone$/i,
  /machine list/i,
  /^min$/i,
  /^man$/i,
  /man hour/i,
]

function shouldFillDown(header: string): boolean {
  return FILL_DOWN_PATTERNS.some((re) => re.test(header.trim()))
}

export function applyFillDownDisplay(
  rows: { rowIndex: number; cells: Record<string, string> }[],
  columnHeaders: string[],
): MasterPlanDisplayRow[] {
  const last: Record<string, string> = {}

  return rows.map((row) => {
    const display: Record<string, string> = { ...row.cells }
    for (const header of columnHeaders) {
      if (!shouldFillDown(header)) continue
      const raw = row.cells[header] ?? ''
      if (raw) {
        last[header] = raw
        display[header] = raw
      } else if (last[header]) {
        display[header] = last[header]
      } else {
        display[header] = ''
      }
    }
    return { rowIndex: row.rowIndex, cells: row.cells, display }
  })
}

export function displayColumnsForSheet(
  sheetKind: string,
  columnHeaders: string[],
  rows: { cells: Record<string, string> }[],
): string[] {
  /** Fidelity (D2): return Excel headers verbatim — never translate or normalize labels. */
  if (columnHeaders.length > 0) return columnHeaders
  const maxCol = rows.reduce((max, row) => {
    const keys = Object.keys(row.cells)
      .filter((k) => /^col\d+$/.test(k))
      .map((k) => Number(k.slice(3)))
    return Math.max(max, ...keys, -1)
  }, -1)
  if (maxCol < 0) return []
  return Array.from({ length: maxCol + 1 }, (_, i) => `col${i}`)
}
