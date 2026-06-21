import * as XLSX from 'xlsx'
import { parseDstDbCell } from './pm-vibration-cell.js'

export type PmReadingImportRow = {
  rowNo: number
  wkorder: string
  machine: string
  pmlist: string
  kind: 'current_3phase' | 'vibration_dst_db'
  measuredAt: string
  v1: number
  v2: number
  v3: number | null
  warningLimit: number | null
  alarmLimit: number | null
}

export type PmReadingImportParseIssue = {
  rowNo: number
  wkorder: string
  message: string
}

export type PmReadingsImportOptions = {
  /** WO ที่เลือกบนจอ — ใช้กับ wide sheet (Vibration Record 2019) ที่ไม่มีคอลัมน์เลข WO */
  defaultWkorder?: string
}

const HEADER_ALIASES: Record<string, keyof Omit<PmReadingImportRow, 'rowNo' | 'measuredAt'>> = {
  'เลข wo': 'wkorder',
  wo: 'wkorder',
  wkorder: 'wkorder',
  order: 'wkorder',
  'เครื่องจักร': 'machine',
  machine: 'machine',
  'รายการ pm': 'pmlist',
  pmlist: 'pmlist',
  'ประเภทการวัด': 'kind',
  ประเภท: 'kind',
  kind: 'kind',
  dst: 'v1',
  distortion: 'v1',
  'แกน x': 'v1',
  'axis x': 'v1',
  x: 'v1',
  'ค่า 1': 'v1',
  v1: 'v1',
  'r (a)': 'v1',
  'r a': 'v1',
  'เฟส r': 'v1',
  'phase r': 'v1',
  db: 'v2',
  lev: 'v2',
  level: 'v2',
  'd b': 'v2',
  'แกน y': 'v2',
  'axis y': 'v2',
  y: 'v2',
  'ค่า 2': 'v2',
  v2: 'v2',
  's (a)': 'v2',
  's a': 'v2',
  'เฟส s': 'v2',
  'phase s': 'v2',
  'แกน z': 'v3',
  'axis z': 'v3',
  z: 'v3',
  'ค่า 3': 'v3',
  v3: 'v3',
  't (a)': 'v3',
  't a': 'v3',
  'เฟส t': 'v3',
  'phase t': 'v3',
  warning: 'warningLimit',
  alarm: 'alarmLimit',
}

/** หัวคอลัมน์ template นำเข้า */
export const PM_READINGS_IMPORT_HEADERS = {
  meta: ['เลข WO', 'เครื่องจักร', 'รายการ PM', 'ประเภทการวัด', 'วันเวลาวัด'] as const,
  currentValues: ['Phase R (A)', 'Phase S (A)', 'Phase T (A)'] as const,
  vibrationValues: ['Dst', 'dB', ''] as const,
  limits: ['Warning', 'Alarm'] as const,
  chartReference: ['Time', 'Phase R (A)', 'Phase S (A)', 'Phase T (A)'] as const,
  vibrationChartReference: ['Time', 'Dst', 'dB'] as const,
}

export function pmReadingsImportHeaderRow(
  kind: 'current_3phase' | 'vibration_dst_db',
): string[] {
  const values =
    kind === 'current_3phase'
      ? [...PM_READINGS_IMPORT_HEADERS.currentValues]
      : [...PM_READINGS_IMPORT_HEADERS.vibrationValues]
  return [...PM_READINGS_IMPORT_HEADERS.meta, ...values, ...PM_READINGS_IMPORT_HEADERS.limits]
}

function cellStr(v: unknown): string {
  if (v == null) return ''
  return String(v).trim()
}

function normalizeHeader(v: unknown): string {
  return cellStr(v)
    .toLowerCase()
    .replace(/\([^)]*\)/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function parseKind(raw: string): 'current_3phase' | 'vibration_dst_db' | null {
  const s = raw.trim().toLowerCase()
  if (!s) return null
  if (s.includes('dst') || s.includes('db') || s.includes('lev')) return 'vibration_dst_db'
  if (s.includes('vibrat') || s.includes('สั่น') || s.includes('mm/s')) return 'vibration_dst_db'
  if (s.includes('กระแส') || s.includes('เฟส') || s.includes('amp') || s.includes('current')) {
    return 'current_3phase'
  }
  if (s === 'vibration_dst_db' || s === 'vibration_3axis' || s === 'vibration') {
    return 'vibration_dst_db'
  }
  if (s === 'current_3phase' || s === 'current') return 'current_3phase'
  return null
}

function excelSerialToDate(serial: number): Date | null {
  if (!Number.isFinite(serial)) return null
  const parsed = XLSX.SSF.parse_date_code(serial)
  if (!parsed) return null
  return new Date(parsed.y, parsed.m - 1, parsed.d, parsed.H, parsed.M, Math.floor(parsed.S))
}

export function parseMeasuredAt(raw: unknown, baseDate?: Date | null): Date | null {
  if (raw == null || raw === '') {
    if (baseDate) return baseDate
    return new Date()
  }
  if (typeof raw === 'number') {
    const fromSerial = excelSerialToDate(raw)
    if (fromSerial && !Number.isNaN(fromSerial.getTime())) return fromSerial
  }
  const s = cellStr(raw)
  if (!s) {
    if (baseDate) return baseDate
    return new Date()
  }

  const iso = Date.parse(s)
  if (!Number.isNaN(iso)) return new Date(iso)

  const m = /^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})(?:\s+(\d{1,2}):(\d{2}))?$/.exec(s)
  if (m) {
    const dd = Number(m[1])
    const mm = Number(m[2])
    let yyyy = Number(m[3])
    if (yyyy < 100) yyyy += 2000
    if (yyyy > 2400) yyyy -= 543
    const hh = m[4] != null ? Number(m[4]) : 0
    const min = m[5] != null ? Number(m[5]) : 0
    const d = new Date(yyyy, mm - 1, dd, hh, min)
    if (!Number.isNaN(d.getTime())) return d
  }

  const timeOnly = /^(\d{1,2}):(\d{2})$/.exec(s)
  if (timeOnly) {
    const base = baseDate ?? new Date()
    const d = new Date(
      base.getFullYear(),
      base.getMonth(),
      base.getDate(),
      Number(timeOnly[1]),
      Number(timeOnly[2]),
    )
    if (!Number.isNaN(d.getTime())) return d
  }
  return null
}

function parseNum(raw: unknown): number | null {
  if (raw == null || raw === '') return null
  const n = Number(String(raw).replace(/,/g, '').trim())
  return Number.isFinite(n) ? n : null
}

function parseMeasurementValues(
  kind: 'current_3phase' | 'vibration_dst_db',
  rawV1: unknown,
  rawV2: unknown,
  rawV3: unknown,
): { v1: number | null; v2: number | null; v3: number | null } {
  if (kind === 'vibration_dst_db') {
    const combo = parseDstDbCell(rawV1) ?? parseDstDbCell(rawV2)
    if (combo) return { v1: combo.dst, v2: combo.db, v3: null }

    const v1 = parseNum(rawV1)
    const v2 = parseNum(rawV2)
    if (v1 != null && v2 != null) return { v1, v2, v3: null }

    return { v1, v2, v3: null }
  }

  return {
    v1: parseNum(rawV1),
    v2: parseNum(rawV2),
    v3: parseNum(rawV3),
  }
}

function buildHeaderMap(headerRow: unknown[]): Map<number, keyof PmReadingImportRow | 'measuredAt'> {
  const map = new Map<number, keyof PmReadingImportRow | 'measuredAt'>()
  headerRow.forEach((cell, idx) => {
    const key = normalizeHeader(cell)
    if (!key) return
    if (key.includes('วันเวล') || key.includes('measured') || key === 'datetime' || key === 'time') {
      map.set(idx, 'measuredAt')
      return
    }
    if (key === 'd/m/y' || key === 'date' || key.includes('วันที่')) {
      map.set(idx, 'measuredAt')
      return
    }
    const alias = HEADER_ALIASES[key]
    if (alias) map.set(idx, alias)
  })
  return map
}

function isDateColumnHeader(cell: unknown): boolean {
  const key = normalizeHeader(cell)
  return key === 'd/m/y' || key === 'date' || key.includes('วันที่') || key.includes('วันเวล')
}

export function parsePmReadingsWorkbook(
  buf: Buffer,
  options: PmReadingsImportOptions = {},
): {
  rows: PmReadingImportRow[]
  issues: PmReadingImportParseIssue[]
} {
  const wb = XLSX.read(buf, { type: 'buffer', cellDates: false })
  const allRows: PmReadingImportRow[] = []
  const allIssues: PmReadingImportParseIssue[] = []

  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName]
    if (!sheet) continue
    const parsed = parsePmReadingsSheet(sheet, sheetName, options)
    allRows.push(...parsed.rows)
    allIssues.push(...parsed.issues)
  }

  if (wb.SheetNames.length === 0) {
    return { rows: [], issues: [{ rowNo: 0, wkorder: '', message: 'ไม่พบ sheet ในไฟล์' }] }
  }

  return { rows: allRows, issues: allIssues }
}

function parsePmReadingsSheet(
  sheet: XLSX.WorkSheet,
  sheetName: string,
  options: PmReadingsImportOptions,
): { rows: PmReadingImportRow[]; issues: PmReadingImportParseIssue[] } {
  const aoa = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' })
  if (aoa.length < 2) {
    return { rows: [], issues: [] }
  }

  const headerMap = buildHeaderMap(aoa[0] ?? [])
  const hasWkorder = [...headerMap.values()].includes('wkorder')
  const hasV1 = [...headerMap.values()].includes('v1')
  const hasV2 = [...headerMap.values()].includes('v2')

  if (hasWkorder && hasV1 && hasV2) {
    return parseTallPmReadingsSheet(aoa, headerMap)
  }

  const wide = parseVibrationWideSheet(aoa, sheetName, options.defaultWkorder ?? '')
  if (wide.rows.length > 0 || wide.issues.length > 0) {
    return wide
  }

  return { rows: [], issues: [] }
}

function parseTallPmReadingsSheet(
  aoa: unknown[][],
  headerMap: Map<number, keyof PmReadingImportRow | 'measuredAt'>,
): { rows: PmReadingImportRow[]; issues: PmReadingImportParseIssue[] } {
  const rows: PmReadingImportRow[] = []
  const issues: PmReadingImportParseIssue[] = []
  const fieldMap = headerMap as Map<number, keyof PmReadingImportRow | 'measuredAt'>

  let trendBaseDate: Date | null = null

  for (let i = 1; i < aoa.length; i++) {
    const line = aoa[i] ?? []
    const rowNo = i + 1
    const draft: Partial<PmReadingImportRow> & {
      measuredAtRaw?: unknown
      rawV1?: unknown
      rawV2?: unknown
      rawV3?: unknown
    } = {
      rowNo,
      kind: 'current_3phase',
      warningLimit: null,
      alarmLimit: null,
    }

    for (const [colIdx, field] of fieldMap.entries()) {
      const val = line[colIdx]
      if (field === 'measuredAt') {
        draft.measuredAtRaw = val
      } else if (field === 'kind') {
        const k = parseKind(cellStr(val))
        if (k) draft.kind = k
      } else if (field === 'warningLimit' || field === 'alarmLimit') {
        draft[field] = parseNum(val)
      } else if (field === 'v1') {
        draft.rawV1 = val
      } else if (field === 'v2') {
        draft.rawV2 = val
      } else if (field === 'v3') {
        draft.rawV3 = val
      } else if (field === 'wkorder' || field === 'machine' || field === 'pmlist') {
        draft[field] = cellStr(val)
      }
    }

    const wkorder = (draft.wkorder ?? '').trim()
    if (!wkorder) continue

    const kind = draft.kind ?? 'current_3phase'
    const { v1, v2, v3 } = parseMeasurementValues(
      kind,
      draft.rawV1,
      draft.rawV2,
      draft.rawV3,
    )

    if (kind === 'vibration_dst_db') {
      if (v1 == null || v2 == null) {
        issues.push({
          rowNo,
          wkorder,
          message: 'Vibration — ต้องมี Dst และ dB (ตัวเลขหรือรูปแบบ Dst 08 dB 45)',
        })
        continue
      }
    } else if (v1 == null || v2 == null || v3 == null) {
      issues.push({ rowNo, wkorder, message: 'ค่าวัด 3 ช่อง R/S/T ไม่ครบหรือไม่ใช่ตัวเลข' })
      continue
    }

    const measured = parseMeasuredAt(draft.measuredAtRaw, trendBaseDate)
    if (!measured) {
      issues.push({ rowNo, wkorder, message: 'วันเวลาวัดไม่ถูกต้อง' })
      continue
    }

    if (draft.measuredAtRaw != null && cellStr(draft.measuredAtRaw).includes('/')) {
      trendBaseDate = measured
    }

    rows.push({
      rowNo,
      wkorder,
      machine: (draft.machine ?? '').trim(),
      pmlist: (draft.pmlist ?? '').trim(),
      kind,
      measuredAt: measured.toISOString(),
      v1,
      v2,
      v3: kind === 'vibration_dst_db' ? null : v3,
      warningLimit: draft.warningLimit ?? null,
      alarmLimit: draft.alarmLimit ?? null,
    })
  }

  return { rows, issues }
}

/** Excel wide (Vibration Record 2019) → tall: 1 คอลัมน์ = 1 task · หลายแถวตามวันที่ */
export function parseVibrationWideSheet(
  aoa: unknown[][],
  sheetName: string,
  defaultWkorder: string,
): { rows: PmReadingImportRow[]; issues: PmReadingImportParseIssue[] } {
  const rows: PmReadingImportRow[] = []
  const issues: PmReadingImportParseIssue[] = []

  if (!defaultWkorder.trim()) {
    return { rows, issues: [] }
  }

  let headerRowIdx = -1
  for (let i = 0; i < Math.min(5, aoa.length); i++) {
    if (isDateColumnHeader(aoa[i]?.[0])) {
      headerRowIdx = i
      break
    }
  }
  if (headerRowIdx < 0) return { rows, issues: [] }

  const subHeaderRow = aoa[headerRowIdx + 1]
  const hasSubHeader =
    subHeaderRow != null &&
    !cellStr(subHeaderRow[0]) &&
    subHeaderRow.slice(1).some((c) => cellStr(c))

  const parentRow = hasSubHeader ? (aoa[headerRowIdx] ?? []) : null
  const labelRow = hasSubHeader ? subHeaderRow! : (aoa[headerRowIdx] ?? [])
  const dataStart = headerRowIdx + (hasSubHeader ? 2 : 1)

  const taskCols: { colIdx: number; machine: string; pmlist: string }[] = []
  for (let col = 1; col < labelRow.length; col++) {
    const label = cellStr(labelRow[col])
    if (!label) continue
    const parent = parentRow ? cellStr(parentRow[col]) || findParentLabel(parentRow, col) : ''
    const machine = parent || sheetName.trim() || 'Vibration'
    const pmlist = parent && parent !== label ? `${parent} — ${label}` : label
    taskCols.push({ colIdx: col, machine, pmlist })
  }

  if (taskCols.length === 0) return { rows, issues: [] }

  let lastDate: Date | null = null

  for (let i = dataStart; i < aoa.length; i++) {
    const line = aoa[i] ?? []
    const rowNo = i + 1
    const dateRaw = line[0]
    let measured = parseMeasuredAt(dateRaw, lastDate)
    if (measured && cellStr(dateRaw)) {
      lastDate = measured
    } else if (!measured && !lastDate) {
      continue
    }
    if (!measured) measured = lastDate
    if (!measured) continue

    for (const task of taskCols) {
      const cell = line[task.colIdx]
      const parsed = parseDstDbCell(cell)
      if (!parsed) continue

      rows.push({
        rowNo,
        wkorder: defaultWkorder.trim(),
        machine: task.machine,
        pmlist: task.pmlist,
        kind: 'vibration_dst_db',
        measuredAt: measured.toISOString(),
        v1: parsed.dst,
        v2: parsed.db,
        v3: null,
        warningLimit: null,
        alarmLimit: null,
      })
    }
  }

  if (rows.length === 0 && taskCols.length > 0) {
    issues.push({
      rowNo: 0,
      wkorder: defaultWkorder,
      message: `Sheet «${sheetName}» — ไม่พบเซลล์ Dst/dB (wide format)`,
    })
  }

  return { rows, issues }
}

function findParentLabel(parentRow: unknown[], colIdx: number): string {
  for (let c = colIdx; c >= 1; c--) {
    const label = cellStr(parentRow[c])
    if (label && !isDateColumnHeader(label)) return label
  }
  return ''
}

export function buildPmReadingsImportTemplateBuffer(): Buffer {
  const currentHeader = pmReadingsImportHeaderRow('current_3phase')
  const vibrationHeader = pmReadingsImportHeaderRow('vibration_dst_db')

  const wo = '4001565681'
  const pmTask = 'ตรวจเช็คกระแสไฟฟ้าทั้ง 3 เฟส'
  const kindCurrent = 'กระแส 3 เฟส'
  const kindVibration = 'Vibration Dst/dB'

  const currentSheet = [
    currentHeader,
    [wo, 'Main Oil Pump', pmTask, kindCurrent, '26/05/2026 19:10', 97.5, 97.6, 96.2, '', ''],
    [wo, 'Combustion Fan', pmTask, kindCurrent, '26/05/2026 19:15', 39.9, 40.5, 40.6, '', ''],
    [
      wo,
      'Thermal Oil Circulating Pump',
      pmTask,
      kindCurrent,
      '26/05/2026 19:20',
      143.2,
      151.1,
      150.2,
      '',
      '',
    ],
    [wo, 'Main Oil Pump', pmTask, kindCurrent, '08:00', 120, 118, 121, '', ''],
    [wo, 'Main Oil Pump', pmTask, kindCurrent, '09:00', 125, 123, 126, '', ''],
    [wo, 'Main Oil Pump', pmTask, kindCurrent, '10:00', 130, 127, 129, '', ''],
    [wo, 'Main Oil Pump', pmTask, kindCurrent, '11:00', 128, 126, 131, '', ''],
    [wo, 'Main Oil Pump', pmTask, kindCurrent, '12:00', 135, 132, 134, '', ''],
  ]

  const vibrationSheet = [
    vibrationHeader,
    [
      wo,
      'Main Oil Pump',
      'Motor Front',
      kindVibration,
      '16/1/2017',
      'Dst 08 dB 45',
      '',
      '',
      40,
      45,
    ],
    [
      wo,
      'Main Oil Pump',
      'Motor Rear',
      kindVibration,
      '16/1/2017',
      'Dst:07 dB Lev:37',
      '',
      '',
      '',
      '',
    ],
    [wo, 'Main Oil Pump', 'Motor Front', kindVibration, '08:00', 8, 42, '', '', ''],
    [wo, 'Main Oil Pump', 'Motor Front', kindVibration, '09:00', 7, 40, '', '', ''],
  ]

  const chartReferenceSheet = [
    [...PM_READINGS_IMPORT_HEADERS.chartReference],
    ['08:00', 120, 118, 121],
    ['09:00', 125, 123, 126],
    ['10:00', 130, 127, 129],
  ]

  const vibrationChartSheet = [
    [...PM_READINGS_IMPORT_HEADERS.vibrationChartReference],
    ['08:00', 8, 45],
    ['09:00', 7, 42],
    ['10:00', 8, 44],
  ]

  const wb = XLSX.utils.book_new()

  const wsCurrent = XLSX.utils.aoa_to_sheet(currentSheet)
  wsCurrent['!cols'] = currentHeader.map((h) => ({ wch: Math.max(16, h.length + 2) }))
  XLSX.utils.book_append_sheet(wb, wsCurrent, 'กระแส 3 เฟส')

  const wsVib = XLSX.utils.aoa_to_sheet(vibrationSheet)
  wsVib['!cols'] = vibrationHeader.map((h) => ({ wch: Math.max(16, h.length + 2) }))
  XLSX.utils.book_append_sheet(wb, wsVib, 'Vibration Dst dB')

  const wsChart = XLSX.utils.aoa_to_sheet(chartReferenceSheet)
  wsChart['!cols'] = PM_READINGS_IMPORT_HEADERS.chartReference.map((h) => ({
    wch: Math.max(14, h.length + 2),
  }))
  XLSX.utils.book_append_sheet(wb, wsChart, 'ตารางกราฟ กระแส (อ้างอิง)')

  const wsVibChart = XLSX.utils.aoa_to_sheet(vibrationChartSheet)
  wsVibChart['!cols'] = PM_READINGS_IMPORT_HEADERS.vibrationChartReference.map((h) => ({
    wch: Math.max(14, h.length + 2),
  }))
  XLSX.utils.book_append_sheet(wb, wsVibChart, 'ตารางกราฟ Vibration (อ้างอิง)')

  return XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' }) as Buffer
}
