import type { Response } from 'express'
import type { Pool } from 'pg'
import { normalizeRoleCode } from './rbac-role-code.js'

const CACHE_TTL_MS = 60_000

type CacheEntry = {
  permissions: Set<string>
  expiresAt: number
}

const rolePermissionCache = new Map<string, CacheEntry>()

export function clearPermissionCache(roleCode?: string): void {
  if (roleCode) {
    rolePermissionCache.delete(roleCode)
    return
  }
  rolePermissionCache.clear()
}

export function isRbacSchemaMissing(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err)
  return (
    message.includes('tbl_role_permission') ||
    message.includes('tbl_permission') ||
    message.includes('tbl_role') ||
    message.includes('does not exist') ||
    message.includes('undefined table') ||
    message.includes('relation')
  )
}

/** Legacy fallback when migrations 044–046 are not applied yet. */
export function legacyHasPermission(userst: string | null | undefined, perm: string): boolean {
  const role = normalizeRoleCode(userst)
  if (role === 'A') return true
  if (perm.startsWith('admin.')) return false
  if (role === 'H') {
    if (perm.endsWith('.read') || perm.endsWith('.export')) return true
    if (
      perm === 'work-orders.write' ||
      perm === 'confirmation.write' ||
      perm === 'confirmation.close' ||
      perm === 'confirmation.export.all' ||
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
      perm === 'work-orders.write' ||
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

async function loadRolePermissions(pool: Pool, roleCode: string): Promise<Set<string>> {
  const now = Date.now()
  const cached = rolePermissionCache.get(roleCode)
  if (cached && cached.expiresAt > now) {
    return cached.permissions
  }

  const { rows } = await pool.query<{ perm_code: string }>(
    `SELECT perm_code
     FROM app.tbl_role_permission
     WHERE role_code = $1 AND granted = true`,
    [roleCode],
  )

  const permissions = new Set(rows.map((r) => r.perm_code))
  rolePermissionCache.set(roleCode, {
    permissions,
    expiresAt: now + CACHE_TTL_MS,
  })
  return permissions
}

export async function listPermissionsForUserst(
  pool: Pool,
  userst: string | null | undefined,
): Promise<string[]> {
  const roleCode = normalizeRoleCode(userst)
  try {
    const perms = await loadRolePermissions(pool, roleCode)
    return [...perms].sort()
  } catch (err) {
    if (!isRbacSchemaMissing(err)) throw err
    const all = [
      'dashboard.read',
      'planning.read',
      'planning.write',
      'planning.assign',
      'planning.delete',
      'work-orders.read',
      'confirmation.read',
      'personnel.read',
      'manhours.read',
      'reports.read',
      'admin.users.write',
      'manhours.admin',
      'confirmation.import',
    ]
    return all.filter((p) => legacyHasPermission(userst, p)).sort()
  }
}

export async function hasPermission(
  pool: Pool,
  userst: string | null | undefined,
  perm: string,
): Promise<boolean> {
  const roleCode = normalizeRoleCode(userst)
  try {
    const permissions = await loadRolePermissions(pool, roleCode)
    if (permissions.has(perm)) return true
    return legacyHasPermission(userst, perm)
  } catch (err) {
    if (!isRbacSchemaMissing(err)) throw err
    return legacyHasPermission(userst, perm)
  }
}

export async function hasAnyPermission(
  pool: Pool,
  userst: string | null | undefined,
  perms: readonly string[],
): Promise<boolean> {
  for (const perm of perms) {
    if (await hasPermission(pool, userst, perm)) return true
  }
  return false
}

/** Inline guard for handlers that already use `requireAuth`. */
export async function forbidUnlessPermission(
  res: Response,
  pool: Pool,
  userst: string | null | undefined,
  perm: string,
): Promise<boolean> {
  const ok = await hasPermission(pool, userst, perm)
  if (!ok) {
    res.status(403).json({
      error: 'FORBIDDEN',
      message: `ไม่มีสิทธิ์ ${perm}`,
    })
    return false
  }
  return true
}
