export type PmReadingKind = 'current_3phase' | 'vibration_dst_db'

/** Persist v3: vibration Dst/dB ใช้แค่ v1+v2 · กระแส 3 เฟส ต้องมี v3 */
export function normalizePmReadingV3ForWrite(
  kind: PmReadingKind,
  v3: number | null | undefined,
): number | null {
  if (kind === 'vibration_dst_db') return null
  if (v3 == null || !Number.isFinite(v3)) {
    throw new Error('V3_REQUIRED')
  }
  return v3
}

/** อ่านจาก DB — vibration v3 NULL หรือ legacy 0 → null */
export function mapPmReadingV3FromDb(
  kind: PmReadingKind,
  raw: string | number | null | undefined,
): number | null {
  if (raw == null || raw === '') {
    return kind === 'vibration_dst_db' ? null : null
  }
  const n = Number(raw)
  if (!Number.isFinite(n)) return kind === 'vibration_dst_db' ? null : null
  if (kind === 'vibration_dst_db' && n === 0) return null
  return n
}
