import { describe, expect, it } from 'vitest'
import { normalizeRoleCode } from './rbac-role-code.js'

describe('normalizeRoleCode', () => {
  it('keeps legacy A/H/U/W', () => {
    expect(normalizeRoleCode('a')).toBe('A')
    expect(normalizeRoleCode('H')).toBe('H')
  })

  it('supports custom role codes', () => {
    expect(normalizeRoleCode('OPS')).toBe('OPS')
    expect(normalizeRoleCode('QA_LEAD')).toBe('QA_LEAD')
  })

  it('falls back to U for invalid', () => {
    expect(normalizeRoleCode('')).toBe('U')
    expect(normalizeRoleCode('invalid role')).toBe('U')
  })
})
