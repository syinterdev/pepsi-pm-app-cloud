import { describe, expect, it } from 'vitest'
import { formatPlatformLabel, resolveAboutLicense } from './admin-about-license.js'

describe('resolveAboutLicense', () => {
  it('prefers env status when set', () => {
    const r = resolveAboutLicense(new Map(), {
      status: 'trial',
      expires: '2030-01-01T00:00:00.000Z',
    })
    expect(r.status).toBe('trial')
    expect(r.expiresAt).toBe('2030-01-01T00:00:00.000Z')
  })

  it('detects configured key in settings', () => {
    const r = resolveAboutLicense(new Map([['app.license_key', 'PEPSI-XXXX']]), {})
    expect(r.status).toBe('configured')
  })

  it('marks expired when expiresAt is in the past', () => {
    const r = resolveAboutLicense(new Map([['app.license_key', 'k']]), {
      expires: '2000-01-01T00:00:00.000Z',
    })
    expect(r.status).toBe('expired')
  })

  it('returns not_configured when empty', () => {
    expect(resolveAboutLicense(new Map(), {}).status).toBe('not_configured')
    expect(resolveAboutLicense(new Map([['app.license_key', null]]), {}).status).toBe(
      'not_configured',
    )
  })
})

describe('formatPlatformLabel', () => {
  it('labels win32 as Windows Server', () => {
    expect(formatPlatformLabel('win32')).toContain('Windows')
  })
})
