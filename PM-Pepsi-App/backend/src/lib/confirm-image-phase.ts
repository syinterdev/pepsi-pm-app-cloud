/** รูปปิดงาน Before / After — ประชุม ~5 รูปต่อฝั่ง (อนุญาตสูงสุดต่อ WO) */
export const CONFIRM_IMAGE_PHASES = ['before', 'after'] as const
export type ConfirmImagePhase = (typeof CONFIRM_IMAGE_PHASES)[number]

/** แนะนำต่อลูกค้า (ไม่บังคับ — ลูกค้ายืนยันไม่จำกัดจำนวน) */
export const CONFIRM_IMAGE_RECOMMENDED_PER_PHASE = 5

export function parseConfirmImagePhase(raw: unknown): ConfirmImagePhase | null {
  const s = String(raw ?? '')
    .trim()
    .toLowerCase()
  if (s === 'before' || s === 'after') return s
  return null
}

export function normalizeConfirmImageCaption(raw: unknown): string {
  return String(raw ?? '').trim().slice(0, 500)
}
