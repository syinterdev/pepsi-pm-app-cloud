import { describe, expect, it } from 'vitest'
import { appNav, type NavLinkEntry } from '@/components/layout/nav-config'
import { Home } from 'lucide-react'
import { supplementNavFromFallback, stripDeprecatedNavEntries } from '@/lib/nav-menu-api'

describe('stripDeprecatedNavEntries', () => {
  it('removes /line-calendar from sidebar entries', () => {
    const stripped = stripDeprecatedNavEntries([
      { kind: 'heading', label: 'ปฏิทิน & ใบงาน' },
      { kind: 'item', to: '/calendar', label: 'ปฏิทิน', icon: Home, menuright: 'A:U:W' },
      { kind: 'item', to: '/line-calendar', label: 'ปฏิทินเส้น', icon: Home, menuright: 'A:U:W' },
      { kind: 'item', to: '/backlog', label: 'Backlog', icon: Home, menuright: 'A:U:W' },
    ])
    const paths = stripped.filter((e) => e.kind === 'item').map((e) => e.to)
    expect(paths).toEqual(['/calendar', '/backlog'])
  })

  it('removes legacy /personnel/admin from sidebar entries', () => {
    const stripped = stripDeprecatedNavEntries([
      { kind: 'heading', label: 'ชั่วโมง & บุคลากร' },
      { kind: 'item', to: '/personnel', label: 'Personal Dashboard', icon: Home, menuright: 'A:U:W' },
      { kind: 'item', to: '/personnel/admin', label: 'จัดการบุคลากร', icon: Home, menuright: 'A' },
      { kind: 'item', to: '/worktime', label: 'Summary Over all', icon: Home, menuright: 'A:U:W' },
    ])
    const paths = stripped.filter((e) => e.kind === 'item').map((e) => e.to)
    expect(paths).toEqual(['/personnel', '/worktime'])
  })

  it('removes /manhours/admin from sidebar entries', () => {
    const stripped = stripDeprecatedNavEntries([
      { kind: 'heading', label: 'ชั่วโมง & บุคลากร' },
      { kind: 'item', to: '/manhours', label: 'Manhours', icon: Home, menuright: 'A' },
      { kind: 'item', to: '/manhours/admin', label: 'จัดการ Man Hour (Admin)', icon: Home, menuright: 'A' },
      { kind: 'item', to: '/worktime', label: 'Summary Over all', icon: Home, menuright: 'A:U:W' },
    ])
    const paths = stripped.filter((e) => e.kind === 'item').map((e) => e.to)
    expect(paths).toEqual(['/manhours', '/worktime'])
  })
})

describe('supplementNavFromFallback', () => {
  it('adds /reports/audit when API only has /reports', () => {
    const reports = appNav.find((e) => e.kind === 'item' && e.to === '/reports') as NavLinkEntry
    const merged = supplementNavFromFallback(
      [
        { kind: 'heading', label: 'รายงาน' },
        reports,
        { kind: 'heading', label: 'ระบบ' },
        appNav.find((e) => e.kind === 'item' && e.to === '/settings') as NavLinkEntry,
      ],
      appNav,
    )
    const paths = merged.filter((e) => e.kind === 'item').map((e) => e.to)
    expect(paths).toContain('/reports/audit')
    expect(paths).toContain('/activity-log')
  })

  it('adds /admin/branding when missing from API nav', () => {
    const reports = appNav.find((e) => e.kind === 'item' && e.to === '/reports') as NavLinkEntry
    const settings = appNav.find((e) => e.kind === 'item' && e.to === '/settings') as NavLinkEntry

    const merged = supplementNavFromFallback(
      [
        { kind: 'heading', label: 'รายงาน' },
        reports,
        { kind: 'heading', label: 'ระบบ' },
        settings,
      ],
      appNav,
    )

    const paths = merged.filter((e) => e.kind === 'item').map((e) => e.to)
    expect(paths).toContain('/admin/branding')
    expect(paths).toContain('/admin/telegram')
    expect(merged.some((e) => e.kind === 'heading' && e.label === 'Administrator')).toBe(true)
  })
})
