/** แผนเขียว (TECO/ปิดแล้ว) ห้าม Move — sync กับ backend `isPlanMovableStatus` */
export const PLAN_NOT_MOVABLE_MESSAGE =
  'แผนสีเขียว (TECO/ปิดแล้ว) ย้ายแผนไม่ได้ — เฉพาะสถานะ CRTD/REL'

export function isPlanMovableStatus(syst: string | undefined): boolean {
  const s = (syst ?? '').trim().toUpperCase()
  return s === 'CRTD' || s === 'REL'
}
