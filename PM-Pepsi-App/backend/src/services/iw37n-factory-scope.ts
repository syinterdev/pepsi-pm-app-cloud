import { FACTORY_CODE } from './scheduling-shared.js'
import type { Iw37nImportRow } from './iw37n-parser.js'

/** เงื่อนไข SQL โรงงาน (functionalloc / funcdescrip 7151) */
export function factoryScopeSql(columnPrefix = ''): string {
  const c = columnPrefix ? `${columnPrefix}.` : ''
  return `(
    ${c}functionalloc ILIKE $factory
    OR ${c}funcdescrip ILIKE $factory
  )`
}

/** แทนที่ placeholder $factory ด้วย parameter index */
export function bindFactoryScope(params: unknown[]): number {
  return params.push(`%${FACTORY_CODE}%`)
}

export function rowMatchesFactoryScope(functionalloc: string, funcdescrip: string): boolean {
  const code = FACTORY_CODE
  return functionalloc.includes(code) || funcdescrip.includes(code)
}

/**
 * ไฟล์ SAP ALV มักไม่มีคอลัมน์ Functional loc. (รหัส) — ใส่ prefix 7151- ให้ผ่าน filter ปฏิทิน
 * (โรงงานลำพูน single-site; รหัสจริงมาจาก legacy export เช่น PI-TH-7151-...)
 */
export function ensureFactoryScopeFunctionalloc(row: Iw37nImportRow): Iw37nImportRow {
  const fl = row.functionalloc.trim()
  const fd = row.funcdescrip.trim()
  if (rowMatchesFactoryScope(fl, fd)) {
    return {
      ...row,
      functionalloc: fl.includes(FACTORY_CODE) ? fl : fd,
      funcdescrip: fd || fl,
    }
  }
  const desc = fd || fl || row.equdescrip.trim() || row.equipment.trim()
  if (!desc) return row
  const synthetic = `7151-${desc}`.slice(0, 64)
  return {
    ...row,
    functionalloc: synthetic,
    funcdescrip: fd || fl || desc,
    equdescrip: row.equdescrip || (fl && fl !== fd ? fl : ''),
  }
}
