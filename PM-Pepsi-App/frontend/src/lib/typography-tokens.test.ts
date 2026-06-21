import { describe, expect, it } from 'vitest'
import { deriveTypographyScale, resolveBaseFontSizePx } from './typography-tokens'

describe('typography scale', () => {
  it('comfortable preset uses 15px base', () => {
    expect(resolveBaseFontSizePx('comfortable', null)).toBe(15)
    const s = deriveTypographyScale(15)
    expect(s.base).toBe(15)
    expect(s.caption).toBe(13)
    expect(s.pageTitle).toBe(24)
  })

  it('scales headings from base', () => {
    const s = deriveTypographyScale(17)
    expect(s.lg).toBe(20)
    expect(s.xl).toBe(23)
    expect(s.pageTitle).toBe(27)
  })
})
