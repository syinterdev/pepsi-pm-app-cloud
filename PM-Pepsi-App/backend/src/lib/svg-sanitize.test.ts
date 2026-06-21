import { describe, expect, it } from 'vitest'
import { sanitizeSvgMarkup } from './svg-sanitize.js'

describe('sanitizeSvgMarkup', () => {
  it('strips script tags', () => {
    const out = sanitizeSvgMarkup(
      '<svg><script>alert(1)</script><rect width="10" height="10"/></svg>',
    )
    expect(out).not.toContain('<script')
    expect(out).toContain('<rect')
  })

  it('rejects non-svg', () => {
    expect(() => sanitizeSvgMarkup('<html></html>')).toThrow()
  })
})
