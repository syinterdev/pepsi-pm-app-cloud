import { describe, expect, it, beforeEach, vi } from 'vitest'
import {
  clearPermissionCache,
  hasPermission,
  legacyHasPermission,
  listPermissionsForUserst,
} from './has-permission.js'
import { normalizeRoleCode } from './rbac-role-code.js'

describe('rbac-role-code', () => {
  it('normalizes legacy userst to role codes', () => {
    expect(normalizeRoleCode('a')).toBe('A')
    expect(normalizeRoleCode('')).toBe('U')
    expect(normalizeRoleCode('W')).toBe('W')
  })
})

describe('legacyHasPermission', () => {
  it('grants admin all permissions', () => {
    expect(legacyHasPermission('A', 'admin.users.write')).toBe(true)
    expect(legacyHasPermission('A', 'planning.assign')).toBe(true)
  })

  it('denies admin permissions for non-admin roles', () => {
    expect(legacyHasPermission('U', 'admin.users.write')).toBe(false)
    expect(legacyHasPermission('W', 'manhours.admin')).toBe(false)
  })

  it('allows planner planning and iw37n', () => {
    expect(legacyHasPermission('U', 'planning.assign')).toBe(true)
    expect(legacyHasPermission('U', 'iw37n.import')).toBe(true)
  })
})

describe('hasPermission with pool', () => {
  beforeEach(() => clearPermissionCache())

  it('reads granted permissions from tbl_role_permission', async () => {
    const pool = {
      query: vi.fn().mockResolvedValue({
        rows: [{ perm_code: 'planning.assign' }, { perm_code: 'reports.read' }],
      }),
    }

    await expect(hasPermission(pool as never, 'U', 'planning.assign')).resolves.toBe(true)
    await expect(hasPermission(pool as never, 'U', 'admin.users.write')).resolves.toBe(false)
    expect(pool.query).toHaveBeenCalledTimes(1)

    await hasPermission(pool as never, 'U', 'reports.read')
    expect(pool.query).toHaveBeenCalledTimes(1)
  })

  it('lists permissions for role', async () => {
    const pool = {
      query: vi.fn().mockResolvedValue({
        rows: [{ perm_code: 'b' }, { perm_code: 'a' }],
      }),
    }
    await expect(listPermissionsForUserst(pool as never, 'A')).resolves.toEqual(['a', 'b'])
  })

  it('falls back to legacy when RBAC tables are missing', async () => {
    const pool = {
      query: vi.fn().mockRejectedValue(new Error('relation "app.tbl_role_permission" does not exist')),
    }
    clearPermissionCache()
    await expect(hasPermission(pool as never, 'A', 'admin.audit.read')).resolves.toBe(true)
    await expect(hasPermission(pool as never, 'W', 'admin.audit.read')).resolves.toBe(false)
  })
})
