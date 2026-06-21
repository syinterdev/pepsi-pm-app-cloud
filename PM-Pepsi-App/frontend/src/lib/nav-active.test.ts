import { describe, expect, it } from 'vitest'
import { isNavPathActive, pathAllowedForUser } from '@/lib/nav-active'

describe('isNavPathActive', () => {
  it('highlights parent for nested child routes when end is false', () => {
    expect(isNavPathActive('/work-orders/123', '/work-orders')).toBe(true)
    expect(isNavPathActive('/work-orders/123/edit', '/work-orders')).toBe(true)
  })

  it('does not highlight parent for unrelated routes', () => {
    expect(isNavPathActive('/confirmation', '/work-orders')).toBe(false)
  })

  it('respects end=true for exact match only', () => {
    expect(isNavPathActive('/', '/', true)).toBe(true)
    expect(isNavPathActive('/planning', '/', true)).toBe(false)
    expect(isNavPathActive('/planning', '/planning', true)).toBe(true)
    expect(isNavPathActive('/planning/extra', '/planning', true)).toBe(false)
  })

  it('keeps Personal Dashboard inactive on personnel child routes', () => {
    expect(isNavPathActive('/personnel', '/personnel', true)).toBe(true)
    expect(isNavPathActive('/personnel/confirm', '/personnel', true)).toBe(false)
    expect(isNavPathActive('/personnel/admin', '/personnel', true)).toBe(false)
    expect(isNavPathActive('/personnel/confirm', '/personnel/confirm')).toBe(true)
  })

  it('highlights admin child routes without activating Admin Console', () => {
    expect(isNavPathActive('/admin/users', '/admin', true)).toBe(false)
    expect(isNavPathActive('/admin/users', '/admin/users')).toBe(true)
  })

  it('keeps Reports inactive on auditor hub sibling route', () => {
    expect(isNavPathActive('/reports', '/reports', true)).toBe(true)
    expect(isNavPathActive('/reports/audit', '/reports', true)).toBe(false)
    expect(isNavPathActive('/reports/audit', '/reports/audit')).toBe(true)
  })
})

describe('pathAllowedForUser', () => {
  it('allows child URLs when parent menu path is allowed', () => {
    expect(pathAllowedForUser('/reports/audit', ['/reports'])).toBe(true)
    expect(pathAllowedForUser('/reports', ['/reports/audit'])).toBe(false)
    expect(pathAllowedForUser('/reports/audit', ['/reports/audit'])).toBe(true)
  })
})
