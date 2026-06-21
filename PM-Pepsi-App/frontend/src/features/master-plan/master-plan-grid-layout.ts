import { tableStickyClass } from '@/components/ui/table'

export type MasterPlanGridRow = {
  rowIndex: number
  cells: Record<string, string>
  display: Record<string, string>
}

const ROWSPAN_PATTERNS = [
  /^zone$/i,
  /machine list/i,
  /^min$/i,
  /^man$/i,
  /man hour/i,
]

export function shouldRowspanColumn(header: string): boolean {
  const h = header.trim()
  return ROWSPAN_PATTERNS.some((re) => re.test(h))
}

/** Fill-down anchor columns — read-only in Phase 2 inline edit. */
export function isMasterPlanFillDownAnchorColumn(header: string): boolean {
  const h = header.trim()
  return /^zone$/i.test(h) || /machine list/i.test(h)
}

export function isMasterPlanCellEditable(
  sheetKind: string,
  column: string,
  canWrite: boolean,
): boolean {
  if (!canWrite) return false
  if (sheetKind !== 'detail') return false
  if (isMasterPlanFillDownAnchorColumn(column)) return false
  return true
}

/** Excel-like vertical merge: anchor row has raw value; followers empty with same display. */
export function computeColumnRowspans(
  rows: MasterPlanGridRow[],
  column: string,
): Array<number | 'skip'> {
  const out: Array<number | 'skip'> = new Array(rows.length).fill(1)
  if (!shouldRowspanColumn(column)) return out

  let i = 0
  while (i < rows.length) {
    const anchor = rows[i]
    const anchorDisplay = (anchor.display[column] ?? '').trim()
    if (!anchorDisplay) {
      out[i] = 1
      i++
      continue
    }

    let span = 1
    while (i + span < rows.length) {
      const next = rows[i + span]
      const rawEmpty = !(next.cells[column] ?? '').trim()
      const sameDisplay = (next.display[column] ?? '').trim() === anchorDisplay
      if (rawEmpty && sameDisplay) span++
      else break
    }

    out[i] = span
    for (let k = 1; k < span; k++) out[i + k] = 'skip'
    i += span
  }

  return out
}

export function extractSheetBannerTitle(titleRows: string[][]): string | null {
  for (const row of titleRows) {
    for (const cell of row) {
      const t = cell.trim()
      if (/master plan/i.test(t)) return t
    }
  }
  const first = titleRows.flat().find((c) => c.trim())
  return first?.trim() ?? null
}

export function extractSheetMetaLines(titleRows: string[][]): string[] {
  const lines: string[] = []
  for (const row of titleRows) {
    const parts = row.map((c) => c.trim()).filter(Boolean)
    if (parts.length === 0) continue
    const joined = parts.join(' · ')
    if (/master plan/i.test(joined)) continue
    if (!lines.includes(joined)) lines.push(joined)
  }
  return lines
}

export function isGenericColumnKey(header: string): boolean {
  return /^col\d+$/.test(header.trim())
}

export function isGenericSheetLayout(columns: string[]): boolean {
  return columns.length > 0 && columns.every(isGenericColumnKey)
}

export type GenericSheetSection = {
  startCol: number
  columns: string[]
  rows: string[][]
}

/** Split col0/col1/… matrix into side-by-side blocks separated by empty columns. */
export function splitGenericSheetSections(
  rows: MasterPlanGridRow[],
  columns: string[],
): GenericSheetSection[] {
  if (columns.length === 0 || rows.length === 0) return []

  const maxIdx = columns.reduce((max, key) => Math.max(max, Number(key.slice(3))), 0)
  const colKeys = Array.from({ length: maxIdx + 1 }, (_, i) => `col${i}`)
  const matrix = rows.map((row) =>
    colKeys.map((key) => String(row.display[key] ?? row.cells[key] ?? '').trim()),
  )

  const isEmptyCol = (colIdx: number) => matrix.every((row) => !row[colIdx])

  const sections: GenericSheetSection[] = []
  let start = 0
  for (let c = 0; c <= maxIdx; c++) {
    if (!isEmptyCol(c)) continue
    if (c > start) {
      sections.push(buildGenericSection(start, c - 1, colKeys, matrix))
    }
    start = c + 1
  }
  if (start <= maxIdx) {
    sections.push(buildGenericSection(start, maxIdx, colKeys, matrix))
  }

  return sections.filter((s) => s.columns.length > 0 && s.rows.some((r) => r.some(Boolean)))
}

function buildGenericSection(
  start: number,
  end: number,
  colKeys: string[],
  matrix: string[][],
): GenericSheetSection {
  const indices = Array.from({ length: end - start + 1 }, (_, i) => start + i)
  return {
    startCol: start,
    columns: indices.map((i) => colKeys[i]),
    rows: matrix.map((row) => indices.map((i) => row[i])),
  }
}

const COLUMN_WIDTH_RULES: Array<{ pattern: RegExp; className: string }> = [
  { pattern: /^zone$/i, className: 'w-[4.5rem] min-w-[4.5rem] max-w-[5.5rem]' },
  { pattern: /machine list/i, className: 'w-[8rem] min-w-[8rem] max-w-[10rem]' },
  { pattern: /pm list/i, className: 'min-w-[17.5rem] max-w-xl whitespace-normal' },
  {
    pattern: /sap code|mnt plan|task list|legacy|^machine$/i,
    className: 'min-w-[4.5rem] max-w-[7rem]',
  },
  {
    pattern: /^min$|^man$|man hour|pm day|pm min|freq|runhr|mpoint|gls|act code|craft|type|frequency/i,
    className: 'w-[3.25rem] min-w-[3.25rem] max-w-[4.5rem] tabular-nums text-center',
  },
  {
    pattern: /machinestatus|stop|run|pm day/i,
    className: 'min-w-[3.5rem] max-w-[5rem] text-center',
  },
]

export function masterPlanColumnWidthClass(column: string): string {
  const header = column.trim()
  for (const rule of COLUMN_WIDTH_RULES) {
    if (rule.pattern.test(header)) return rule.className
  }
  return 'min-w-[4rem] max-w-[12rem]'
}

export function masterPlanStickyColumn(column: string, columns: string[]): 1 | 2 | null {
  const idx = columns.indexOf(column)
  if (idx < 0) return null
  const zoneIdx = columns.findIndex((c) => /^zone$/i.test(c.trim()))
  const machineIdx = columns.findIndex((c) => /machine list/i.test(c.trim()))
  if (zoneIdx >= 0 && idx === zoneIdx) return 1
  if (machineIdx >= 0 && idx === machineIdx) return 2
  return null
}

export function masterPlanColumnCellClass(column: string, columns: string[]): string {
  const width = masterPlanColumnWidthClass(column)
  const sticky = masterPlanStickyColumn(column, columns)
  const stickyClass =
    sticky != null
      ? `${tableStickyClass(sticky)} bg-inherit ${sticky === 1 ? 'font-medium' : ''}`
      : ''
  const isPmList = /pm list/i.test(column)
  const wrap = isPmList ? '' : 'whitespace-nowrap'
  return `${width} ${stickyClass} ${wrap}`.trim()
}
