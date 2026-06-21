import { describe, expect, it } from 'vitest'
import { resolveBaseFontSizePx, typographyCssVars } from './typography.js'

describe('typography', () => {
  it('resolves comfortable preset', () => {
    expect(resolveBaseFontSizePx('comfortable', null)).toBe(15)
  })

  it('clamps custom px', () => {
    expect(resolveBaseFontSizePx('compact', 30)).toBe(22)
    expect(resolveBaseFontSizePx('large', 8)).toBe(12)
  })

  it('includes SF Pro stack for macos', () => {
    const vars = typographyCssVars({
      fontFamily: 'macos',
      fontSizePreset: 'comfortable',
    })
    expect(vars['--app-font-family']).toContain('SF Pro')
    expect(vars['--app-font-family']).toContain('-apple-system')
  })

  it('emits css vars with colors', () => {
    const vars = typographyCssVars({
      fontFamily: 'sarabun',
      fontSizePreset: 'comfortable',
      fontColor: '#112233',
    })
    expect(vars['--app-font-size-base']).toBe('15px')
    expect(vars['--app-text']).toBe('#112233')
  })
})
