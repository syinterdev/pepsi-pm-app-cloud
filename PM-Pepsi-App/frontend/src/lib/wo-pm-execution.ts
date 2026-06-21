import { BRAND_CALENDAR } from '@/lib/brand-palette'

/** สถานะการทำงาน PM หลังออกแผน — ตรง backend `wo-pm-execution.ts` */
export type PmExecutionStatus = 'in_progress' | 'done' | 'closed'

export const PM_EXECUTION_META: Record<
  PmExecutionStatus,
  { color: string; className: string }
> = {
  in_progress: {
    color: BRAND_CALENDAR.inProgress,
    className: 'app-status-badge app-status-badge--progress',
  },
  done: {
    color: BRAND_CALENDAR.completed,
    className: 'app-status-badge app-status-badge--success',
  },
  closed: {
    color: BRAND_CALENDAR.completed,
    className: 'app-status-badge app-status-badge--success',
  },
}

export function resolvePmExecutionStatus(input: {
  syst?: string | null
  percentClose?: number | null
  hasConfirm?: number | boolean | null
  confirmQcStatus?: string | null
}): PmExecutionStatus {
  const syst = (input.syst ?? '').trim().toUpperCase()
  if (syst !== 'CRTD' && syst !== 'REL') {
    return 'closed'
  }

  const pct = Math.max(0, Math.min(100, Number(input.percentClose ?? 0)))
  const qc = (input.confirmQcStatus ?? '').trim().toLowerCase()
  const hasConfirm =
    input.hasConfirm === true ||
    (typeof input.hasConfirm === 'number' && input.hasConfirm > 0)

  if (qc === 'approved' || pct >= 100) {
    return 'done'
  }

  if (hasConfirm && pct > 0) {
    return 'in_progress'
  }

  return 'in_progress'
}
