import { beforeEach, describe, expect, it, vi } from 'vitest'
import { hasPermission, legacyHasPermission } from '@/lib/permissions'
import type { AuthUser } from '@/api/schemas'

function stubBrowserStorage() {
  const session = new Map<string, string>()
  vi.stubGlobal('sessionStorage', {
    getItem: (k: string) => session.get(k) ?? null,
    setItem: (k: string, v: string) => {
      session.set(k, v)
    },
    removeItem: (k: string) => {
      session.delete(k)
    },
  })
  vi.stubGlobal('localStorage', {
    getItem: () => null,
    setItem: vi.fn(),
    removeItem: vi.fn(),
  })
}

const baseUser: AuthUser = {
  idwkctr: '1',
  username: 'u1',
  wkctr: 'PAC001',
  userst: 'U',
  sysstatus: 'Planner',
}

describe('permissions', () => {
  beforeEach(() => {
    stubBrowserStorage()
  })

  it('uses permissions array when present', () => {
    const user: AuthUser = {
      ...baseUser,
      permissions: ['planning.read', 'planning.assign'],
    }
    expect(hasPermission(user, 'planning.assign')).toBe(true)
    expect(hasPermission(user, 'personnel.write')).toBe(false)
  })

  it('falls back to legacy userst when permissions missing', () => {
    expect(hasPermission({ ...baseUser, userst: 'A' }, 'admin.users.write')).toBe(true)
    expect(hasPermission({ ...baseUser, userst: 'W' }, 'admin.users.write')).toBe(false)
    expect(legacyHasPermission('U', 'planning.assign')).toBe(true)
  })
})
