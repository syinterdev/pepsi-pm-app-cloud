/**
 * 3 role หลักสำหรับ go-live — Admin / Planner / Technician
 * Legacy Manager (H / manager) ยังอ่านได้แต่ไม่ให้ assign ใหม่
 */
export const PRIMARY_USERST = ['A', 'U', 'W'] as const
export const PRIMARY_USERROLES = ['admin', 'planner', 'technician'] as const

export type PrimaryUserst = (typeof PRIMARY_USERST)[number]
export type PrimaryUserrole = (typeof PRIMARY_USERROLES)[number]

export const DEPRECATED_ROLE_CODES = ['H'] as const
export const DEPRECATED_USERROLES = ['manager'] as const

export const USERROLE_TO_USERST: Record<PrimaryUserrole, PrimaryUserst> = {
  admin: 'A',
  planner: 'U',
  technician: 'W',
}

export const USERST_TO_USERROLE: Record<PrimaryUserst, PrimaryUserrole> = {
  A: 'admin',
  U: 'planner',
  W: 'technician',
}

export const POST_LOGIN_PATH_BY_USERST: Record<PrimaryUserst, string> = {
  A: '/',
  U: '/planning',
  W: '/plan-calendar',
}

export function isPrimaryUserrole(value: string | null | undefined): value is PrimaryUserrole {
  return (PRIMARY_USERROLES as readonly string[]).includes((value ?? '').trim().toLowerCase())
}

export function isPrimaryUserst(value: string | null | undefined): value is PrimaryUserst {
  return (PRIMARY_USERST as readonly string[]).includes(
    (value ?? '').trim().toUpperCase() as PrimaryUserst,
  )
}

export function userroleToUserst(userrole: string | null | undefined): PrimaryUserst | null {
  const v = (userrole ?? '').trim().toLowerCase()
  if (v === 'admin') return 'A'
  if (v === 'planner') return 'U'
  if (v === 'technician') return 'W'
  return null
}

export function userstToUserrole(userst: string | null | undefined): PrimaryUserrole | null {
  const v = (userst ?? '').trim().toUpperCase()
  if (v === 'A') return 'admin'
  if (v === 'U') return 'planner'
  if (v === 'W') return 'technician'
  return null
}

/** บังคับคู่ userrole + userst ให้ตรง 3 role หลัก (legacy manager → planner) */
export function normalizePrimaryRolePair(input: {
  userst?: string | null
  userrole?: string | null
}): { userst: PrimaryUserst; userrole: PrimaryUserrole } {
  const rawRole = (input.userrole ?? '').trim().toLowerCase()
  const rawSt = (input.userst ?? '').trim().toUpperCase()

  if (rawRole === 'manager' || rawSt === 'H') {
    return { userst: 'U', userrole: 'planner' }
  }

  const fromRole = userroleToUserst(rawRole)
  if (fromRole) {
    return { userst: fromRole, userrole: rawRole as PrimaryUserrole }
  }

  const fromSt = userstToUserrole(rawSt)
  if (fromSt) {
    return { userst: rawSt as PrimaryUserst, userrole: fromSt }
  }

  return { userst: 'U', userrole: 'planner' }
}

export function resolvePostLoginPathForUserst(
  userst: string | null | undefined,
  fallback = '/plan-calendar',
): string {
  const primary = userstToUserrole(userst)
  if (primary) return POST_LOGIN_PATH_BY_USERST[USERROLE_TO_USERST[primary]]
  return fallback
}

export function isVisibleRoleCode(roleCode: string): boolean {
  return !(DEPRECATED_ROLE_CODES as readonly string[]).includes(roleCode.toUpperCase())
}
