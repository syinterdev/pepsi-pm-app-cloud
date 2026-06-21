import { describe, expect, it } from 'vitest'
import { i18n } from '@/i18n'
import { ADMIN_SECTIONS, adminSectionForPath, getGroupedAdminSections } from './admin-sections'

describe('adminSectionForPath', () => {
  it('resolves console index', () => {
    expect(adminSectionForPath('/admin')?.segment).toBe('')
    expect(adminSectionForPath('/admin/')?.segment).toBe('')
  })

  it('resolves nested admin routes', () => {
    expect(adminSectionForPath('/admin/users')?.segment).toBe('users')
    expect(adminSectionForPath('/admin/security')?.tourTarget).toBe('admin-security')
    expect(adminSectionForPath('/admin/about')?.tourTarget).toBe('admin-about')
  })

  it('has admin pages (console + sections) all implemented', () => {
    expect(ADMIN_SECTIONS).toHaveLength(14) // incl. telegram // console + 13 sections incl. telegram
    expect(ADMIN_SECTIONS.every((s) => s.implemented)).toBe(true)
    expect(ADMIN_SECTIONS.every((s) => s.tourTarget.startsWith('admin-'))).toBe(true)
  })

  it('resolves Menu Builder route', () => {
    expect(adminSectionForPath('/admin/menu')?.segment).toBe('menu')
  })

  it('Master Data Hub uses master-data.read (not admin.settings.read)', () => {
    const master = ADMIN_SECTIONS.find((s) => s.segment === 'master')
    expect(master?.permission).toBe('master-data.read')
    expect(master?.to).toBe('/admin/master')
  })

  it('Backup uses admin.backup.read', () => {
    const backup = ADMIN_SECTIONS.find((s) => s.segment === 'backup')
    expect(backup?.permission).toBe('admin.backup.read')
    expect(backup?.implemented).toBe(true)
  })

  it('Health uses admin.health.read', () => {
    const health = ADMIN_SECTIONS.find((s) => s.segment === 'health')
    expect(health?.permission).toBe('admin.health.read')
    expect(health?.implemented).toBe(true)
  })

  it('groups admin sections for console', () => {
    const t = i18n.getFixedT('en', 'admin')
    const groups = getGroupedAdminSections(t, { skipOverview: true })
    expect(groups.length).toBeGreaterThanOrEqual(4)
    const allSegments = groups.flatMap((g) => g.sections.map((s) => s.segment))
    expect(allSegments).toContain('users')
    expect(allSegments).toContain('branding')
    expect(allSegments).not.toContain('')
  })

  it('Security uses admin.security.read', () => {
    const sec = ADMIN_SECTIONS.find((s) => s.segment === 'security')
    expect(sec?.permission).toBe('admin.security.read')
    expect(sec?.implemented).toBe(true)
  })

  it('Announcements uses admin.announcement.read', () => {
    const ann = ADMIN_SECTIONS.find((s) => s.segment === 'announcements')
    expect(ann?.permission).toBe('admin.announcement.read')
    expect(ann?.implemented).toBe(true)
  })
})
