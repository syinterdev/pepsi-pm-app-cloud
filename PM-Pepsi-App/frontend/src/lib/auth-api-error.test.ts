import '@/i18n'
import { describe, expect, it } from 'vitest'
import { AuthApiError, resolveAuthFeedback } from '@/lib/auth-api-error'
import { MaintenanceModeError } from '@/lib/maintenance-error'

describe('resolveAuthFeedback', () => {
  it('maps INVALID_CREDENTIALS', () => {
    const fb = resolveAuthFeedback(
      new AuthApiError(401, 'INVALID_CREDENTIALS', 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง'),
    )
    expect(fb.kind).toBe('invalid')
    expect(fb.title).toBe('Sign-in failed')
  })

  it('maps LOGIN_LOCKED', () => {
    const fb = resolveAuthFeedback(
      new AuthApiError(429, 'LOGIN_LOCKED', 'เข้าสู่ระบบผิดพลาดเกิน 5 ครั้ง'),
    )
    expect(fb.kind).toBe('lockout')
    expect(fb.title).toBe('Temporarily locked')
  })

  it('maps IP_BLOCKED', () => {
    const fb = resolveAuthFeedback(
      new AuthApiError(403, 'IP_BLOCKED', 'IP นี้ถูกระงับ'),
    )
    expect(fb.kind).toBe('blocked')
    expect(fb.title).toBe('Access denied')
  })

  it('maps maintenance', () => {
    const fb = resolveAuthFeedback(new MaintenanceModeError('ปิดปรับปรุง'))
    expect(fb.kind).toBe('maintenance')
    expect(fb.title).toBe('Maintenance mode')
  })
})
