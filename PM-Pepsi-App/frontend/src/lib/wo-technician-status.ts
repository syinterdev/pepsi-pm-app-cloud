import { i18n } from '@/i18n'

export type TechnicianRowStatus = 'pending' | 'done'

export type WoTechnicianStatusRow = {
  wkctr: string
  displayName: string
  status: TechnicianRowStatus
  statusLabel: string
}

type Assignee = { kind: 'person' | 'group'; code: string; displayName: string }
type CloseRow = { wkctr: string; displayName: string }

export function buildWoTechnicianStatusRows(args: {
  workCenter?: string
  assignees?: Assignee[]
  personnelCloses?: CloseRow[]
  supervisorCloses?: CloseRow[]
}): WoTechnicianStatusRow[] {
  const doneCodes = new Set<string>()
  const names = new Map<string, string>()

  const markDone = (wkctr: string, displayName: string) => {
    const code = wkctr.trim()
    if (!code) return
    doneCodes.add(code)
    if (displayName.trim()) names.set(code, displayName.trim())
  }

  const remember = (wkctr: string, displayName: string) => {
    const code = wkctr.trim()
    if (!code) return
    if (!names.has(code) && displayName.trim()) names.set(code, displayName.trim())
    if (!names.has(code)) names.set(code, code)
  }

  for (const row of args.personnelCloses ?? []) markDone(row.wkctr, row.displayName)
  for (const row of args.supervisorCloses ?? []) markDone(row.wkctr, row.displayName)

  for (const a of args.assignees ?? []) {
    if (a.kind !== 'person') continue
    remember(a.code, a.displayName)
  }

  if (args.workCenter?.trim()) {
    remember(args.workCenter, args.workCenter)
  }

  for (const row of args.personnelCloses ?? []) remember(row.wkctr, row.displayName)
  for (const row of args.supervisorCloses ?? []) remember(row.wkctr, row.displayName)

  const codes = [...names.keys()].sort((a, b) => a.localeCompare(b, 'th'))
  return codes.map((wkctr) => {
    const done = doneCodes.has(wkctr)
    return {
      wkctr,
      displayName: names.get(wkctr) ?? wkctr,
      status: done ? 'done' : 'pending',
      statusLabel: done
        ? i18n.t('technicianStatus.done', { ns: 'scheduling' })
        : i18n.t('technicianStatus.pending', { ns: 'scheduling' }),
    }
  })
}
