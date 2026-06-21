/**
 * 3 role หลัก — mirror backend/src/lib/primary-roles.ts
 */
export const PRIMARY_USERST = ['A', 'U', 'W'] as const
export const PRIMARY_USERROLES = ['admin', 'planner', 'technician'] as const

export type PrimaryUserst = (typeof PRIMARY_USERST)[number]
export type PrimaryUserrole = (typeof PRIMARY_USERROLES)[number]

export const DEPRECATED_ROLE_CODES = ['H'] as const

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

export function userroleToUserst(userrole: string): PrimaryUserst {
  return USERROLE_TO_USERST[userrole as PrimaryUserrole] ?? 'U'
}

export function normalizePrimaryRolePair(input: {
  userst?: string | null
  userrole?: string | null
}): { userst: PrimaryUserst; userrole: PrimaryUserrole } {
  const rawRole = (input.userrole ?? '').trim().toLowerCase()
  const rawSt = (input.userst ?? '').trim().toUpperCase()

  if (rawRole === 'manager' || rawSt === 'H') {
    return { userst: 'U', userrole: 'planner' }
  }

  if (PRIMARY_USERROLES.includes(rawRole as PrimaryUserrole)) {
    return {
      userrole: rawRole as PrimaryUserrole,
      userst: USERROLE_TO_USERST[rawRole as PrimaryUserrole],
    }
  }

  if (PRIMARY_USERST.includes(rawSt as PrimaryUserst)) {
    return {
      userst: rawSt as PrimaryUserst,
      userrole: USERST_TO_USERROLE[rawSt as PrimaryUserst],
    }
  }

  return { userst: 'U', userrole: 'planner' }
}

export function resolvePostLoginPathForUserst(
  userst: string | null | undefined,
  fallback = '/plan-calendar',
): string {
  const st = (userst ?? '').trim().toUpperCase()
  if (PRIMARY_USERST.includes(st as PrimaryUserst)) {
    return POST_LOGIN_PATH_BY_USERST[st as PrimaryUserst]
  }
  return fallback
}

export function isVisibleRoleCode(roleCode: string): boolean {
  return !DEPRECATED_ROLE_CODES.includes(roleCode.toUpperCase() as 'H')
}
