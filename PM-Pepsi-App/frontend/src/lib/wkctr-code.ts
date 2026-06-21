/** รหัสช่าง Engineering — ใช้ฝั่ง Admin UI (สอดคล้อง backend wkctr-code.ts) */

export const ENG_WKCTR_PATTERN = /^(PAC|PRO|UTI)\d{3}$/



export function normalizeWkctrCode(raw: string): string {

  return raw.trim().toUpperCase()

}



export function isEngWkctrCode(code: string): boolean {

  return ENG_WKCTR_PATTERN.test(normalizeWkctrCode(code))

}



/** WorkCntr สำหรับแสดงผล — wkctr ก่อน; fallback legacy ที่ import ผิดคอลัมน์ */

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



export function isMissingEngWkctrCode(

  code: string | null | undefined,

  row?: { idwkctr?: string | null; surnamewkctr?: string | null },

): boolean {

  if (row) return !resolveWorkCntr({ wkctr: code, ...row })

  const v = (code ?? '').trim()

  if (!v) return true

  return !isEngWkctrCode(v)

}

