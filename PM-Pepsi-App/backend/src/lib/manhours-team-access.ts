import type { AuthUser } from '../schemas/auth.js'

/** Admin / Planner เห็นข้อมูลทีม — ช่าง (W) เห็นเฉพาะตัวเอง */
export function canViewTeamManhours(user: AuthUser, isManhoursAdmin: boolean): boolean {
  if (isManhoursAdmin || user.userst === 'A') return true
  if (user.userst === 'U') return true
  return false
}

export function resolveSelfWorkcenterId(user: AuthUser): string | null {
  if (user.accountType === 'workcenter' && user.idwkctr?.trim()) {
    return user.idwkctr.trim()
  }
  return null
}

export function resolveSelfWkctrCode(user: AuthUser): string | null {
  const wkctr = user.wkctr?.trim()
  return wkctr || null
}
