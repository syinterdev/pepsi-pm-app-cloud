import * as XLSX from 'xlsx'

/**
 * แมปคอลัมน์ Excel ตาม confirmation import + SAP ALV (Dynamic List Display)
 *
 * Fixed-column layout: skip 2 แถว, index คงที่
 * SAP ALV: หาแถว header (Confirm. + Order), แมปตามชื่อคอลัมน์
 */

export type ConfirmParseError =
  | 'EMPTY_REQUIRED'
  | 'BAD_TIMEWK'
  | 'BAD_UNIT'
  | 'BAD_TIMECLOSE'
  | 'BAD_START_DATE'
  | 'BAD_START_TIME'
  | 'BAD_END_DATE'
  | 'BAD_END_TIME'
  | 'END_BEFORE_START'

export type ConfirmImportRow = {
  rowNo: number
  confirmation: string
  wkorder: string
  wkctr: string
  timewk: number
  unitc: 'Min'
  timeclose: number
  stdate: number
  endate: number
  cwkctr: string | null
}

export type ConfirmParseResult =
  | { kind: 'ok'; row: ConfirmImportRow }
  | {
      kind: 'error'
      rowNo: number
      code: ConfirmParseError
      message: string
      raw: {
        confirmation: string
        wkorder: string
        wkctr: string
      }
    }

export type ConfirmLayout = 'legacy' | 'sap_alv'

export type ConfirmFileParseResult = {
  layout: ConfirmLayout
  results: ConfirmParseResult[]
}

type ConfirmColumnMap = {
  confirmation: number
  wkorder: number
  wkctr: number
  actWork: number
  unit: number
  ordCat: number
  postgDate: number
  actStartDate: number
  actFinishDate: number
  actStartTime: number
  actFinishTime: number
  cwkctr: number
}

function cellStr(v: unknown): string {
  if (v == null) return ''
  if (typeof v === 'number') return String(v)
  return String(v).trim()
}

function normHeaderLabel(v: unknown): string {
  return cellStr(v).toLowerCase().replace(/\s+/g, ' ')
}

/** dd.mm.yyyy → epoch วินาที (00:00:00) */
export function parseDdMmYyyy(value: string): number | null {
  const t = value.trim()
  if (!t) return null
  const parts = t.split(/[./-]/)
  if (parts.length < 3) return null
  const day = Number(parts[0])
  const month = Number(parts[1])
  let year = Number(parts[2])
  if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year)) return null
  if (year < 100) year += 2000
  if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1970 || year > 2100) return null
  const d = new Date(year, month - 1, day, 0, 0, 0, 0)
  const sec = Math.floor(d.getTime() / 1000)
  return sec > 0 ? sec : null
}

export function parseExcelSerialToUnix(value: number): number | null {
  if (!Number.isFinite(value) || value < 1) return null
  const sec = Math.round((value - 25569) * 86400)
  return sec > 0 ? sec : null
}

/** Excel serial หรือ dd.mm.yyyy */
export function parseExcelOrDdMmDate(value: unknown): number | null {
  if (value == null || value === '') return null
  if (typeof value === 'number' && Number.isFinite(value)) {
    if (value > 25569 && value < 100000) return parseExcelSerialToUnix(value)
    return null
  }
  const s = cellStr(value)
  if (!s) return null
  if (/^\d+(\.\d+)?$/.test(s)) {
    const n = Number(s)
    if (n > 25569 && n < 100000) return parseExcelSerialToUnix(n)
  }
  return parseDdMmYyyy(s)
}

function parseHhMm(value: string): { hh: number; mm: number; ss: number } | null {
  const t = value.trim()
  if (!t) return null
  const parts = t.split(':')
  if (parts.length < 2) return null
  const hh = Number(parts[0])
  const mm = Number(parts[1])
  const ss = parts.length >= 3 ? Number(parts[2]) : 0
  if (!Number.isFinite(hh) || !Number.isFinite(mm) || !Number.isFinite(ss)) return null
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59 || ss < 0 || ss > 59) return null
  return { hh, mm, ss }
}

function parseExcelDayFraction(value: unknown): { hh: number; mm: number; ss: number } | null {
  const n = typeof value === 'number' ? value : Number(cellStr(value))
  if (!Number.isFinite(n) || n < 0) return null
  if (n >= 1) return null
  const secs = Math.round(n * 86400)
  const hh = Math.floor(secs / 3600)
  const mm = Math.floor((secs % 3600) / 60)
  const ss = secs % 60
  return { hh, mm, ss }
}

function unixFromParts(year: number, month: number, day: number, hh: number, mm: number, ss: number): number | null {
  const d = new Date(year, month - 1, day, hh, mm, ss, 0)
  const sec = Math.floor(d.getTime() / 1000)
  return sec > 0 ? sec : null
}

function combineDateTime(dateStr: string, timeStr: string): number | null {
  const t = parseHhMm(timeStr)
  if (!t) return null
  const dParts = dateStr.trim().split(/[./-]/)
  if (dParts.length < 3) return null
  const day = Number(dParts[0])
  const month = Number(dParts[1])
  let year = Number(dParts[2])
  if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year)) return null
  if (year < 100) year += 2000
  return unixFromParts(year, month, day, t.hh, t.mm, t.ss)
}

/** รวมวันที่ + เวลา (รองรับ Excel serial / fraction ของวัน) */
export function parseConfirmDateTime(dateCell: unknown, timeCell: unknown): number | null {
  if (typeof timeCell === 'number' && timeCell > 25569) {
    return parseExcelSerialToUnix(timeCell)
  }
  if (typeof dateCell === 'number' && dateCell > 25569) {
    const base = parseExcelSerialToUnix(dateCell)
    if (base == null) return null
    const d = new Date(base * 1000)
    const hmFromStr = parseHhMm(cellStr(timeCell))
    if (hmFromStr) {
      return unixFromParts(d.getFullYear(), d.getMonth() + 1, d.getDate(), hmFromStr.hh, hmFromStr.mm, hmFromStr.ss)
    }
    const frac = parseExcelDayFraction(timeCell)
    if (frac) {
      return unixFromParts(d.getFullYear(), d.getMonth() + 1, d.getDate(), frac.hh, frac.mm, frac.ss)
    }
    return base
  }

  const frac = parseExcelDayFraction(timeCell)
  const dateMid = parseExcelOrDdMmDate(dateCell)
  if (frac && dateMid != null) {
    const d = new Date(dateMid * 1000)
    return unixFromParts(d.getFullYear(), d.getMonth() + 1, d.getDate(), frac.hh, frac.mm, frac.ss)
  }

  const dateStr = cellStr(dateCell)
  const timeStr = cellStr(timeCell)
  if (dateStr && timeStr.includes(':')) return combineDateTime(dateStr, timeStr)
  if (dateMid != null) return dateMid
  return parseDdMmYyyy(dateStr)
}

function matrixRowText(row: unknown): string {
  if (!Array.isArray(row)) return ''
  return row.map(cellStr).join(' ')
}

export function detectConfirmLayout(matrix: unknown[][]): ConfirmLayout {
  for (let i = 0; i < Math.min(matrix.length, 12); i++) {
    if (/dynamic\s+list\s+display/i.test(matrixRowText(matrix[i]))) return 'sap_alv'
  }
  for (let i = 0; i < Math.min(matrix.length, 8); i++) {
    const row = matrix[i]
    if (!Array.isArray(row)) continue
    const labels = row.map(normHeaderLabel)
    const hasConfirm = labels.some((h) => /^confirm\.?$/.test(h))
    const hasOrder = labels.some((h) => h === 'order')
    if (hasConfirm && hasOrder) {
      const orderIdx = labels.findIndex((h) => h === 'order')
      const confirmIdx = labels.findIndex((h) => /^confirm\.?$/.test(h))
      if (orderIdx > 3 || labels[1] === 's') return 'sap_alv'
      if (confirmIdx <= 1 && orderIdx === 3) return 'legacy'
      return 'sap_alv'
    }
  }
  return 'legacy'
}

function findConfirmHeaderRowIndex(matrix: unknown[][]): number {
  for (let i = 0; i < Math.min(matrix.length, 12); i++) {
    const row = matrix[i]
    if (!Array.isArray(row)) continue
    const labels = row.map(normHeaderLabel)
    const hasConfirm = labels.some((h) => /^confirm\.?$/.test(h) || h.startsWith('confirm.'))
    const hasOrder = labels.some((h) => h === 'order')
    if (hasConfirm && hasOrder) return i
  }
  return 3
}

function buildConfirmColumnMap(headerRow: unknown[]): ConfirmColumnMap | null {
  const labels = headerRow.map(normHeaderLabel)
  const idx = (pred: (h: string, i: number) => boolean) => labels.findIndex(pred)

  const confirmation = idx((h) => /^confirm\.?$/.test(h) || h === 'confirm.')
  const wkorder = idx((h) => h === 'order')
  const wkctr = idx((h) => h.includes('wkctract') || h === 'wkctr act')
  const actWork = idx((h) => h.includes('act. work') || h.includes('act work'))
  const unit = idx((h) => h.includes('un.') && h.includes('wkact'))
  const ordCat = idx((h) => h === 'ordcat' || h.includes('ordcat'))

  const postgDate = idx(
    (h) => h === 'postg date' || h === 'posting date' || h === 'created on',
  )

  let actStartDate = -1
  let actStartTime = -1
  const actFinishCols: number[] = []
  for (let i = 0; i < labels.length; i++) {
    const h = labels[i]!
    if (h === 'act. start') actStartDate = i
    if (h === 'act.start') actStartTime = i
    if (h === 'act.finish' || h === 'act. finish') actFinishCols.push(i)
  }

  const actFinishDate = actFinishCols[0] ?? -1
  const actFinishTime = actFinishCols[1] ?? -1

  const cwkctr = idx((h) => h === 'pg' || h === 'ptac' || h === 'cwkctr')

  if (confirmation < 0 || wkorder < 0 || wkctr < 0 || actWork < 0 || unit < 0) return null

  return {
    confirmation,
    wkorder,
    wkctr,
    actWork,
    unit,
    ordCat: ordCat >= 0 ? ordCat : -1,
    postgDate: postgDate >= 0 ? postgDate : -1,
    actStartDate: actStartDate >= 0 ? actStartDate : -1,
    actFinishDate: actFinishDate >= 0 ? actFinishDate : -1,
    actStartTime: actStartTime >= 0 ? actStartTime : -1,
    actFinishTime: actFinishTime >= 0 ? actFinishTime : -1,
    cwkctr: cwkctr >= 0 ? cwkctr : -1,
  }
}

function legacyColumnMap(): ConfirmColumnMap {
  return {
    confirmation: 0,
    wkorder: 3,
    wkctr: 6,
    actWork: 7,
    unit: 8,
    ordCat: 10,
    postgDate: 11,
    actStartDate: 16,
    actFinishDate: 17,
    actStartTime: 14,
    actFinishTime: 15,
    cwkctr: 19,
  }
}

function getCell(cells: unknown[], i: number): string {
  return i >= 0 ? cellStr(cells[i]) : ''
}

/** จับคู่คอลัมน์วันที่/เวลาเมื่อ SAP ใส่ HH:MM กับ serial สลับตำแหน่ง */
function pickDateTimeCells(
  cells: unknown[],
  dateIdx: number,
  timeIdx: number,
): { dateCell: unknown; timeCell: unknown } {
  if (dateIdx < 0 && timeIdx < 0) return { dateCell: '', timeCell: '' }
  if (dateIdx < 0) return { dateCell: cells[timeIdx], timeCell: '' }
  if (timeIdx < 0) return { dateCell: cells[dateIdx], timeCell: '' }

  const d = cells[dateIdx]
  const t = cells[timeIdx]
  const dStr = cellStr(d)
  const tStr = cellStr(t)

  if (typeof d === 'number' && d > 25569) return { dateCell: d, timeCell: t }
  if (typeof t === 'number' && t > 25569) return { dateCell: t, timeCell: d }
  if (dStr.includes(':') && !tStr.includes(':') && (parseDdMmYyyy(tStr) || typeof t === 'number')) {
    return { dateCell: t, timeCell: d }
  }
  if (tStr.includes(':') && parseDdMmYyyy(dStr)) return { dateCell: d, timeCell: t }
  return { dateCell: d, timeCell: t }
}

function rowLooksLikeHeader(confirmation: string, wkorder: string): boolean {
  const c = confirmation.toLowerCase()
  const o = wkorder.toLowerCase()
  return c === 'confirm.' || c === 'confirm' || o === 'order'
}

function rowArrayToParseResult(
  cells: unknown[],
  rowNo: number,
  map: ConfirmColumnMap,
): ConfirmParseResult {
  const confirmation = getCell(cells, map.confirmation)
  const wkorder = getCell(cells, map.wkorder)
  const wkctr = getCell(cells, map.wkctr)
  const timewkRaw = getCell(cells, map.actWork)
  const unitRaw = getCell(cells, map.unit)
  const ordCatRaw = map.ordCat >= 0 ? getCell(cells, map.ordCat) : 'ZB02'
  const rawSummary = { confirmation, wkorder, wkctr }

  if (rowLooksLikeHeader(confirmation, wkorder)) {
    return {
      kind: 'error',
      rowNo,
      code: 'EMPTY_REQUIRED',
      message: 'แถว header',
      raw: rawSummary,
    }
  }

  const postgCell = map.postgDate >= 0 ? cells[map.postgDate] : ''
  const { dateCell: startDateCell, timeCell: startTimeCell } = pickDateTimeCells(
    cells,
    map.actStartDate,
    map.actStartTime,
  )
  const { dateCell: endDateCell, timeCell: endTimeCell } = pickDateTimeCells(
    cells,
    map.actFinishDate,
    map.actFinishTime,
  )

  const hasStart = map.actStartDate >= 0 || map.actStartTime >= 0
  const hasEnd = map.actFinishDate >= 0 || map.actFinishTime >= 0

  if (
    !confirmation ||
    !wkorder ||
    !wkctr ||
    !timewkRaw ||
    !unitRaw ||
    !ordCatRaw ||
    (map.postgDate >= 0 && cellStr(postgCell) === '') ||
    map.postgDate < 0 ||
    !hasStart ||
    !hasEnd
  ) {
    const missing =
      map.postgDate < 0
        ? 'postg date'
        : !hasStart
          ? 'act start'
          : !hasEnd
            ? 'act finish'
            : 'required columns'
    return {
      kind: 'error',
      rowNo,
      code: 'EMPTY_REQUIRED',
      message: `มีคอลัมน์ที่จำเป็นว่าง (${missing})`,
      raw: rawSummary,
    }
  }

  const timewkNum = Number(timewkRaw)
  if (!Number.isFinite(timewkNum) || timewkNum < 0) {
    return {
      kind: 'error',
      rowNo,
      code: 'BAD_TIMEWK',
      message: `ค่าเวลาทำงานไม่ใช่ตัวเลข: "${timewkRaw}"`,
      raw: rawSummary,
    }
  }

  const unit = unitRaw.toUpperCase()
  if (unit !== 'H' && unit !== 'MIN' && unit !== 'M') {
    return {
      kind: 'error',
      rowNo,
      code: 'BAD_UNIT',
      message: `หน่วยเวลาต้องเป็น H หรือ Min: "${unitRaw}"`,
      raw: rawSummary,
    }
  }
  const timewkMin = unit === 'H' ? Math.round(timewkNum * 60) : Math.round(timewkNum)

  const timeclose =
    map.postgDate >= 0
      ? parseExcelOrDdMmDate(postgCell) ?? parseDdMmYyyy(cellStr(postgCell))
      : null
  if (timeclose == null) {
    return {
      kind: 'error',
      rowNo,
      code: 'BAD_TIMECLOSE',
      message: `วันที่ปิดงานไม่ถูกต้อง: "${cellStr(postgCell)}"`,
      raw: rawSummary,
    }
  }

  const stdate = parseConfirmDateTime(startDateCell, startTimeCell)
  if (stdate == null) {
    return {
      kind: 'error',
      rowNo,
      code: 'BAD_START_DATE',
      message: 'ไม่สามารถแปลงเวลาเริ่มได้',
      raw: rawSummary,
    }
  }

  const endate = parseConfirmDateTime(endDateCell, endTimeCell)
  if (endate == null) {
    return {
      kind: 'error',
      rowNo,
      code: 'BAD_END_DATE',
      message: 'ไม่สามารถแปลงเวลาสิ้นสุดได้',
      raw: rawSummary,
    }
  }

  if (endate < stdate) {
    return {
      kind: 'error',
      rowNo,
      code: 'END_BEFORE_START',
      message: 'เวลาสิ้นสุดอยู่ก่อนเวลาเริ่ม',
      raw: rawSummary,
    }
  }

  const cwkctrRaw = map.cwkctr >= 0 ? getCell(cells, map.cwkctr) : ''

  return {
    kind: 'ok',
    row: {
      rowNo,
      confirmation,
      wkorder,
      wkctr,
      timewk: timewkMin,
      unitc: 'Min',
      timeclose,
      stdate,
      endate,
      cwkctr: cwkctrRaw || null,
    },
  }
}

function firstConfirmDataRowIndex(matrix: unknown[][], headerRow: number, map: ConfirmColumnMap): number {
  for (let i = headerRow + 1; i < Math.min(matrix.length, headerRow + 4); i++) {
    const row = matrix[i]
    if (!Array.isArray(row)) continue
    if (row.every((c) => cellStr(c) === '')) continue
    const r = rowArrayToParseResult(row, i + 1, map)
    if (r.kind === 'ok') return i
  }
  return headerRow + 2
}

export function parseConfirmMatrix(matrix: unknown[][]): ConfirmFileParseResult {
  const layout = detectConfirmLayout(matrix)
  const out: ConfirmParseResult[] = []

  if (layout === 'sap_alv') {
    const headerRow = findConfirmHeaderRowIndex(matrix)
    const map = buildConfirmColumnMap(matrix[headerRow] ?? []) ?? legacyColumnMap()
    const start = firstConfirmDataRowIndex(matrix, headerRow, map)
    for (let i = start; i < matrix.length; i++) {
      const row = matrix[i]
      if (!row || !Array.isArray(row)) continue
      if (row.every((c) => cellStr(c) === '')) continue
      const parsed = rowArrayToParseResult(row, i + 1, map)
      if (parsed.kind === 'error' && parsed.message === 'แถว header') continue
      out.push(parsed)
    }
  } else {
    const map = legacyColumnMap()
    for (let i = 2; i < matrix.length; i++) {
      const row = matrix[i]
      if (!row || !Array.isArray(row)) continue
      if (row.every((c) => cellStr(c) === '')) continue
      out.push(rowArrayToParseResult(row, i + 1, map))
    }
  }

  return { layout, results: out }
}

function sheetToMatrix(buffer: Buffer, fileName: string): unknown[][] {
  const lower = fileName.toLowerCase()
  if (lower.endsWith('.csv')) {
    const text = buffer.toString('utf8')
    const lines = text.split(/\r?\n/).filter((l) => l.length > 0)
    return lines.map((line) => {
      const sep = line.includes('\t') ? '\t' : ','
      return line.split(sep).map((c) => c.trim().replace(/^"|"$/g, ''))
    })
  }
  const wb = XLSX.read(buffer, { type: 'buffer', cellDates: false })
  const sheet = wb.Sheets[wb.SheetNames[0]]
  if (!sheet) return []
  return XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' })
}

export function parseConfirmFile(buffer: Buffer, fileName: string): ConfirmParseResult[] {
  return parseConfirmFileWithMeta(buffer, fileName).results
}

export function parseConfirmFileWithMeta(buffer: Buffer, fileName: string): ConfirmFileParseResult {
  const matrix = sheetToMatrix(buffer, fileName)
  return parseConfirmMatrix(matrix)
}
