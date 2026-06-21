import { BRAND_CALENDAR } from './brand-palette.js'

/**
 * สถานะการทำงาน PM หลังออกแผน — กำลังทำ · เสร็จแล้ว · ปิดงาน
 * แยกจาก wo-pm-phase (CRTD/REL/Confirm ตาม SAP syst)
 */
export type PmExecutionStatus = 'in_progress' | 'done' | 'closed'

export const pmExecutionStatusSchema = ['in_progress', 'done', 'closed'] as const

export const PM_EXECUTION_META: Record<
  PmExecutionStatus,
  { label: string; title: string; color: string }
> = {
  in_progress: {
    label: 'กำลังทำ',
    title: 'งานเปิด — ช่างกำลังดำเนินการ',
    color: BRAND_CALENDAR.inProgress,
  },
  done: {
    label: 'เสร็จแล้ว',
    title: 'ปิดงานครบหรือ QC อนุมัติแล้ว — รอปิด SAP',
    color: BRAND_CALENDAR.completed,
  },
  closed: {
    label: 'ปิดงาน',
    title: 'ปิดใน SAP แล้ว (TECO/CLSD ฯลฯ)',
    color: BRAND_CALENDAR.completed,
  },
}

function coalescePercentClose(v: number | string | null | undefined): number {
  if (v == null || v === '') return 0
  const n = Number(v)
  return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 0
}

function coalesceHasConfirm(v: number | boolean | string | null | undefined): boolean {
  if (v === true) return true
  if (typeof v === 'number' && v > 0) return true
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase()
    if (!s || s === '0' || s === 'false' || s === 'f') return false
    const n = Number(s)
    return Number.isFinite(n) ? n > 0 : true
  }
  return false
}

export function resolvePmExecutionStatus(input: {
  syst?: string | null
  percentClose?: number | string | null
  hasConfirm?: number | boolean | string | null
  confirmQcStatus?: string | null
}): PmExecutionStatus {
  const syst = (input.syst ?? '').trim().toUpperCase()
  if (syst !== 'CRTD' && syst !== 'REL') {
    return 'closed'
  }

  const pct = coalescePercentClose(input.percentClose)
  const qc = (input.confirmQcStatus ?? '').trim().toLowerCase()
  const hasConfirm = coalesceHasConfirm(input.hasConfirm)

  if (qc === 'approved' || pct >= 100) {
    return 'done'
  }

  if (hasConfirm && pct > 0) {
    return 'in_progress'
  }

  return 'in_progress'
}
