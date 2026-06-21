import { describe, expect, it } from 'vitest'
import { fallbackRoleLabels, pickRoleLabel } from './role-labels.js'

describe('role-labels', () => {
  it('pickRoleLabel uses EN or TH', () => {
    const labels = { roleNameTh: 'ผู้ดูแลระบบ', roleNameEn: 'Administrator' }
    expect(pickRoleLabel(labels, 'en')).toBe('Administrator')
    expect(pickRoleLabel(labels, 'th')).toBe('ผู้ดูแลระบบ')
  })

  it('fallback for A', () => {
    const labels = fallbackRoleLabels('A')
    expect(labels.roleNameEn).toBe('Administrator')
  })
})
