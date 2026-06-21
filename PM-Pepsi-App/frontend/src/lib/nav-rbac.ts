import type { AuthUser } from '@/api/schemas'
import { appNav, type NavEntry, type NavLinkEntry } from '@/components/layout/nav-config'
import { permissionForRoute } from '@/lib/nav-route-permissions'
import { hasPermission } from '@/lib/permissions-core'
import { getRbacPreviewSnapshot } from '@/lib/rbac-preview'

/** menuright (A:U:W) vs UserST */
export type UserSt = 'A' | 'U' | 'W'

export function parseUserSt(value: string | undefined): UserSt | null {
  if (value === 'A' || value === 'U' || value === 'W') return value
  return null
}

/** backend `canAccessMenuright` — รองรับ userst จาก DB โดยตรง (ไม่บังคับ parse แค่ A|U|W) */
export function canAccessByMenuright(userst: string, menuright: string): boolean {
  const role = userst.trim()
  if (!role) return false
  const allowed = menuright.split(':').map((s) => s.trim()).filter(Boolean)
  return allowed.includes(role)
}

export function canAccessNavItem(
  userst: string,
  item: NavLinkEntry,
  permissions?: string[],
  rbacStrict?: boolean,
): boolean {
  const perm = item.permission ?? permissionForRoute(item.to)
  const user = { userst, permissions } as AuthUser
  if (rbacStrict && permissions !== undefined) {
    if (perm) {
      const preview = getRbacPreviewSnapshot()
      const effective = preview?.permissions ?? permissions
      if (effective.length > 0) return effective.includes(perm)
      return hasPermission(user, perm)
    }
    return canAccessByMenuright(userst, item.menuright)
  }
  if (permissions && permissions.length > 0 && perm) {
    return hasPermission(user, perm)
  }
  return canAccessByMenuright(userst, item.menuright)
}

/** กรองเมนู sidebar — ซ่อน heading ที่ไม่มี item ใต้กลุ่มที่มองเห็น */
export function filterNavForUser(
  userst: string,
  entries: NavEntry[] = appNav,
  permissions?: string[],
  opts?: { rbacStrict?: boolean },
): NavEntry[] {
  const rbacStrict = opts?.rbacStrict === true
  const out: NavEntry[] = []
  let i = 0
  while (i < entries.length) {
    const entry = entries[i]
    if (entry.kind === 'heading') {
      const block: NavEntry[] = []
      let j = i + 1
      while (j < entries.length && entries[j].kind !== 'heading') {
        const item = entries[j] as NavLinkEntry
        if (canAccessNavItem(userst, item, permissions, rbacStrict)) block.push(item)
        j++
      }
      if (block.length > 0) {
        out.push(entry)
        out.push(...block)
      }
      i = j
      continue
    }
    i++
  }
  return out
}
