import { z } from 'zod'

export const woPmFormHeaderSchema = z.object({
  wkorder: z.string(),
  printMetaLine: z.string(),
  functionalLocation: z.string(),
  equipment: z.string(),
  descriptionLine1: z.string(),
  descriptionLine2: z.string(),
  /** @deprecated UI Phase 1 — send empty */
  workCentre: z.string(),
  startDate: z.string(),
  /** @deprecated UI Phase 1 — send empty */
  endDate: z.string(),
  activityType: z.string(),
  revision: z.string(),
  /** @deprecated UI Phase 1 — send empty */
  priority: z.string(),
  /** Man from Master Plan `pmman` (first task) */
  man: z.string(),
  /** หยุด | เดิน from `machinestatus` */
  machineRunStatus: z.string(),
  /** @deprecated use `man` */
  techId: z.string(),
  /** @deprecated use `machineRunStatus` */
  sysCond: z.string(),
  /** @deprecated UI Phase 1 — send empty */
  description: z.string(),
  /** @deprecated UI Phase 1 — send empty */
  permitStatus: z.string(),
  /** IW37N MntPlan */
  headerShortText: z.string(),
  /** @deprecated UI Phase 1 — send empty */
  objectList: z.string(),
  operationNumber: z.string(),
  operationWorkCentre: z.string(),
  operationText: z.string(),
  unloadingPoint: z.string(),
  operationLongText: z.array(
    z.object({
      lineNo: z.number().int(),
      machine: z.string(),
      pmlist: z.string(),
    }),
  ),
})

export type WoPmFormHeader = z.infer<typeof woPmFormHeaderSchema>

type RowLike = {
  wkorder: string
  mntplan?: string | null
  functionalloc: string | null
  funcdescrip?: string | null
  mat: string | null
  equipment: string | null
  equdescrip: string | null
  ostdescription: string | null
  operationshorttext: string | null
  wkctr: string | null
  bscstart: string | number | null
  actfinish: string | number | null
  untime: string | number | null
  systemstatus: string | null
  syst: string | null
  opac: string | null
  wktype: string | null
  team: string | null
}

export type WoPmFormTaskLike = {
  mat: string | null
  matdescrip: string | null
  idwkctrtype?: string | null
  wkctrtype?: string | null
  legacy?: string | null
  zone?: string | null
  machine?: string | null
  pmlist?: string | null
  pmman?: number | string | null
  machinestatus?: number | null
  pmday?: number | null
}

/** SAP print style dd.MM.yyyy */
export function formatSapPrintDate(isoYmd: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoYmd.trim())
  if (!m) return isoYmd
  return `${m[3]}.${m[2]}.${m[1]}`
}

function unixToIsoDate(sec: string | number | null | undefined): string {
  if (sec == null || sec === '') return ''
  const n = Number(sec)
  if (!Number.isFinite(n) || n <= 0) return ''
  const d = new Date(n * 1000)
  const y = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${mo}-${day}`
}

function activityTypeLabel(row: RowLike, firstTask?: WoPmFormTaskLike | null): string {
  const mat = firstTask?.mat?.trim() || ''
  const desc = firstTask?.matdescrip?.trim() || ''
  if (mat && desc) return `${mat} ${desc}`
  if (desc) return desc
  if (mat) return mat
  return row.wktype?.trim() ?? ''
}

export function formatDaysWeek(pmday: number | null | undefined): string {
  if (pmday == null || !Number.isFinite(pmday) || pmday <= 0) return ''
  return `${Math.trunc(pmday)}W`
}

export function formatPlanLabel(task: WoPmFormTaskLike | null | undefined): string {
  if (!task) return ''
  const craft = task.idwkctrtype?.trim() || task.wkctrtype?.trim() || ''
  const zone = task.zone?.trim() || ''
  const legacy = task.legacy?.trim() || ''
  const zonePart = zone || task.machine?.trim() || ''
  let base = [craft, zonePart].filter(Boolean).join(' ').trim()
  if (legacy && base && !base.includes(legacy)) base = `${base} (${legacy})`
  else if (legacy && !base) base = legacy
  return base
}

/** Operation Text from Master Plan (pmday + plan label under mntplan). */
export function buildOperationTextFromTask(task: WoPmFormTaskLike | null | undefined): string {
  const week = formatDaysWeek(task?.pmday ?? null)
  const label = formatPlanLabel(task)
  if (week && label) return `${week} - ${label}`
  return label || week
}

/** @deprecated IW37N-based — kept for legacy callers/tests */
export function buildOperationText(row: RowLike, techId: string): string {
  const ost = row.ostdescription?.trim() ?? ''
  const tech = techId.trim()
  const header = row.operationshorttext?.trim() ?? ''

  if (!ost) return header

  if (/^\d+[A-Z]?\s*-\s/.test(ost)) {
    return tech && !ost.includes(`(${tech})`) ? `${ost} (${tech})` : ost
  }

  const tail = header.split('&').pop()?.trim() ?? header
  const discMatch = /-([A-Z]{2})\s*$/.exec(tail)
  const discipline = discMatch?.[1] ?? ''
  const interval = row.wktype?.trim() === 'ZB02' ? '2M' : ''
  const prefix = [interval, discipline].filter(Boolean).join(' - ')
  const base = prefix ? `${prefix} ${ost}` : ost
  return tech ? `${base} (${tech})` : base
}

export function formatManValue(pmman: number | string | null | undefined): string {
  if (pmman == null || pmman === '') return '—'
  const n = typeof pmman === 'number' ? pmman : Number(String(pmman).trim())
  if (Number.isFinite(n) && n > 0) return String(Math.trunc(n))
  const s = String(pmman).trim()
  return s || '—'
}

export function formatMachineRunStatus(machinestatus: number | null | undefined): string {
  if (machinestatus == null) return '—'
  if (machinestatus === 1) return 'หยุด'
  return 'เดิน'
}

function buildPrintMetaLine(startDatePrint: string, wkorder: string): string {
  const datePart = startDatePrint || ''
  const docNo = wkorder.trim()
  return [datePart, 'คณะกรรมการควบคุม', docNo, 'Original 0 Page 1'].filter(Boolean).join(' ')
}

export function buildOperationLongText(
  tasks: readonly Pick<WoPmFormTaskLike, 'machine' | 'pmlist'>[],
): WoPmFormHeader['operationLongText'] {
  return tasks
    .map((task, index) => ({
      lineNo: index + 1,
      machine: task.machine?.trim() ?? '',
      pmlist: task.pmlist?.trim() ?? '',
    }))
    .filter((row) => row.machine || row.pmlist)
}

export function buildWoPmFormHeader(
  row: RowLike,
  opts?: {
    firstTask?: WoPmFormTaskLike | null
    allTasks?: readonly WoPmFormTaskLike[]
    materialCount?: number
  },
): WoPmFormHeader {
  const firstTask = opts?.firstTask ?? null
  const startIso = unixToIsoDate(row.bscstart)
  const startDate = startIso ? formatSapPrintDate(startIso) : ''
  const man = formatManValue(firstTask?.pmman)
  const machineRunStatus = formatMachineRunStatus(firstTask?.machinestatus ?? null)
  const mntplan = row.mntplan?.trim() ?? ''
  const operationText = buildOperationTextFromTask(firstTask)
  const operationLongText = buildOperationLongText(opts?.allTasks ?? (firstTask ? [firstTask] : []))

  return {
    wkorder: row.wkorder?.trim() ?? '',
    printMetaLine: buildPrintMetaLine(startDate, row.wkorder?.trim() ?? ''),
    functionalLocation: row.functionalloc?.trim() ?? '',
    equipment: row.equipment?.trim() || row.mat?.trim() || '',
    descriptionLine1: row.funcdescrip?.trim() ?? '',
    descriptionLine2: row.equdescrip?.trim() ?? '',
    workCentre: '',
    startDate,
    endDate: '',
    activityType: activityTypeLabel(row, firstTask),
    revision: '',
    priority: '',
    man,
    machineRunStatus,
    techId: man === '—' ? '' : man,
    sysCond: machineRunStatus,
    description: '',
    permitStatus: '',
    headerShortText: mntplan,
    objectList: '',
    operationNumber: row.opac?.trim() || '0010',
    operationWorkCentre: row.wkctr?.trim() ?? '',
    operationText,
    unloadingPoint: '',
    operationLongText,
  }
}
