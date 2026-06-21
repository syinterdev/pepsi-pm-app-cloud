import type { AuthUser } from '@/api/schemas'
import { getRbacPreviewSnapshot } from '@/lib/rbac-preview'

/** Legacy fallback when `permissions` not yet loaded (pre-migration / old session). */
export function legacyHasPermission(userst: string | undefined, perm: string): boolean {
  const role = (userst ?? '').trim().toUpperCase()
  if (role === 'A') return true
  if (perm.startsWith('admin.')) return false
  if (role === 'H') {
    if (perm.endsWith('.read') || perm.endsWith('.export')) return true
    if (
      perm === 'work-orders.write' ||
      perm === 'confirmation.write' ||
      perm === 'confirmation.close' ||
      perm === 'manhours.write'
    ) {
      return true
    }
    return false
  }
  if (role === 'U') {
    if (perm.startsWith('planning.') || perm.startsWith('iw37n.')) return true
    if (
      perm === 'work-orders.read' ||
      perm === 'work-orders.write' ||
      perm === 'work-orders.import' ||
      perm === 'work-orders.export' ||
      perm === 'confirmation.read' ||
      perm === 'confirmation.import' ||
      perm === 'confirmation.export' ||
      perm === 'master-data.read' ||
      perm === 'dashboard.read' ||
      perm === 'calendar.read' ||
      perm === 'calendar.write' ||
      perm === 'backlog.read' ||
      perm === 'backlog.write' ||
      perm === 'reports.read' ||
      perm === 'manhours.read' ||
      perm === 'personnel.read' ||
      perm === 'user-log.read'
    ) {
      return true
    }
    return false
  }
  if (role === 'W') {
    if (
      perm === 'dashboard.read' ||
      perm === 'planning.read' ||
      perm === 'calendar.read' ||
      perm === 'backlog.read' ||
      perm === 'work-orders.read' ||
      perm === 'confirmation.read' ||
      perm === 'confirmation.write' ||
      perm === 'confirmation.close' ||
      perm === 'personnel.read' ||
      perm === 'manhours.read' ||
      perm === 'manhours.write' ||
      perm === 'reports.read' ||
      perm === 'user-log.read'
    ) {
      return true
    }
    return false
  }
  return false
}

export function hasPermission(user: AuthUser | null | undefined, code: string): boolean {
  const preview = getRbacPreviewSnapshot()
  if (preview) return preview.permissions.includes(code)
  if (!user) return false
  const perms = user.permissions
  if (perms && perms.length > 0) {
    if (perms.includes(code)) return true
    // New permissions may ship before migration grants them on the role matrix (Admin → legacy all)
    return legacyHasPermission(user.userst, code)
  }
  return legacyHasPermission(user.userst, code)
}

/** Permissions used for nav filtering (role simulate preview overrides session). */
export function effectivePermissions(user: AuthUser | null | undefined): string[] | undefined {
  const preview = getRbacPreviewSnapshot()
  if (preview) return preview.permissions
  return user?.permissions
}

export function hasAnyPermission(user: AuthUser | null | undefined, codes: readonly string[]): boolean {
  return codes.some((code) => hasPermission(user, code))
}

