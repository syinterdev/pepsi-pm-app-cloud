import type { AuthUser } from '@/api/schemas'
import { hasPermission } from '@/lib/permissions-core'

/** Admin / Planner เห็นข้อมูลทีม — ช่าง (W) เห็นเฉพาะตัวเอง */
export function canViewTeamManhours(user: AuthUser | null | undefined): boolean {
  if (!user) return false
  if (user.userst === 'A' || hasPermission(user, 'manhours.admin')) return true
  if (user.userst === 'U') return true
  return false
}
