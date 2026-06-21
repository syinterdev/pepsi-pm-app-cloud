/** รหัสช่าง Engineering — PAC/PRO/UTI + 3 หลัก (WorkCntr จาก SAP/ลูกค้า) */
export const ENG_WKCTR_PATTERN = /^(PAC|PRO|UTI)\d{3}$/

export function normalizeWkctrCode(raw: string): string {
  return raw.trim().toUpperCase()
}

export function isEngWkctrCode(code: string): boolean {
  return ENG_WKCTR_PATTERN.test(normalizeWkctrCode(code))
}

/** WorkCntr ที่ใช้แสดง/ join — wkctr ก่อน; fallback legacy import ผิดคอลันน์ */
export function resolveWorkCntr(row: {
  wkctr?: string | null
  idwkctr?: string | null
  surnamewkctr?: string | null
}): string {
  const primary = normalizeWkctrCode(row.wkctr ?? '')
  if (isEngWkctrCode(primary)) return primary
  const fromSurname = normalizeWkctrCode(row.surnamewkctr ?? '')
  if (isEngWkctrCode(fromSurname)) return fromSurname
  const fromId = normalizeWkctrCode(row.idwkctr ?? '')
  if (isEngWkctrCode(fromId)) return fromId
  return ''
}

export class WkctrCodeConflictError extends Error {
  constructor(
    public readonly wkctr: string,
    public readonly existingIdwkctr: string,
  ) {
    super(`รหัสช่าง ${wkctr} ถูกใช้โดย ${existingIdwkctr} แล้ว`)
    this.name = 'WkctrCodeConflictError'
  }
}
