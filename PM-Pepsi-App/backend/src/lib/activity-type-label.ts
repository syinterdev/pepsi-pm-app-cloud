/**
 * กิจกรรม (mat) — ตัวกรองปฏิทิน / backlog / work orders
 * ลูกค้า: Z1 Break Down · Z2 Preventive · Z5 Corrective
 * ใน IW37N คอลัมน์ mat มักเป็น 1 / 2 / 5 (ไม่ใช่ PM01/CM01)
 */
export type ActivityFilterCode = 'Z1' | 'Z2' | 'Z5'

export const ACTIVITY_FILTER_OPTIONS: ReadonlyArray<{
  code: ActivityFilterCode
  label: string
}> = [
  { code: 'Z1', label: 'Z1 = Break Down Maintenance' },
  { code: 'Z2', label: 'Z2 = Preventive Maintenance' },
  { code: 'Z5', label: 'Z5 = Corrective Maintenance' },
] as const

const CANONICAL: Record<ActivityFilterCode, string> = {
  Z1: 'Break Down Maintenance',
  Z2: 'Preventive Maintenance',
  Z5: 'Corrective Maintenance',
}

/** ค่า mat ใน tbiw37n / tbactivitytype ที่ตรงกับ Z1 / Z2 / Z5 */
const MAT_BY_FILTER: Record<ActivityFilterCode, readonly string[]> = {
  Z1: ['1', '01', 'Z1', 'z1'],
  Z2: ['2', '02', 'Z2', 'z2', 'PM01'],
  Z5: ['5', '05', 'Z5', 'z5', 'CM01'],
}

export function listActivityFilterOptions(): Array<{ code: string; label: string }> {
  return ACTIVITY_FILTER_OPTIONS.map((o) => ({ code: o.code, label: o.label }))
}

/** แปลง Z1/Z2/Z5 (หรือ legacy mat) เป็นรายการ mat สำหรับ SQL IN (...) */
export function expandActivityFilterCodes(codes: string[]): string[] {
  const out = new Set<string>()
  for (const raw of codes) {
    const c = (raw ?? '').trim()
    if (!c) continue

    const z = normalizeActivityFilterCode(c)
    if (z) {
      for (const m of MAT_BY_FILTER[z]) out.add(m)
      continue
    }

    out.add(c)
  }
  return [...out]
}

function normalizeActivityFilterCode(code: string): ActivityFilterCode | null {
  const upper = code.toUpperCase()
  if (upper === 'Z1' || upper === '1' || upper === '01') return 'Z1'
  if (upper === 'Z2' || upper === '2' || upper === '02' || upper === 'PM01') return 'Z2'
  if (upper === 'Z5' || upper === '5' || upper === '05' || upper === 'CM01') return 'Z5'
  return null
}

/** แปลงค่า mat จาก DB เป็นรหัสแสดงผล Z1 / Z2 / Z5 */
export function activityTypeDisplayCode(mat: string): string {
  const z = normalizeActivityFilterCode((mat ?? '').trim())
  if (z) return z

  const raw = (mat ?? '').trim()
  if (!raw) return raw

  const upper = raw.toUpperCase()
  if (/^Z\d+$/.test(upper)) {
    const n = Number(upper.slice(1))
    return Number.isFinite(n) ? `Z${n}` : upper
  }

  const n = Number(raw)
  if (Number.isFinite(n) && raw !== '') {
    return `Z${n}`
  }

  return upper
}

export function formatActivityTypeFilterLabel(
  mat: string,
  descrip?: string | null,
): string {
  const z = normalizeActivityFilterCode((mat ?? '').trim())
  if (z) {
    return `${z} = ${CANONICAL[z]}`
  }

  const code = activityTypeDisplayCode(mat)
  const canonical = CANONICAL[code as ActivityFilterCode]
  if (canonical) {
    return `${code} = ${canonical}`
  }

  const d = (descrip ?? '').trim()
  return d ? `${code} = ${d}` : code
}

/** PM Plan / ทีม — A · B · EE · UT (ตัวกรองปฏิทิน · WO) */
export const PM_PLAN_TEAM_FILTER_OPTIONS: ReadonlyArray<{
  code: string
  label: string
}> = [
  { code: 'A', label: 'A' },
  { code: 'B', label: 'B' },
  { code: 'EE', label: 'EE' },
  { code: 'UT', label: 'UT' },
] as const
