import { describe, expect, it } from 'vitest'
import { normalizeClientIp } from './normalize-ip.js'

describe('normalizeClientIp', () => {
  it('accepts IPv4', () => {
    expect(normalizeClientIp('192.168.1.10')).toBe('192.168.1.10')
  })

  it('strips IPv4-mapped prefix', () => {
    expect(normalizeClientIp('::ffff:10.0.0.5')).toBe('10.0.0.5')
  })

  it('rejects invalid', () => {
    expect(normalizeClientIp('not-an-ip')).toBeNull()
    expect(normalizeClientIp('')).toBeNull()
  })
})
