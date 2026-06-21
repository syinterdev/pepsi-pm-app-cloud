import { isPlanMovableStatus } from '../services/scheduling-shared.js'

const NO_WO_PLACEHOLDERS = new Set(['0', '-', '—', 'N/A', 'NA', 'TBD', 'NONE', 'NULL'])

/** มีเลข WO จริง (สไลด์ลูกค้า — ส้ม · Reason บังคับเมื่อย้าย) */
export function hasCalendarWorkOrderNumber(wkorder: string | null | undefined): boolean {
  const w = (wkorder ?? '').trim()
  if (!w) return false
  if (NO_WO_PLACEHOLDERS.has(w.toUpperCase())) return false
  return true
}

/** วันที่แสดงบนปฏิทินเลยกำหนดแล้ว (เทียบสไลด์ — สีแดง) */
export function isCalendarDisplayDateOverdue(
  displayUnix: number,
  now: Date = new Date(),
): boolean {
  const d = new Date(displayUnix * 1000)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const displayDay = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  return displayDay.getTime() < today.getTime()
}

/** TECO ใน SAP แต่ยังไม่ปิดงาน/confirm ในโปรแกรม — แสดงระฆังบน block */
export function resolveCalendarTecoBellAlert(input: {
  syst?: string | null
  percentClose?: string | number | null
  hasConfirm?: string | number | boolean | null
  confirmQcStatus?: string | null
}): boolean {
  const syst = (input.syst ?? '').trim().toUpperCase()
  if (syst !== 'TECO') return false

  const raw = input.percentClose
  const pct =
    raw == null || raw === ''
      ? 0
      : Math.max(0, Math.min(100, Number(raw)))
  const qc = (input.confirmQcStatus ?? '').trim().toLowerCase()
  const hasConfirm =
    input.hasConfirm === true ||
    input.hasConfirm === 'true' ||
    input.hasConfirm === '1' ||
    (typeof input.hasConfirm === 'number' && input.hasConfirm > 0) ||
    (typeof input.hasConfirm === 'string' &&
      input.hasConfirm.trim() !== '' &&
      input.hasConfirm !== '0' &&
      input.hasConfirm.toLowerCase() !== 'false')

  if (qc === 'approved' || pct >= 100) return false
  return true
}

export function hasCalendarPlanMove(input: {
  cday?: string | number | null
  mpcount?: number | null
  syst?: string | null
}): boolean {
  const cday = input.cday != null && input.cday !== '' ? Number(input.cday) : 0
  const mpcount = input.mpcount != null ? Number(input.mpcount) : 0
  const syst = (input.syst ?? '').trim()
  return cday > 0 && mpcount >= 1 && (syst === 'REL' || syst === 'CRTD')
}

/**
 * เหตุผลย้ายแผน — สไลด์ลูกค้า:
 * · แดง (เลยกำหนด) → บังคับ
 * · ส้ม (ยังไม่ถึงวัน + มีเลข WO) → บังคับ
 * · น้ำเงิน (ประมาณการ · ยังไม่มี WO) → ไม่บังคับ
 */
export function resolveCalendarMoveReasonRequired(input: {
  syst?: string | null
  displayUnix: number
  wkorder?: string | null
  cday?: string | number | null
  mpcount?: number | null
}): boolean {
  if (!isPlanMovableStatus(input.syst)) return false
  if (isCalendarDisplayDateOverdue(input.displayUnix)) return true
  if (hasCalendarWorkOrderNumber(input.wkorder)) return true
  return false
}
