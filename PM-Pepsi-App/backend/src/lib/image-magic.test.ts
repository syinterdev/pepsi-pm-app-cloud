import { describe, expect, it } from 'vitest'
import { assertBrandingUploadAllowed, detectImageBuffer } from './image-magic.js'

describe('image-magic', () => {
  it('detects PNG signature', () => {
    const buf = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    expect(detectImageBuffer(buf)?.kind).toBe('png')
  })

  it('rejects unknown bytes', () => {
    expect(detectImageBuffer(Buffer.from('not an image'))).toBeNull()
  })

  it('allows SVG after sanitize path', () => {
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><rect width="1" height="1"/></svg>')
    const d = assertBrandingUploadAllowed(svg, 'image/svg+xml')
    expect(d.kind).toBe('svg')
  })
})
