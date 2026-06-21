import { collectNavPaths, getFallbackNav } from '@/lib/nav-menu-api'
import { filterNavForUser } from '@/lib/nav-rbac'

/** เส้นทางเมนูที่ role จำลองมองเห็น (fallback nav + RBAC strict) */
export function navPathsForRolePreview(roleCode: string, permissions: string[]): string[] {
  const entries = filterNavForUser(roleCode, getFallbackNav(), permissions, {
    rbacStrict: permissions.length > 0,
  })
  return collectNavPaths(entries)
}

/** ตรวจว่า role จำลองไม่เห็นเมนู admin */
export function rolePreviewHidesAdminRoutes(permissions: string[]): boolean {
  const paths = navPathsForRolePreview('U', permissions)
  return !paths.some((p) => p.startsWith('/admin'))
}
