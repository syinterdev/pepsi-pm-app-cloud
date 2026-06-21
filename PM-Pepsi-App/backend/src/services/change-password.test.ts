import { describe, expect, it } from 'vitest'
import { ChangePasswordError } from './change-password.js'

describe('ChangePasswordError', () => {
  it('exposes error codes for API mapping', () => {
    const err = new ChangePasswordError('CONFIRM_MISMATCH', 'ยืนยันรหัสผ่านไม่ตรงกัน')
    expect(err.code).toBe('CONFIRM_MISMATCH')
    expect(err.message).toContain('ยืนยัน')
  })
})
