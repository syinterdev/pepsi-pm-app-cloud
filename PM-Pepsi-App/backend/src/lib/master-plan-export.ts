import XLSX from 'xlsx'
import { parseMasterPlanWorkbook, type ParsedMasterPlanWorkbook } from './master-plan-parse.js'

export type MasterPlanExportSheet = {
  sheetName: string
  sortOrder: number
  titleRows: string[][]
  columnHeaders: string[]
  headerRowIndex: number | null
  sheetKind: string
  rows: Array<{ rowIndex: number; cells: Record<string, string> }>
}

export type MasterPlanExportWorkbook = {
  sourceFilename: string
  sheets: MasterPlanExportSheet[]
}

function cellStr(v: unknown): string {
  if (v == null) return ''
  if (typeof v === 'number' && Number.isFinite(v)) return String(Math.trunc(v))
  return String(v).trim()
}

function rowHasContent(row: unknown[]): boolean {
  return row.some((c) => cellStr(c) !== '')
}

/** Build a 2D grid for one sheet — data rows use stored row_index for fidelity. */
export function sheetToAoA(sheet: MasterPlanExportSheet): unknown[][] {
  const indices = sheet.rows.map((r) => r.rowIndex)
  const maxRow = Math.max(sheet.headerRowIndex ?? 0, ...indices, sheet.titleRows.length - 1, 0)
  const grid: unknown[][] = Array.from({ length: maxRow + 1 }, () => [])

  for (let i = 0; i < sheet.titleRows.length; i++) {
    grid[i] = [...sheet.titleRows[i]!]
  }

  if (sheet.headerRowIndex != null && sheet.columnHeaders.length > 0) {
    const hdr = sheet.headerRowIndex
    const line = grid[hdr] ? [...grid[hdr]!] : []
    for (let c = 0; c < sheet.columnHeaders.length; c++) {
      line[c] = sheet.columnHeaders[c] ?? ''
    }
    grid[hdr] = line
  }

  for (const row of sheet.rows) {
    if (sheet.sheetKind === 'detail' && sheet.columnHeaders.length > 0) {
      const line = grid[row.rowIndex] ? [...grid[row.rowIndex]!] : []
      for (let c = 0; c < sheet.columnHeaders.length; c++) {
        const header = sheet.columnHeaders[c]
        if (!header) continue
        const value = row.cells[header]
        if (value != null && value !== '') line[c] = value
      }
      grid[row.rowIndex] = line
      continue
    }

    const line = grid[row.rowIndex] ? [...grid[row.rowIndex]!] : []
    for (const [key, val] of Object.entries(row.cells)) {
      const m = /^col(\d+)$/.exec(key)
      if (m) line[Number(m[1])] = val
    }
    grid[row.rowIndex] = line
  }

  return grid.filter((row, i) => i <= maxRow && rowHasContent(row))
}

export function buildMasterPlanWorkbookBuffer(input: MasterPlanExportWorkbook): Buffer {
  const wb = XLSX.utils.book_new()
  const ordered = [...input.sheets].sort((a, b) => a.sortOrder - b.sortOrder)

  for (const sheet of ordered) {
    const aoa = sheetToAoA(sheet)
    const ws = XLSX.utils.aoa_to_sheet(aoa)
    XLSX.utils.book_append_sheet(wb, ws, sheet.sheetName)
  }

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer
}

export function parsedWorkbookToExportInput(parsed: ParsedMasterPlanWorkbook): MasterPlanExportWorkbook {
  return {
    sourceFilename: parsed.sourceFilename,
    sheets: parsed.sheets.map((s) => ({
      sheetName: s.sheetName,
      sortOrder: s.sortOrder,
      titleRows: s.titleRows,
      columnHeaders: s.columnHeaders,
      headerRowIndex: s.headerRowIndex,
      sheetKind: s.sheetKind,
      rows: s.rows.map((r) => ({ rowIndex: r.rowIndex, cells: r.cells })),
    })),
  }
}

/** Re-parse exported buffer and compare row counts per sheet (round-trip fidelity check). */
export function compareExportRowCounts(
  original: ParsedMasterPlanWorkbook,
  exportedBuffer: Buffer,
  discipline: ParsedMasterPlanWorkbook['discipline'],
): { ok: boolean; mismatches: string[] } {
  const roundTrip = parseMasterPlanWorkbook(exportedBuffer, discipline, original.sourceFilename)
  const mismatches: string[] = []

  for (const sheet of original.sheets) {
    const rt = roundTrip.sheets.find((s) => s.sheetName === sheet.sheetName)
    if (!rt) {
      mismatches.push(`${sheet.sheetName}: missing after export`)
      continue
    }
    if (rt.rows.length !== sheet.rows.length) {
      mismatches.push(`${sheet.sheetName}: rows ${sheet.rows.length} → ${rt.rows.length}`)
    }
  }

  return { ok: mismatches.length === 0, mismatches }
}
