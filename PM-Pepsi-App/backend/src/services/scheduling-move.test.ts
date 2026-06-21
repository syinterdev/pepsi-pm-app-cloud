import { describe, expect, it } from 'vitest'
import { isPlanMovableStatus } from './scheduling-shared.js'

describe('isPlanMovableStatus', () => {
  it('allows CRTD and REL only', () => {
    expect(isPlanMovableStatus('CRTD')).toBe(true)
    expect(isPlanMovableStatus('REL')).toBe(true)
  })

  it('blocks TECO and other closed statuses (green plan)', () => {
    expect(isPlanMovableStatus('TECO')).toBe(false)
    expect(isPlanMovableStatus('CLSD')).toBe(false)
    expect(isPlanMovableStatus('COMP')).toBe(false)
    expect(isPlanMovableStatus('')).toBe(false)
  })
})
