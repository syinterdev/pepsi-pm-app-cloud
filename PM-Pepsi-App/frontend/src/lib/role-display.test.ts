import { describe, expect, it } from 'vitest'
import { formatRolePreviewOption, resolveRoleDisplayLabel } from './role-display'

describe('resolveRoleDisplayLabel', () => {
  const labels = {
    roleNameTh: 'ผู้ดูแลระบบ',
    roleNameEn: 'Administrator',
    userst: 'A',
  }

  it('shows English label when locale is en', () => {
    expect(resolveRoleDisplayLabel(labels, 'en')).toBe('Administrator')
  })

  it('shows Thai label when locale is th', () => {
    expect(resolveRoleDisplayLabel(labels, 'th')).toBe('ผู้ดูแลระบบ')
  })

  it('falls back to Thai when English is empty', () => {
    expect(resolveRoleDisplayLabel({ roleNameTh: 'ช่าง', roleNameEn: '', userst: 'W' }, 'en')).toBe(
      'ช่าง',
    )
  })

  it('falls back to userst when both names missing', () => {
    expect(resolveRoleDisplayLabel({ userst: 'U' }, 'en')).toBe('U')
  })
})

describe('formatRolePreviewOption', () => {
  it('combines role code and localized name', () => {
    expect(
      formatRolePreviewOption('A', 'en', {
        roleNameTh: 'ผู้ดูแลระบบ',
        roleNameEn: 'Administrator',
      }),
    ).toBe('A - Administrator')
  })

  it('returns code only when name is missing', () => {
    expect(formatRolePreviewOption('X', 'en', { userst: 'X' })).toBe('X')
  })
})
