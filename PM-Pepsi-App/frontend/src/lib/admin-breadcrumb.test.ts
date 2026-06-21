import { describe, expect, it } from 'vitest'
import { adminBreadcrumbTrail } from '@/lib/admin-breadcrumb'
import { i18n } from '@/i18n'

describe('adminBreadcrumbTrail', () => {
  const tTh = i18n.getFixedT('th', 'admin')

  it('console index ends with Admin Console', () => {
    const trail = adminBreadcrumbTrail('/admin', tTh)
    expect(trail.at(-1)).toMatchObject({ label: 'ศูนย์ผู้ดูแลระบบ', current: true })
  })

  it('section page includes group then section', () => {
    const trail = adminBreadcrumbTrail('/admin/users', tTh)
    expect(trail.map((c) => c.label)).toEqual([
      'หน้าแรก',
      'ผู้ดูแลระบบ',
      'ผู้ใช้ & การเข้าถึง',
      'ผู้ใช้งาน',
    ])
    expect(trail.at(-1)?.current).toBe(true)
  })
})
