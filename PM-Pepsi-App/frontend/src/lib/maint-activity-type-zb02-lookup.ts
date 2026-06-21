import { MAINT_ACTIVITY_TYPE_ZB02 } from '@/lib/maint-activity-type-zb02'

const BY_MAT = new Map(MAINT_ACTIVITY_TYPE_ZB02.map((r) => [r.mat, r]))

export function lookupMaintActivityType(mat: string) {
  const raw = (mat ?? '').trim()
  if (!raw) return null
  const padded = raw.padStart(3, '0')
  return BY_MAT.get(padded) ?? null
}
