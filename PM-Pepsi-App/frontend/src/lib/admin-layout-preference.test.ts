import { afterEach, describe, expect, it } from 'vitest'
import {
  readAdminDensity,
  writeAdminDensity,
  ADMIN_DENSITY_EVENT,
} from '@/lib/admin-layout-preference'

describe('admin-layout-preference', () => {
  afterEach(() => {
    localStorage.removeItem('pm_admin_density')
    sessionStorage.removeItem('pm_admin_density')
  })

  it('defaults to cozy', () => {
    expect(readAdminDensity()).toBe('cozy')
  })

  it('persists compact and notifies subscribers', () => {
    let seen = readAdminDensity()
    const unsub = () => {
      window.removeEventListener(ADMIN_DENSITY_EVENT, onEvent)
    }
    const onEvent = () => {
      seen = readAdminDensity()
    }
    window.addEventListener(ADMIN_DENSITY_EVENT, onEvent)
    writeAdminDensity('compact')
    expect(readAdminDensity()).toBe('compact')
    expect(seen).toBe('compact')
    unsub()
  })
})
