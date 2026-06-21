import type { TasklistImportRow } from '@/lib/master-data-api'

export type PmMasterDiscipline = 'EE' | 'ME' | 'PK'

export type PmMasterProcessRow = {
  sheet: string
  zone: string
  machineList: string
  mntplan: string
  tasklist: string
  legacy: string
  machine: string
  pmlist: string
  pmday?: number
  machinestatus?: number
  pmmin?: number
  pmman?: number
  gls?: string
  plan?: string
  freqhour?: number
  runhr?: number
  mpoint?: string
}

const SKIP_SHEETS = /^total master plan|^legend$/i

function normHeader(v: unknown): string {
  return String(v ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

function toNum(v: unknown): number | undefined {
  if (v == null || v === '') return undefined
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}

function cellStr(v: unknown): string {
  if (v == null) return ''
  if (typeof v === 'number' && Number.isFinite(v)) return String(Math.trunc(v))
  return String(v).trim()
}

function legacyWkctrtype(legacy: string, discipline: PmMasterDiscipline): string {
  const parts = legacy.split('-').filter(Boolean)
  const last = parts[parts.length - 1]?.toUpperCase() ?? ''
  if (['EE', 'ME', 'OP', 'PK', 'UT', 'WC', 'FC', 'FL', 'FI', 'MI', 'ML', 'NI', 'MC', 'NC', 'QI', 'WL'].includes(last)) {
    if (['EE', 'ME', 'OP', 'PK', 'UT'].includes(last)) return last
    return `${last}-${discipline}`
  }
  return discipline
}

function findHeaderRow(values: unknown[][]): { rowIndex: number; headers: string[] } | null {
  for (let i = 0; i < Math.min(values.length, 15); i++) {
    const row = values[i] ?? []
    const headers = row.map(normHeader)
    const hasZone = headers.some((h) => h === 'zone')
    const hasPmList = headers.some((h) => h.includes('pm list'))
    if (hasZone && hasPmList) return { rowIndex: i, headers }
  }
  return null
}

function colIndex(headers: string[], ...needles: string[]): number {
  for (let i = 0; i < headers.length; i++) {
    const h = headers[i] ?? ''
    if (needles.some((n) => h === n || h.includes(n))) return i
  }
  return -1
}

function parseDataRows(
  values: unknown[][],
  headerIndex: number,
  headers: string[],
  sheetName: string,
): PmMasterProcessRow[] {
  const iZone = colIndex(headers, 'zone')
  const iMachineList = colIndex(headers, 'machine list')
  const iMnt = colIndex(headers, 'maintenance plan', 'sap code', 'mant', 'plan')
  const iTask = colIndex(headers, 'task list', 'task list no')
  const iLegacy = colIndex(headers, 'legacy', 'lagacy')
  const iMc = colIndex(headers, 'm/c')
  const iPmList = colIndex(headers, 'pm list')
  const iDays = colIndex(headers, 'days', 'freq', 'freq (day)')
  const iStop = colIndex(headers, 'หยุด')
  const iRun = colIndex(headers, 'เดิน')
  const iMin = colIndex(headers, 'min')
  const iMan = colIndex(headers, 'man')
  const iGls = colIndex(headers, 'grease', 'lube')
  const iPlan = colIndex(headers, 'pm code', 'plan')
  const iHour = colIndex(headers, 'hour', 'freq hour', 'new hour')
  const iRunHr = colIndex(headers, '%run hr', 'run hr')
  const iMpoint = colIndex(headers, 'measurement')

  if (iZone < 0 || iPmList < 0) return []

  const out: PmMasterProcessRow[] = []
  let lastZone = ''
  let lastMachineList = ''

  for (let r = headerIndex + 1; r < values.length; r++) {
    const row = values[r] ?? []
    const zone = cellStr(row[iZone]) || lastZone
    const machineList = cellStr(row[iMachineList >= 0 ? iMachineList : -1]) || lastMachineList
    if (zone) lastZone = zone
    if (machineList) lastMachineList = machineList

    const legacy = iLegacy >= 0 ? cellStr(row[iLegacy]) : ''
    const pmlist = iPmList >= 0 ? cellStr(row[iPmList]) : ''
    const machine = iMc >= 0 ? cellStr(row[iMc]) : ''
    if (!pmlist && !legacy && !machine) continue

    const mntRaw = iMnt >= 0 ? cellStr(row[iMnt]) : ''
    const taskRaw = iTask >= 0 ? cellStr(row[iTask]) : ''
    const mntplan = mntRaw || taskRaw || legacy || '—'
    const tasklist = taskRaw || mntRaw || legacy

    out.push({
      sheet: sheetName,
      zone: zone || '—',
      machineList: machineList || machine || '—',
      mntplan,
      tasklist,
      legacy: legacy || '—',
      machine: machine || '—',
      pmlist,
      pmday: iDays >= 0 ? toNum(row[iDays]) : undefined,
      machinestatus: iStop >= 0 ? toNum(row[iStop]) : iRun >= 0 ? toNum(row[iRun]) : undefined,
      pmmin: iMin >= 0 ? toNum(row[iMin]) : undefined,
      pmman: iMan >= 0 ? toNum(row[iMan]) : undefined,
      gls: iGls >= 0 ? cellStr(row[iGls]) : undefined,
      plan: iPlan >= 0 ? cellStr(row[iPlan]) : undefined,
      freqhour: iHour >= 0 ? toNum(row[iHour]) : undefined,
      runhr: iRunHr >= 0 ? toNum(row[iRunHr]) : undefined,
      mpoint: iMpoint >= 0 ? cellStr(row[iMpoint]) : undefined,
    })
  }
  return out
}

export function parsePmMasterProcessSheet(
  values: unknown[][],
  sheetName: string,
): PmMasterProcessRow[] {
  if (SKIP_SHEETS.test(sheetName.trim())) return []
  const header = findHeaderRow(values)
  if (!header) return []
  return parseDataRows(values, header.rowIndex, header.headers, sheetName)
}

export async function parsePmMasterProcessWorkbook(
  file: File,
): Promise<{ sheets: string[]; rows: PmMasterProcessRow[] }> {
  const XLSX = await import('xlsx')
  const buf = await file.arrayBuffer()
  const wb = XLSX.read(buf, { type: 'array', cellDates: false })
  const sheets = wb.SheetNames.filter((n) => !SKIP_SHEETS.test(n.trim()))
  const rows: PmMasterProcessRow[] = []
  for (const name of wb.SheetNames) {
    if (SKIP_SHEETS.test(name.trim())) continue
    const ws = wb.Sheets[name]
    if (!ws) continue
    const values = XLSX.utils.sheet_to_json(ws, {
      header: 1,
      blankrows: false,
      defval: '',
    }) as unknown[][]
    rows.push(...parsePmMasterProcessSheet(values, name))
  }
  return { sheets, rows }
}

export function pmMasterRowsToTasklistImport(
  rows: PmMasterProcessRow[],
  discipline: PmMasterDiscipline,
): TasklistImportRow[] {
  return rows
    .filter((r) => r.pmlist.trim())
    .map((r) => ({
      wkctrtype: legacyWkctrtype(r.legacy, discipline),
      zone: r.zone === '—' ? '' : r.zone,
      machineList: r.machineList === '—' ? r.machine : r.machineList,
      mntplan: r.mntplan,
      tasklist: r.tasklist,
      legacy: r.legacy,
      machine: r.machine,
      pmlist: r.pmlist,
      pmday: r.pmday,
      machinestatus: r.machinestatus,
      pmmin: r.pmmin,
      pmman: r.pmman,
      gls: r.gls,
      plan: r.plan,
      freqhour: r.freqhour,
      runhr: r.runhr,
      mpoint: r.mpoint,
    }))
    .filter(
      (r) =>
        r.zone &&
        r.mntplan &&
        r.tasklist &&
        r.legacy &&
        r.machine &&
        r.pmlist &&
        r.wkctrtype,
    )
}

export function isPmMasterProcessFileName(name: string): boolean {
  const n = name.toLowerCase()
  return n.includes('master pm') || n.includes('master pm process') || n.includes('master pm packing')
}

export const PM_MASTER_DISCIPLINE_LABELS: Record<PmMasterDiscipline, string> = {
  EE: 'EE 2026',
  ME: 'ME 2026',
  PK: 'PACKING 2026',
}

export const PM_MASTER_DEFAULT_FILES: Record<PmMasterDiscipline, string> = {
  EE: '01-MASTER PM PROCESS EE 2026.xlsx',
  ME: '02-MASTER PM PROCESS ME 2026.xlsx',
  PK: '03-MASTER PM PACKING 2026.xlsx',
}
