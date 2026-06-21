import { describe, expect, it } from 'vitest'
import {
  hasPortalViewPermission,
  portalModuleCodesForPermissions,
  PORTAL_MODULE_DEFS,
} from '@/lib/portal-rbac-preview'

describe('portal-rbac-preview', () => {
  it('maps module.* permissions to portal card codes (migration 102)', () => {
    expect(PORTAL_MODULE_DEFS.map((m) => m.permCode)).toEqual([
      'module.pm',
      'module.store',
      'module.repair',
    ])
  })

  it('admin A sees all three module cards', () => {
    const perms = ['portal.view', 'module.pm', 'module.store', 'module.repair']
    expect(portalModuleCodesForPermissions(perms)).toEqual(['pm', 'store', 'repair'])
    expect(hasPortalViewPermission(perms)).toBe(true)
  })

  it('planner U sees PM and store only', () => {
    const perms = ['portal.view', 'module.pm', 'module.store']
    expect(portalModuleCodesForPermissions(perms)).toEqual(['pm', 'store'])
  })

  it('technician W sees PM only', () => {
    const perms = ['portal.view', 'module.pm']
    expect(portalModuleCodesForPermissions(perms)).toEqual(['pm'])
  })

  it('no module.* yields empty cards even with portal.view', () => {
    const perms = ['portal.view']
    expect(portalModuleCodesForPermissions(perms)).toEqual([])
    expect(hasPortalViewPermission(perms)).toBe(true)
  })

  it('no portal access when neither portal.view nor module.* granted', () => {
    const perms = ['planning.read', 'work-orders.read']
    expect(portalModuleCodesForPermissions(perms)).toEqual([])
    expect(hasPortalViewPermission(perms)).toBe(false)
  })
})
