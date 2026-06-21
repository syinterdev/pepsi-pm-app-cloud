/** SAP / customer template column headers — must match Export_Confirm (26May).xlsx */
export const CONFIRMATION_SAP_HEADERS = [
  '',
  'Comfirmation',
  'Order',
  'Operation',
  'SubO',
  'Ca..',
  'Split',
  'Wrk Ctr',
  'Act.Work',
  'unit',
  'Start date Exe.',
  'End Date Exe.',
  'Start Execute',
  'End Execute',
] as const

export const CONFIRMATION_EXPORT_SHEET_NAME = 'Worksheet'

export type ConfirmationExportRowCore = {
  no: number
  confirmation: string
  wkorder: string
  opac: string
  subO: string
  ca: string
  split: string
  wkctr: string
  timewk: number
  unitc: string
  startDateExe: string
  endDateExe: string
  startExecute: string
  endExecute: string
}

export function formatDdMmYyyyCompact(sec: number): string {
  if (!Number.isFinite(sec) || sec <= 0) return ''
  const d = new Date(sec * 1000)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = String(d.getFullYear())
  return `${dd}${mm}${yyyy}`
}

export function formatHhMm(sec: number): string {
  if (!Number.isFinite(sec) || sec <= 0) return ''
  const d = new Date(sec * 1000)
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${hh}:${min}`
}

/** Round minutes to 2 decimals for API / web display. */
export function formatActWorkMinutes(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.round(value * 100) / 100
}

/** Operation column — customer template uses `10` not `0010`. */
export function formatOpacDisplay(opac: string | number | null | undefined): string {
  const raw = opac != null ? String(opac).trim() : ''
  if (!raw) return ''
  const n = Number(raw)
  if (Number.isFinite(n) && n > 0) return String(Math.trunc(n))
  return raw
}

export function mapCloseEpochsToExportFields(stdate: number, endate: number) {
  return {
    startDateExe: formatDdMmYyyyCompact(stdate),
    endDateExe: formatDdMmYyyyCompact(endate),
    startExecute: formatHhMm(stdate),
    endExecute: formatHhMm(endate),
  }
}

export function buildConfirmationExportRow(
  idx: number,
  input: {
    wkorder: string | null | undefined
    opac: string | number | null | undefined
    wkctr: string | null | undefined
    timewk: number | string | null | undefined
    unitc: string | null | undefined
    stdate: number | string | null | undefined
    endate: number | string | null | undefined
    confirmation?: string | null
  },
): ConfirmationExportRowCore {
  const stdate = input.stdate != null && input.stdate !== '' ? Number(input.stdate) : 0
  const endate = input.endate != null && input.endate !== '' ? Number(input.endate) : 0
  const dates = mapCloseEpochsToExportFields(stdate, endate)
  return {
    no: idx + 1,
    confirmation: input.confirmation?.trim() ?? '',
    wkorder: input.wkorder?.trim() ?? '',
    opac: formatOpacDisplay(input.opac),
    subO: '',
    ca: '',
    split: '',
    wkctr: input.wkctr?.trim() ?? '',
    timewk: formatActWorkMinutes(
      input.timewk != null && input.timewk !== '' ? Number(input.timewk) : 0,
    ),
    unitc: input.unitc?.trim() || 'Min',
    ...dates,
  }
}

export function confirmationExportRowToAoa(row: ConfirmationExportRowCore): (string | number)[] {
  const opacNum = Number(row.opac)
  const opac = Number.isFinite(opacNum) && opacNum > 0 ? opacNum : row.opac
  return [
    row.no,
    row.confirmation,
    row.wkorder,
    opac,
    row.subO,
    row.ca,
    row.split,
    row.wkctr,
    row.timewk,
    row.unitc,
    row.startDateExe,
    row.endDateExe,
    row.startExecute,
    row.endExecute,
  ]
}

export function buildConfirmationExportAoa(rows: ConfirmationExportRowCore[]): (string | number)[][] {
  return [Array.from(CONFIRMATION_SAP_HEADERS), ...rows.map(confirmationExportRowToAoa)]
}
