import { describe, expect, it } from 'vitest'
import { resolveWoPmPhase } from './wo-pm-phase.js'

describe('resolveWoPmPhase', () => {
  it('maps CRTD to Create', () => {
    expect(resolveWoPmPhase('CRTD')).toBe('create')
  })

  it('maps REL to REL', () => {
    expect(resolveWoPmPhase('REL')).toBe('rel')
  })

  it('maps closed SAP statuses to Confirm', () => {
    expect(resolveWoPmPhase('TECO')).toBe('confirm')
    expect(resolveWoPmPhase('CLSD')).toBe('confirm')
  })
})
