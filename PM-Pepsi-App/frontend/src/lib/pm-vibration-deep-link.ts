import type { WorkOrderTaskListItemApi } from '@/api/schemas'

export type PmTaskFocus = {
  machine: string
  pmlist: string
}

function norm(value: string): string {
  return value.trim().toLowerCase()
}

/** Match task by machine + pmlist (trim · case-insensitive). */
export function matchesPmTask(
  task: Pick<WorkOrderTaskListItemApi, 'machine' | 'pmlist'>,
  machine: string,
  pmlist: string,
): boolean {
  const m = norm(machine)
  const p = norm(pmlist)
  if (!m && !p) return false
  const tm = norm(task.machine)
  const tp = norm(task.pmlist)
  if (m && p) return tm === m && tp === p
  if (m) return tm === m
  return tp === p
}

export function findMeasureTask(
  tasks: readonly WorkOrderTaskListItemApi[],
  machine: string,
  pmlist: string,
): WorkOrderTaskListItemApi | undefined {
  if (!machine.trim() && !pmlist.trim()) return undefined
  return tasks.find((t) => matchesPmTask(t, machine, pmlist))
}

/** DOM id for scroll-into-view / highlight on `/pm-vibration`. */
export function pmTaskAnchorId(machine: string, pmlist: string): string {
  const raw = `${norm(machine)}|${norm(pmlist)}`
  const safe = raw.replace(/[^a-z0-9|_-]+/g, '-').replace(/^-+|-+$/g, '')
  return `pm-task-${safe || 'unknown'}`
}

export function buildPmVibrationDeepLink(opts: {
  wkorder: string
  machine?: string
  pmlist?: string
}): string {
  const params = new URLSearchParams()
  params.set('wkorder', opts.wkorder.trim())
  const machine = opts.machine?.trim()
  const pmlist = opts.pmlist?.trim()
  if (machine) params.set('machine', machine)
  if (pmlist) params.set('pmlist', pmlist)
  return `/pm-vibration?${params.toString()}`
}

export function parsePmTaskFocusFromSearchParams(
  params: URLSearchParams,
): PmTaskFocus | null {
  const machine = params.get('machine')?.trim() ?? ''
  const pmlist = params.get('pmlist')?.trim() ?? ''
  if (!machine && !pmlist) return null
  return { machine, pmlist }
}
