import * as XLSX from 'xlsx'
import {
  buildIw37nColumnMap,
  cellAt,
  type Iw37nColumnMap,
} from './iw37n-column-map.js'
import { ensureFactoryScopeFunctionalloc } from './iw37n-factory-scope.js'

/** แมปคอลัมน์ Excel ตาม IW37N import ($Row[0]..$Row[18]) */
export type Iw37nImportRow = {
  mntplan: string
  wkorder: string
  wktype: string
  mat: string
  bscstart: number | null
  actfinish: number | null
  systemstatus: string
  syst: string
  opac: string
  operationshorttext: string
  ostdescription: string
  cknow: string
  wkctr: string
  work: number | null
  actwork: number | null
  untime: number | null
  equipment: string
  equdescrip: string
  functionalloc: string
  funcdescrip: string
}

/** SAP ALV export (Dynamic List Display, col S + offset) vs แถว header เดียวแบบ PHP เดิม */
export type Iw37nLayout = 'legacy' | 'sap_alv'

export type Iw37nParseResult = {
  layout: Iw37nLayout
  rows: Iw37nImportRow[]
  /** SAP ALV ไม่มีคอลัมน์ Functional loc. (รหัส) — ใส่ prefix 7151- ตอน import */
  missingFunctionalLocCode?: boolean
}

function cellStr(v: unknown): string {
  if (v == null) return ''
  if (typeof v === 'number') return String(v)
  return String(v).trim()
}

/** dd.mm.yyyy → unix วินาที () */
export function parseDdMmYyyy(value: string): number | null {
  const t = value.trim()
  if (!t) return null
  const parts = t.split(/[./-]/)
  if (parts.length < 3) return null
  const day = Number(parts[0])
  const month = Number(parts[1])
  let year = Number(parts[2])
  if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year)) {
    return null
  }
  if (year < 100) year += 2000
  const d = new Date(year, month - 1, day, 0, 0, 0, 0)
  const sec = Math.floor(d.getTime() / 1000)
  return sec > 0 ? sec : null
}

/** Excel serial (legacy .xls) หรือข้อความ dd.mm.yyyy */
export function parseExcelOrDdMmDate(value: unknown): number | null {
  if (value == null || value === '') return null
  if (typeof value === 'number' && Number.isFinite(value)) {
    if (value > 1000 && value < 100000) {
      const sec = Math.round((value - 25569) * 86400)
      return sec > 0 ? sec : null
    }
    return null
  }
  const s = cellStr(value)
  if (!s) return null
  if (/^\d+(\.\d+)?$/.test(s)) {
    const n = Number(s)
    if (n > 1000 && n < 100000) {
      const sec = Math.round((n - 25569) * 86400)
      return sec > 0 ? sec : null
    }
  }
  return parseDdMmYyyy(s)
}

export function parseSystemStatus(raw: string): string {
  const parts = raw.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return ''
  if (parts[0] === 'REL' || parts[0] === 'CRTD') return parts[0]
  return parts.length >= 2 ? `${parts[0]} ${parts[1]}` : parts[0]
}

function rowLooksLikeHeader(wkorder: string, opac: string): boolean {
  const wo = wkorder.toLowerCase()
  const op = opac.toLowerCase()
  return wo === 'order' || wo === 's' || op === 'opac' || op === 'act.finish'
}

/**
 * อ่าน $Row[n] ตาม IW37N import layout
 * - legacy: คอลัมน์ A = index 0
 * - SAP ALV (คอลัมน์ S): ฟิลด์ 0–14 เลื่อน +2, ฟิลด์ 15–18 ยังอ้าง index เดิมจากคอลัมน์ A (PHP ใช้ $Row[17],$Row[18] ตรง index)
 */
function phpRowCell(cells: unknown[], phpCol: number, colOffset: number): string {
  const idx = colOffset > 0 && phpCol >= 15 ? phpCol : phpCol + colOffset
  return cellStr(cells[idx] ?? '')
}

function phpRowRaw(cells: unknown[], phpCol: number, colOffset: number): unknown {
  const idx = colOffset > 0 && phpCol >= 15 ? phpCol : phpCol + colOffset
  return cells[idx]
}

/** ตรวจค่าว่างตาม IW37N import rules import rules */
export function rowFailsPhpImportValidation(cells: unknown[], colOffset: number): boolean {
  return (
    !phpRowCell(cells, 1, colOffset) ||
    !phpRowCell(cells, 2, colOffset) ||
    !phpRowCell(cells, 4, colOffset) ||
    !phpRowCell(cells, 6, colOffset) ||
    !phpRowCell(cells, 7, colOffset) ||
    !phpRowCell(cells, 8, colOffset) ||
    !phpRowCell(cells, 17, colOffset) ||
    !phpRowCell(cells, 18, colOffset)
  )
}

function rowFailsImportValidation(cells: unknown[], map: Iw37nColumnMap): boolean {
  const cell = (col: number) => cellStr(cellAt(cells, col))
  return (
    !cell(map.wkorder) ||
    !cell(map.wktype) ||
    !cell(map.bscstart) ||
    !cell(map.systemstatus) ||
    !cell(map.opac) ||
    !cell(map.operationshorttext) ||
    !cell(map.equdescrip) ||
    !cell(map.funcdescrip)
  )
}

function rowArrayToRecordFromMap(cells: unknown[], map: Iw37nColumnMap): Iw37nImportRow | null {
  if (rowFailsImportValidation(cells, map)) return null

  const cell = (col: number) => cellStr(cellAt(cells, col))
  const wkorder = cell(map.wkorder)
  const opac = cell(map.opac)
  const operationshorttext = cell(map.operationshorttext)
  if (rowLooksLikeHeader(wkorder, opac)) return null

  const systemstatus = cell(map.systemstatus)
  const equdescrip = cell(map.equdescrip)
  const funcdescrip = cell(map.funcdescrip)
  let functionalloc = map.hasFunctionalLocCode ? cell(map.functionalloc) : ''
  if (!functionalloc && map.hasFunctionalLocCode) {
    functionalloc = cell(map.functionalloc)
  }

  const equipmentCode = map.equipment >= 0 ? cell(map.equipment) : ''
  const workRaw = cell(map.work)
  const actworkRaw = cell(map.actwork)
  const untimeRaw = cell(map.untime)

  return ensureFactoryScopeFunctionalloc({
    mntplan: cell(map.mntplan),
    wkorder,
    wktype: cell(map.wktype),
    mat: cell(map.mat),
    bscstart: parseExcelOrDdMmDate(cellAt(cells, map.bscstart)),
    actfinish: parseExcelOrDdMmDate(cellAt(cells, map.actfinish)),
    systemstatus,
    syst: parseSystemStatus(systemstatus),
    opac,
    operationshorttext,
    ostdescription: cell(map.ostdescription),
    cknow: cell(map.cknow),
    wkctr: cell(map.wkctr),
    work: workRaw ? Number(workRaw) : null,
    actwork: actworkRaw ? Number(actworkRaw) : null,
    untime: untimeRaw && !Number.isNaN(Number(untimeRaw)) ? Number(untimeRaw) : null,
    equipment: equipmentCode,
    equdescrip,
    functionalloc,
    funcdescrip,
  })
}

/** legacy fallback เมื่อไม่มี header ชัด */
function rowArrayToRecord(cells: unknown[], colOffset: number): Iw37nImportRow | null {
  if (rowFailsPhpImportValidation(cells, colOffset)) return null

  const wkorder = phpRowCell(cells, 1, colOffset)
  const opac = phpRowCell(cells, 7, colOffset)
  const operationshorttext = phpRowCell(cells, 8, colOffset)
  if (rowLooksLikeHeader(wkorder, opac)) return null

  const systemstatus = phpRowCell(cells, 6, colOffset)
  const equdescrip = phpRowCell(cells, 16, colOffset)
  const funcdescrip = phpRowCell(cells, 18, colOffset)
  const functionalloc = phpRowCell(cells, 17, colOffset)

  return ensureFactoryScopeFunctionalloc({
    mntplan: phpRowCell(cells, 0, colOffset),
    wkorder,
    wktype: phpRowCell(cells, 2, colOffset),
    mat: phpRowCell(cells, 3, colOffset),
    bscstart: parseExcelOrDdMmDate(phpRowRaw(cells, 4, colOffset)),
    actfinish: parseExcelOrDdMmDate(phpRowRaw(cells, 5, colOffset)),
    systemstatus,
    syst: parseSystemStatus(systemstatus),
    opac,
    operationshorttext,
    ostdescription: phpRowCell(cells, 9, colOffset),
    cknow: phpRowCell(cells, 10, colOffset),
    wkctr: phpRowCell(cells, 11, colOffset),
    work: (() => {
      const w = phpRowCell(cells, 12, colOffset)
      return w ? Number(w) : null
    })(),
    actwork: (() => {
      const w = phpRowCell(cells, 13, colOffset)
      return w ? Number(w) : null
    })(),
    untime: (() => {
      const w = phpRowCell(cells, 14, colOffset)
      return w && !Number.isNaN(Number(w)) ? Number(w) : null
    })(),
    equipment: phpRowCell(cells, 15, colOffset),
    equdescrip,
    functionalloc,
    funcdescrip,
  })
}

function matrixRowText(row: unknown): string {
  if (!Array.isArray(row)) return ''
  return row.map(cellStr).join(' ')
}

/** ตรวจจาก matrix ก่อน parse — ใช้ใน import log / tests */
export function detectIw37nLayout(matrix: unknown[][]): Iw37nLayout {
  const scan = Math.min(matrix.length, 12)
  for (let i = 0; i < scan; i++) {
    if (/dynamic\s+list\s+display/i.test(matrixRowText(matrix[i]))) {
      return 'sap_alv'
    }
  }
  for (let i = 0; i < Math.min(matrix.length, 8); i++) {
    const row = matrix[i]
    if (!Array.isArray(row)) continue
    const c0 = cellStr(row[0]).toLowerCase()
    const c1 = cellStr(row[1]).toLowerCase()
    const c2 = cellStr(row[2]).toLowerCase()
    const c3 = cellStr(row[3]).toLowerCase()
    if (c0 === 'mntplan' || (c1 === 'order' && c0 !== 's')) return 'legacy'
    if (c2 === 'mntplan' && c3 === 'order') return 'sap_alv'
  }
  return 'legacy'
}

function findSapAlvHeaderRowIndex(matrix: unknown[][]): number {
  for (let i = 0; i < Math.min(matrix.length, 10); i++) {
    const row = matrix[i]
    if (!Array.isArray(row)) continue
    const texts = row.map(cellStr)
    const hasOrder = texts.some((t) => t.toLowerCase() === 'order')
    const hasOpac = texts.some((t) => t.toLowerCase() === 'opac')
    if (hasOrder && hasOpac) return i
  }
  return 3
}

function firstDataRowIndex(
  matrix: unknown[][],
  headerRow: number,
  map: Iw37nColumnMap | null,
  colOffset: number,
): number {
  for (let i = headerRow + 1; i < Math.min(matrix.length, headerRow + 4); i++) {
    const row = matrix[i]
    if (!Array.isArray(row)) continue
    const rec = map ? rowArrayToRecordFromMap(row, map) : rowArrayToRecord(row, colOffset)
    if (rec) return i
  }
  return headerRow + 2
}

export function parseIw37nMatrix(matrix: unknown[][]): Iw37nParseResult {
  const layout = detectIw37nLayout(matrix)
  const out: Iw37nImportRow[] = []
  let missingFunctionalLocCode = false

  if (layout === 'sap_alv') {
    const headerRow = findSapAlvHeaderRowIndex(matrix)
    const headerCells = matrix[headerRow]
    const map = Array.isArray(headerCells) ? buildIw37nColumnMap(headerCells) : null
    if (map && !map.hasFunctionalLocCode) missingFunctionalLocCode = true
    const colOffset = 2
    const start = firstDataRowIndex(matrix, headerRow, map, colOffset)
    for (let i = start; i < matrix.length; i++) {
      const row = matrix[i]
      if (!row || !Array.isArray(row)) continue
      const rec = map ? rowArrayToRecordFromMap(row, map) : rowArrayToRecord(row, colOffset)
      if (rec) out.push(rec)
    }
  } else {
    const headerCells = matrix[0]
    const map = Array.isArray(headerCells) ? buildIw37nColumnMap(headerCells) : null
    if (map?.hasFunctionalLocCode === false) missingFunctionalLocCode = true
    const start = map ? 1 : 2
    for (let i = start; i < matrix.length; i++) {
      const row = matrix[i]
      if (!row || !Array.isArray(row)) continue
      const rec = map ? rowArrayToRecordFromMap(row, map) : rowArrayToRecord(row, 0)
      if (rec) out.push(rec)
    }
  }

  return {
    layout,
    rows: out,
    ...(missingFunctionalLocCode ? { missingFunctionalLocCode: true } : {}),
  }
}

function sheetToMatrix(buffer: Buffer, fileName: string): unknown[][] {
  const lower = fileName.toLowerCase()
  if (lower.endsWith('.csv')) {
    const text = buffer.toString('utf8')
    const lines = text.split(/\r?\n/).filter((l) => l.trim())
    return lines.map((line) => {
      const sep = line.includes('\t') ? '\t' : ','
      return line.split(sep).map((c) => c.trim().replace(/^"|"$/g, ''))
    })
  }
  const wb = XLSX.read(buffer, { type: 'buffer', cellDates: false })
  const matrix: unknown[][] = []
  for (const name of wb.SheetNames) {
    const sheet = wb.Sheets[name]
    if (!sheet) continue
    const part = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' })
    if (part.length) {
      if (matrix.length) matrix.push([])
      matrix.push(...part)
    }
  }
  return matrix
}

/** ข้ามแถวนำ / header ตาม layout */
export function parseIw37nFile(buffer: Buffer, fileName: string): Iw37nImportRow[] {
  return parseIw37nFileWithMeta(buffer, fileName).rows
}

export function parseIw37nFileWithMeta(buffer: Buffer, fileName: string): Iw37nParseResult {
  const matrix = sheetToMatrix(buffer, fileName)
  return parseIw37nMatrix(matrix)
}
