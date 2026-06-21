import { describe, expect, it } from 'vitest'
import { ADMIN_SECTIONS } from './admin-sections'

/** §3.1 UI — routes registered in App.tsx for admin */
const ADMIN_ROUTES = [
  '/admin',
  '/admin/users',
  '/admin/roles',
  '/admin/menu',
  '/admin/branding',
  '/admin/settings',
  '/admin/master',
  '/admin/audit',
  '/admin/health',
  '/admin/backup',
  '/admin/announcements',
  '/admin/security',
  '/admin/about',
] as const

describe('§3.1 admin UI checklist', () => {
  it('maps 13 routes to admin sections', () => {
    for (const route of ADMIN_ROUTES) {
      const section = ADMIN_SECTIONS.find((s) => s.to === route)
      expect(section, `missing section for ${route}`).toBeDefined()
      expect(section?.implemented).toBe(true)
    }
  })

  it('uses unique tour targets for Joyride (13 pages + command hint)', () => {
    const targets = ADMIN_SECTIONS.map((s) => s.tourTarget)
    expect(new Set(targets).size).toBe(targets.length)
    expect(ADMIN_SECTIONS.filter((s) => s.implemented).length).toBe(14)
  })

  it('buildAdminNavEntries matches implemented sections', async () => {
    const { i18n } = await import('@/i18n')
    const { buildAdminNavEntries } = await import('./admin-nav-entries')
    const entries = buildAdminNavEntries(i18n.getFixedT('en', 'admin'))
    expect(entries.length).toBe(14)
    expect(entries.map((e) => e.to).sort()).toEqual(
      ADMIN_SECTIONS.filter((s) => s.implemented)
        .map((s) => s.to)
        .sort(),
    )
  })
})
