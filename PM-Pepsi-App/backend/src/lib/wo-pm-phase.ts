/**
 * สถานะ PM ตามประชุมครั้งที่ 2 — แยกจาก wktype (ZB/ZD)
 * Create = CRTD · REL = งานเปิด · Confirm = ปิดแล้ว (TECO/อื่นๆ)
 */
export type WoPmPhase = 'create' | 'rel' | 'confirm'

export const woPmPhaseSchema = ['create', 'rel', 'confirm'] as const

export function resolveWoPmPhase(syst: string | null | undefined): WoPmPhase {
  const s = (syst ?? '').trim().toUpperCase()
  if (s === 'CRTD') return 'create'
  if (s === 'REL') return 'rel'
  return 'confirm'
}
