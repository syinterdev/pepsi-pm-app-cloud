import { describe, expect, it } from 'vitest'
import { parseConfirmImagePhase, normalizeConfirmImageCaption } from './confirm-image-phase.js'

describe('confirm-image-phase', () => {
  it('parses before and after', () => {
    expect(parseConfirmImagePhase('before')).toBe('before')
    expect(parseConfirmImagePhase('After')).toBe('after')
    expect(parseConfirmImagePhase('')).toBeNull()
  })

  it('trims caption', () => {
    expect(normalizeConfirmImageCaption('  hello  ')).toBe('hello')
  })
})
