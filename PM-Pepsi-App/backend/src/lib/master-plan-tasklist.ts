import { applyFillDownDisplay } from './master-plan-display.js'
import { extractMasterPlanLinkKeys } from './master-plan-row-links.js'
import type { MasterPlanDiscipline } from './master-plan-parse.js'

export type MasterPlanTasklistRow = {
  wkctrtype: string
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

function normHeader(header: string): string {
  return header.trim().toLowerCase().replace(/\s+/g, ' ')
}

function toNum(v: string | undefined): number | undefined {
  if (v == null || v === '') return undefined
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}

function pickCell(
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
  return ''
}

export function legacyWkctrtype(legacy: string, discipline: MasterPlanDiscipline): string {
  const parts = legacy.split('-').filter(Boolean)
  const last = parts[parts.length - 1]?.toUpperCase() ?? ''
  if (['EE', 'ME', 'OP', 'PK', 'UT', 'WC', 'FC', 'FL', 'FI', 'MI', 'ML', 'NI', 'MC', 'NC', 'QI', 'WL'].includes(last)) {
    if (['EE', 'ME', 'OP', 'PK', 'UT'].includes(last)) return last
    return `${last}-${discipline}`
  }
  return discipline
}

export function masterPlanRowToTasklist(
  columnHeaders: string[],
  cells: Record<string, string>,
  display: Record<string, string>,
  discipline: MasterPlanDiscipline,
): MasterPlanTasklistRow | null {
  const keys = extractMasterPlanLinkKeys(columnHeaders, cells, display)
  const zone = keys.zone.trim()
  const machineList = keys.machineList.trim()
  const legacy = keys.legacy.trim()
  const pmlist = keys.pmlist.trim()
  const machine = keys.machine.trim()
  const mntRaw = keys.mntplan.trim()
  const taskRaw = keys.tasklist.trim()
  const mntplan = mntRaw || taskRaw || legacy
  const tasklist = taskRaw || mntRaw || legacy

  if (!pmlist.trim()) return null

  const pmday = toNum(
    pickCell(columnHeaders, cells, display, [
      (h) => h === 'days' || h.includes('freq (day)') || h === 'freq' || h === 'frequency',
    ]),
  )
  const pmmin = toNum(pickCell(columnHeaders, cells, display, [(h) => h === 'min']))
  const pmman = toNum(
    pickCell(columnHeaders, cells, display, [(h) => h === 'man' || h.includes('man hour')]),
  )
  const machinestatus = toNum(
    pickCell(columnHeaders, cells, display, [(h) => h === 'หยุด' || h === 'เดิน']),
  )
  const gls = pickCell(columnHeaders, cells, display, [(h) => h.includes('grease') || h.includes('lube')])
  const plan = pickCell(columnHeaders, cells, display, [(h) => h.includes('pm code') || h === 'plan'])
  const freqhour = toNum(
    pickCell(columnHeaders, cells, display, [(h) => h.includes('hour') || h.includes('freq hour')]),
  )
  const runhr = toNum(pickCell(columnHeaders, cells, display, [(h) => h.includes('run hr')]))
  const mpoint = pickCell(columnHeaders, cells, display, [(h) => h.includes('measurement')])

  const wkctrtype = legacyWkctrtype(legacy, discipline)
  const resolvedZone = zone || '—'
  const resolvedMachineList = machineList || machine || '—'
  const resolvedLegacy = legacy || '—'
  const resolvedMachine = machine || '—'

  if (
    !resolvedZone ||
    resolvedZone === '—' ||
    !mntplan ||
    mntplan === '—' ||
    !tasklist ||
    tasklist === '—' ||
    !resolvedLegacy ||
    resolvedLegacy === '—' ||
    !resolvedMachine ||
    resolvedMachine === '—' ||
    !wkctrtype
  ) {
    return null
  }

  return {
    wkctrtype,
    zone: resolvedZone === '—' ? '' : resolvedZone,
    machineList: resolvedMachineList === '—' ? resolvedMachine : resolvedMachineList,
    mntplan: mntplan === '—' ? '' : mntplan,
    tasklist: tasklist === '—' ? '' : tasklist,
    legacy: resolvedLegacy === '—' ? '' : resolvedLegacy,
    machine: resolvedMachine === '—' ? '' : resolvedMachine,
    pmlist,
    pmday,
    machinestatus,
    pmmin,
    pmman,
    gls: gls || undefined,
    plan: plan || undefined,
    freqhour,
    runhr,
    mpoint: mpoint || undefined,
  }
}

export function detailSheetRowsToTasklist(
  columnHeaders: string[],
  rows: Array<{ rowIndex: number; cells: Record<string, string> }>,
  discipline: MasterPlanDiscipline,
): { rows: MasterPlanTasklistRow[]; skipped: number } {
  const withDisplay = applyFillDownDisplay(rows, columnHeaders)
  const out: MasterPlanTasklistRow[] = []
  let skipped = 0

  for (let i = 0; i < rows.length; i++) {
    const cells = rows[i]!.cells
    const display = withDisplay[i]?.display ?? cells
    const mapped = masterPlanRowToTasklist(columnHeaders, cells, display, discipline)
    if (!mapped) {
      skipped++
      continue
    }
    out.push(mapped)
  }

  return { rows: out, skipped }
}
