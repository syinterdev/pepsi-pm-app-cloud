import { describe, expect, it, beforeEach, vi } from 'vitest'
import { clearRbacPreview, resetRbacPreviewCacheForTests, setRbacPreview } from '@/lib/rbac-preview'
import { effectivePermissions, hasPermission } from '@/lib/permissions-core'

describe('permissions-core with rbac preview', () => {
  beforeEach(() => {
    const store = new Map<string, string>()
    vi.stubGlobal('sessionStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => {
        store.set(k, v)
      },
      removeItem: (k: string) => {
        store.delete(k)
      },
    })
    vi.stubGlobal('window', { dispatchEvent: vi.fn() })
    resetRbacPreviewCacheForTests()
    clearRbacPreview()
  })

  it('preview overrides session permissions', () => {
    setRbacPreview({
      roleCode: 'W',
      roleNameTh: 'ช่าง',
      roleNameEn: 'Technician',
      permissions: ['confirmation.read'],
    })
    expect(hasPermission({ userst: 'A', permissions: ['admin.users.read'] } as never, 'admin.users.read')).toBe(
      false,
    )
    expect(hasPermission({ userst: 'A' } as never, 'confirmation.read')).toBe(true)
    expect(effectivePermissions({ userst: 'A', permissions: ['admin.users.read'] } as never)).toEqual([
      'confirmation.read',
    ])
  })
})
