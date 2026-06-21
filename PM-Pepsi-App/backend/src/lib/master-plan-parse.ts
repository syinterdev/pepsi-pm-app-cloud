import XLSX from 'xlsx'

export type MasterPlanDiscipline = 'EE' | 'ME' | 'PK'

export type ParsedMasterPlanRow = {
  rowIndex: number
  cells: Record<string, string>
}

export type ParsedMasterPlanSheet = {
  sheetName: string
  sortOrder: number
  titleRows: string[][]
  columnHeaders: string[]
  headerRowIndex: number | null
  sheetKind: 'detail' | 'summary' | 'legend' | 'reference'
  rows: ParsedMasterPlanRow[]
}

export type ParsedMasterPlanWorkbook = {
  discipline: MasterPlanDiscipline
  sourceFilename: string
  sheets: ParsedMasterPlanSheet[]
}

export const MASTER_PLAN_FILES: Record<MasterPlanDiscipline, string> = {
  EE: '01-MASTER PM PROCESS EE 2026.xlsx',
  ME: '02-MASTER PM PROCESS ME 2026.xlsx',
  PK: '03-MASTER PM PACKING 2026.xlsx',
}

/** Infer EE / ME / PK from customer Excel filename (import guard). */
export function inferDisciplineFromFilename(filename: string): MasterPlanDiscipline | null {
  const n = filename.trim().toLowerCase().replace(/\\/g, '/')
  const base = n.includes('/') ? (n.split('/').pop() ?? n) : n
  if (/packing|\bpk\b|master pm packing|^03-/.test(base)) return 'PK'
  if (/process me|\bme\b|master pm process me|^02-/.test(base)) return 'ME'
  if (/process ee|\bee\b|master pm process ee|^01-/.test(base)) return 'EE'
  return null
}

function normHeader(v: unknown): string {
  return String(v ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

function cellStr(v: unknown): string {
  if (v == null) return ''
  if (typeof v === 'number' && Number.isFinite(v)) return String(Math.trunc(v))
  return String(v).trim()
}

function rowHasContent(row: unknown[]): boolean {
  return row.some((c) => cellStr(c) !== '')
}

function findHeaderRow(values: unknown[][]): { rowIndex: number; headers: string[] } | null {
  for (let i = 0; i < Math.min(values.length, 25); i++) {
    const row = values[i] ?? []
    const headers = row.map((c) => cellStr(c))
    const normalized = headers.map(normHeader)
    const hasZone = normalized.some((h) => h === 'zone')
    const hasPmList = normalized.some((h) => h.includes('pm list'))
    if (hasZone && hasPmList) return { rowIndex: i, headers }
  }
  return null
}

function classifySheetKind(sheetName: string, hasDetailHeader: boolean): ParsedMasterPlanSheet['sheetKind'] {
  const name = sheetName.trim()
  if (/^legend$/i.test(name)) return 'legend'
  if (/total master plan/i.test(name)) return 'summary'
  if (/stopped|new standard/i.test(name)) return 'reference'
  if (!hasDetailHeader) return 'summary'
  return 'detail'
}

function parseDetailRows(
  values: unknown[][],
  headerIndex: number,
  headers: string[],
): ParsedMasterPlanRow[] {
  const out: ParsedMasterPlanRow[] = []
  for (let r = headerIndex + 1; r < values.length; r++) {
    const row = values[r] ?? []
    if (!rowHasContent(row)) continue
    const cells: Record<string, string> = {}
    for (let c = 0; c < headers.length; c++) {
      const header = headers[c]
      if (!header) continue
      cells[header] = cellStr(row[c])
    }
    out.push({ rowIndex: r, cells })
  }
  return out
}

function parseGenericRows(values: unknown[][]): ParsedMasterPlanRow[] {
  const out: ParsedMasterPlanRow[] = []
  for (let r = 0; r < values.length; r++) {
    const row = values[r] ?? []
    if (!rowHasContent(row)) continue
    const cells: Record<string, string> = {}
    for (let c = 0; c < row.length; c++) {
      const v = cellStr(row[c])
      if (v) cells[`col${c}`] = v
    }
    out.push({ rowIndex: r, cells })
  }
  return out
}

export function parseMasterPlanSheet(values: unknown[][], sheetName: string, sortOrder: number): ParsedMasterPlanSheet {
  const header = findHeaderRow(values)
  const sheetKind = classifySheetKind(sheetName, header != null)

  if (header && sheetKind === 'detail') {
    const titleRows = values
      .slice(0, header.rowIndex)
      .map((row) => (row ?? []).map(cellStr))
      .filter(rowHasContent)
    const columnHeaders = header.headers.filter((h) => h !== '')
    return {
      sheetName,
      sortOrder,
      titleRows,
      columnHeaders,
      headerRowIndex: header.rowIndex,
      sheetKind,
      rows: parseDetailRows(values, header.rowIndex, header.headers),
    }
  }

  return {
    sheetName,
    sortOrder,
    titleRows: [],
    columnHeaders: [],
    headerRowIndex: null,
    sheetKind,
    rows: parseGenericRows(values),
  }
}

export function parseMasterPlanWorkbook(
  buffer: Buffer,
  discipline: MasterPlanDiscipline,
  sourceFilename?: string,
): ParsedMasterPlanWorkbook {
  const wb = XLSX.read(buffer, { type: 'buffer', cellDates: false })
  const sheets: ParsedMasterPlanSheet[] = []

  wb.SheetNames.forEach((name, index) => {
    const ws = wb.Sheets[name]
    if (!ws) return
    const values = XLSX.utils.sheet_to_json(ws, {
      header: 1,
      blankrows: false,
      defval: '',
    }) as unknown[][]
    sheets.push(parseMasterPlanSheet(values, name, index))
  })

  return {
    discipline,
    sourceFilename: sourceFilename ?? MASTER_PLAN_FILES[discipline],
    sheets,
  }
}
