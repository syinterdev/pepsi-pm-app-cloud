/**
 * MaintActivityType — Type ZB02 (ลูกค้า)
 * แหล่ง: MaintActivityType 19 Entries (SAP)
 */
import { MAINT_ACTIVITY_TYPE_ZB02, type MaintActivityTypeRow } from '../data/maint-activity-type-zb02.js'

export type { MaintActivityTypeRow }
export { MAINT_ACTIVITY_TYPE_ZB02 }

const BY_MAT = new Map(MAINT_ACTIVITY_TYPE_ZB02.map((r) => [r.mat, r]))

export function lookupMaintActivityType(mat: string): MaintActivityTypeRow | null {
  const raw = (mat ?? '').trim()
  if (!raw) return null
  const padded = raw.padStart(3, '0')
  return BY_MAT.get(padded) ?? null
}

/** IW37N อาจเก็บ mat เป็น 1 / 01 / 001 */
export function expandMaintActivityMatCodes(codes: string[]): string[] {
  const out = new Set<string>()
  for (const raw of codes) {
    const c = (raw ?? '').trim()
    if (!c) continue

    const row = lookupMaintActivityType(c)
    if (row) {
      out.add(row.mat)
      const n = Number(row.mat)
      if (Number.isFinite(n)) {
        out.add(String(n))
        out.add(String(n).padStart(2, '0'))
      }
      continue
    }

    out.add(c)
    const n = Number(c)
    if (Number.isFinite(n) && c !== '') {
      out.add(String(n).padStart(3, '0'))
      out.add(String(n).padStart(2, '0'))
    }
  }
  return [...out]
}

export function listMaintActivityTypeFilterOptions(): Array<{ code: string; label: string }> {
  return MAINT_ACTIVITY_TYPE_ZB02.map((r) => ({
    code: r.mat,
    label: `${r.mat} = ${r.description}`,
  }))
}

export function formatMaintActivityTypeLabel(mat: string): string {
  const row = lookupMaintActivityType(mat)
  if (row) return `${row.mat} = ${row.description}`
  return (mat ?? '').trim()
}

/** กรองประเภทงาน — MaintActivityType (mat) หรือ legacy ZB* (wktype) */
export function appendWorkTypeFilter(
  tableAlias: string,
  codes: string[] | undefined,
  params: unknown[],
  appendInFilter: (column: string, values: string[] | undefined, params: unknown[]) => string,
): string {
  const list = codes ?? []
  if (list.length === 0) return ''

  const prefix = tableAlias ? `${tableAlias}.` : ''
  const wktypes: string[] = []
  const mats = new Set<string>()

  for (const raw of list) {
    const c = (raw ?? '').trim()
    if (!c) continue
    if (/^ZB/i.test(c)) {
      wktypes.push(c.toUpperCase())
      continue
    }
    for (const m of expandMaintActivityMatCodes([c])) mats.add(m)
  }

  let sql = ''
  if (wktypes.length > 0) {
    sql += appendInFilter(`${prefix}wktype`, wktypes, params)
  }
  if (mats.size > 0) {
    sql += appendInFilter(`${prefix}mat`, [...mats], params)
  }
  return sql
}
