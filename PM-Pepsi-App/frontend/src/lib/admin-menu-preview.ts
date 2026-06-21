import type { AdminMenuRow, AdminRoleMatrixResponse } from '@/api/schemas'
import type { NavEntry, NavLinkEntry } from '@/components/layout/nav-config'
import { filterNavForUser } from '@/lib/nav-rbac'
import { resolveNavIcon } from '@/lib/nav-icon-map'
import { stripDeprecatedNavEntries } from '@/lib/nav-menu-api'

const DEFAULT_HEADING_LABEL = 'เมนูหลัก'

/** แปลงแถว tbmenu → NavEntry สำหรับ preview sidebar */
export function adminMenuRowsToNavEntries(rows: AdminMenuRow[]): NavEntry[] {
  const entries: NavEntry[] = []
  let pendingHeading: { kind: 'heading'; label: string } | null = null
  const pendingItems: NavLinkEntry[] = []

  const flush = () => {
    if (pendingItems.length === 0) {
      pendingHeading = null
      return
    }
    const heading = pendingHeading ?? { kind: 'heading' as const, label: DEFAULT_HEADING_LABEL }
    entries.push(heading)
    entries.push(...pendingItems)
    pendingHeading = null
    pendingItems.length = 0
  }

  for (const row of rows) {
    if (row.menuKind === 'heading') {
      flush()
      pendingHeading = { kind: 'heading', label: row.menutitle }
      continue
    }
    const to = row.reactRoute?.trim() || '/'
    pendingItems.push({
      kind: 'item',
      to,
      label: row.menutitle,
      menuright: row.menuright,
      icon: resolveNavIcon(to, row.menuicon ?? undefined),
      end: row.endExact,
    })
  }
  flush()
  return entries
}

/** รวม permCode ที่ role นั้นได้ grant จาก matrix (ใช้กับ preview บน /admin/roles) */
export function permissionsForRoleFromMatrix(
  matrix: AdminRoleMatrixResponse,
  roleCode: string,
): string[] {
  const code = roleCode.trim()
  if (!code) return []
  const codes: string[] = []
  for (const g of matrix.groups) {
    for (const p of g.permissions) {
      if (p.grants[code]) codes.push(p.permCode)
    }
  }
  return codes
}

/**
 * Preview เมนูตาม role — ถ้ามี `permissions` (จาก matrix) จะกรองตาม RBAC route;
 * ไม่มีจะใช้ menuright แบบ legacy (A:H:U:W) userst
 */
export function previewNavForRole(
  rows: AdminMenuRow[],
  userst: string,
  permissions?: string[],
): NavEntry[] {
  const entries = adminMenuRowsToNavEntries(rows)
  const rbacStrict = permissions !== undefined
  return stripDeprecatedNavEntries(
    filterNavForUser(userst, entries, permissions, { rbacStrict }),
  )
}
