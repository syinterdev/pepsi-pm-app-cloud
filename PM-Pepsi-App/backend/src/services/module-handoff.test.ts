import { describe, expect, it } from 'vitest'
import {
  buildModuleRedirectUrl,
  generateHandoffCode,
  hashHandoffCode,
  parseModuleHandoffClients,
} from './module-handoff.js'

describe('module-handoff helpers', () => {
  it('hashes codes deterministically', () => {
    const code = 'test-code'
    expect(hashHandoffCode(code)).toHaveLength(64)
    expect(hashHandoffCode(code)).toBe(hashHandoffCode(code))
  })

  it('generates opaque codes', () => {
    const a = generateHandoffCode()
    const b = generateHandoffCode()
    expect(a.length).toBeGreaterThan(20)
    expect(a).not.toBe(b)
  })

  it('builds redirect URL with query params', () => {
    const url = buildModuleRedirectUrl(
      'https://store.example.com/',
      '/auth/callback',
      'abc123',
      'store',
    )
    expect(url).toBe('https://store.example.com/auth/callback?code=abc123&module=store')
  })

  it('parses MODULE_HANDOFF_CLIENTS', () => {
    const map = parseModuleHandoffClients('store:secret1,repair:secret2')
    expect(map.get('store')).toBe('secret1')
    expect(map.get('repair')).toBe('secret2')
  })
})
