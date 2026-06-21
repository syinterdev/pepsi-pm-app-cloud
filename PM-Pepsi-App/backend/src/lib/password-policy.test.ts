import { describe, expect, it } from 'vitest'
import { generateTemporaryPassword, validatePasswordMinLength } from './password-policy.js'

describe('generateTemporaryPassword', () => {
  it('validates min length', () => {
    expect(validatePasswordMinLength('short', 12).ok).toBe(false)
    expect(validatePasswordMinLength('long-enough-pass', 12).ok).toBe(true)
  })

  it('returns 12 chars with required character classes', () => {
    const pwd = generateTemporaryPassword()
    expect(pwd).toHaveLength(12)
    expect(/[A-Z]/.test(pwd)).toBe(true)
    expect(/[a-z]/.test(pwd)).toBe(true)
    expect(/[0-9]/.test(pwd)).toBe(true)
    expect(/[!@#$%&*\-_+=?]/.test(pwd)).toBe(true)
  })
})
