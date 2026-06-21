import { describe, expect, it, vi, beforeEach } from 'vitest'
import {
  isLoginLocked,
  recordFailedLogin,
  clearLoginAttempts,
  resetLoginLockoutState,
} from './login-lockout.js'

vi.mock('./security-settings.js', () => ({
  getMaxLoginAttempts: vi.fn(async () => 3),
}))

const pool = {} as import('pg').Pool

describe('login lockout', () => {
  beforeEach(() => {
    resetLoginLockoutState()
  })

  it('locks after max failed attempts', async () => {
    recordFailedLogin('1.2.3.4', 'user1')
    recordFailedLogin('1.2.3.4', 'user1')
    recordFailedLogin('1.2.3.4', 'user1')
    const locked = await isLoginLocked(pool, '1.2.3.4', 'user1')
    expect(locked.locked).toBe(true)
  })

  it('clears on successful login path', async () => {
    recordFailedLogin('1.2.3.4', 'user2')
    recordFailedLogin('1.2.3.4', 'user2')
    clearLoginAttempts('1.2.3.4', 'user2')
    const locked = await isLoginLocked(pool, '1.2.3.4', 'user2')
    expect(locked.locked).toBe(false)
  })
})
