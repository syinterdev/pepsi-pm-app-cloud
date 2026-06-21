import { describe, expect, it } from 'vitest'
import { i18n } from '@/i18n'
import { localizeNavEntries } from '@/lib/localize-nav'
import { Home } from 'lucide-react'

describe('localizeNavEntries', () => {
  it('falls back to tbmenu label when nav route key is missing', () => {
    const t = i18n.getFixedT('en')
    const [item] = localizeNavEntries(
      [
        {
          kind: 'item',
          to: '/personnel/admin',
          label: 'จัดการบุคลากร (Admin)',
          icon: Home,
          menuright: 'A',
        },
      ],
      t,
      'en',
    )
    expect(item.kind === 'item' && item.label).toBe('จัดการบุคลากร (Admin)')
    expect(item.kind === 'item' && item.label).not.toContain('routes.')
  })

  it('localizes known admin child routes', () => {
    const t = i18n.getFixedT('en')
    const [item] = localizeNavEntries(
      [
        {
          kind: 'item',
          to: '/admin/users',
          label: 'จัดการผู้ใช้ (Users)',
          icon: Home,
          menuright: 'A',
        },
      ],
      t,
      'en',
    )
    expect(item.kind === 'item' && item.label).toBe('Users')
  })
})
