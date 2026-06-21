import { inferPmMeasurementKind } from './pm-measurement-kind.js'

export type MasterPlanLinkKeys = {
  zone: string
  machineList: string
  mntplan: string
  tasklist: string
  legacy: string
  machine: string
  pmlist: string
  mpoint: string
}

function normHeader(header: string): string {
  return header.trim().toLowerCase().replace(/\s+/g, ' ')
}

function pickByHeaders(
  columnHeaders: string[],
  cells: Record<string, string>,
  display: Record<string, string>,
  matchers: Array<(h: string) => boolean>,
): string {
  for (const header of columnHeaders) {
    const h = normHeader(header)
    if (!matchers.some((m) => m(h))) continue
    const value = (display[header] ?? cells[header] ?? '').trim()
    if (value) return value
  }
  for (const [header, raw] of Object.entries(cells)) {
    const h = normHeader(header)
    if (!matchers.some((m) => m(h))) continue
    const value = (display[header] ?? raw ?? '').trim()
    if (value) return value
  }
  return ''
}

/** Semantic keys from Excel row cells — column names stay verbatim in DB. */
export function extractMasterPlanLinkKeys(
  columnHeaders: string[],
  cells: Record<string, string>,
  display: Record<string, string> = cells,
): MasterPlanLinkKeys {
  return {
    zone: pickByHeaders(columnHeaders, cells, display, [(h) => h === 'zone']),
    machineList: pickByHeaders(columnHeaders, cells, display, [(h) => h.includes('machine list')]),
    mntplan: pickByHeaders(columnHeaders, cells, display, [
      (h) =>
        h.includes('maintenance plan') ||
        h === 'sap code' ||
        h === 'mant' ||
        h.includes('mnt plan') ||
        h === 'mntplan',
    ]),
    tasklist: pickByHeaders(columnHeaders, cells, display, [(h) => h.includes('task list')]),
    legacy: pickByHeaders(columnHeaders, cells, display, [
      (h) => h === 'legacy' || h === 'lagacy',
    ]),
    machine: pickByHeaders(columnHeaders, cells, display, [(h) => h === 'm/c' || h === 'mc']),
    pmlist: pickByHeaders(columnHeaders, cells, display, [(h) => h.includes('pm list')]),
    mpoint: pickByHeaders(columnHeaders, cells, display, [
      (h) => h.includes('measurement') || h === 'mpoint' || h.includes('m point'),
    ]),
  }
}

export function suggestsPmCurrent3Phase(pmlist: string, mpoint?: string): boolean {
  return inferPmMeasurementKind({ pmlist, mpoint }) === 'current_3phase'
}

export function suggestsPmVibrationDstDb(pmlist: string, mpoint?: string): boolean {
  return inferPmMeasurementKind({ pmlist, mpoint }) === 'vibration_dst_db'
}

export function resolvePmMeasurementSuggestions(input: {
  pmlist?: string | null
  mpoint?: string | null
}): { current3Phase: boolean; vibrationDstDb: boolean } {
  const kind = inferPmMeasurementKind(input)
  return {
    current3Phase: kind === 'current_3phase',
    vibrationDstDb: kind === 'vibration_dst_db',
  }
}

/** @deprecated Use suggestsPmCurrent3Phase / suggestsPmVibrationDstDb */
export function suggestsPm3Phase(pmlist: string): boolean {
  return suggestsPmCurrent3Phase(pmlist) || suggestsPmVibrationDstDb(pmlist)
}
