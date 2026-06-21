import { describe, expect, it } from 'vitest'
import { appNav } from '@/components/layout/nav-config'
import {
  NAV_ROUTE_PERMISSION,
  PUBLIC_NAV_PATHS,
  permissionForRoute,
} from '@/lib/nav-route-permissions'
import { collectNavPaths } from '@/lib/nav-menu-api'

describe('nav-config sidebar coverage', () => {
  const linkPaths = collectNavPaths(appNav)

  it('includes Plan Calendar (post-login WC path)', () => {
    expect(linkPaths).toContain('/plan-calendar')
    expect(permissionForRoute('/plan-calendar')).toBe('planning.read')
  })

  it('maps every fallback nav route to an RBAC permission (except public kiosk)', () => {
    for (const path of linkPaths) {
      if (PUBLIC_NAV_PATHS.has(path)) continue
      expect(NAV_ROUTE_PERMISSION[path], `missing permission for ${path}`).toBeTruthy()
    }
  })

  it('includes public Engineering Board without RBAC gate', () => {
    expect(linkPaths).toContain('/board')
    expect(PUBLIC_NAV_PATHS.has('/board')).toBe(true)
    expect(permissionForRoute('/board')).toBeUndefined()
  })

  it('does not duplicate /admin/users in fallback nav', () => {
    const adminUserLinks = appNav.filter((e) => e.kind === 'item' && e.to === '/admin/users')
    expect(adminUserLinks).toHaveLength(1)
  })

  it('keeps parent items without end for nested child routes (U4g.10)', () => {
    const nestedParents = ['/work-orders', '/planning', '/confirmation', '/master-data', '/master-plan']
    for (const path of nestedParents) {
      const entry = appNav.find((e) => e.kind === 'item' && e.to === path)
      expect(entry?.kind === 'item' && entry.end, `${path} should not use end`).toBeFalsy()
    }
    const home = appNav.find((e) => e.kind === 'item' && e.to === '/')
    expect(home?.kind === 'item' && home.end).toBe(true)
  })

  it('uses end on Personal Dashboard so admin sibling stays distinct', () => {
    const dashboard = appNav.find((e) => e.kind === 'item' && e.to === '/personnel')
    expect(dashboard?.kind === 'item' && dashboard.end).toBe(true)
    expect(appNav.some((e) => e.kind === 'item' && e.to === '/personnel/confirm')).toBe(false)
  })

  it('uses end on Reports so Auditor Hub sibling stays distinct', () => {
    const reports = appNav.find((e) => e.kind === 'item' && e.to === '/reports')
    const audit = appNav.find((e) => e.kind === 'item' && e.to === '/reports/audit')
    expect(reports?.kind === 'item' && reports.end).toBe(true)
    expect(audit?.kind === 'item' && audit.end).toBeFalsy()
  })

  it('covers core operational routes', () => {
    for (const path of [
      '/',
      '/plan-calendar',
      '/calendar',
      '/backlog',
      '/work-orders',
      '/confirmation',
      '/planning',
      '/integration',
      '/iw37n',
      '/master-plan',
      '/master-data',
      '/manhours',
      '/personnel',
      '/user-log',
      '/settings',
    ]) {
      expect(linkPaths).toContain(path)
    }
  })
})
