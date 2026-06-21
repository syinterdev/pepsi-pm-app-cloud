import sharp from 'sharp'
import { describe, expect, it } from 'vitest'
import { convertConfirmImageToWebp } from './confirm-image.js'

describe('convertConfirmImageToWebp', () => {
  it('returns webp buffer and .webp file name', async () => {
    const input = await sharp({
      create: { width: 64, height: 48, channels: 3, background: '#336699' },
    })
      .jpeg()
      .toBuffer()

    const out = await convertConfirmImageToWebp(input, 42)

    expect(out.mime).toBe('image/webp')
    expect(out.fileName).toMatch(/^42_\d+_[a-f0-9]+\.webp$/)
    expect(out.bytes).toBeGreaterThan(0)
    expect(out.data.length).toBe(out.bytes)

    const meta = await sharp(out.data).metadata()
    expect(meta.format).toBe('webp')
  })

  it('rejects empty buffer', async () => {
    await expect(convertConfirmImageToWebp(Buffer.alloc(0), 1)).rejects.toThrow(
      /Empty image buffer/,
    )
  })
})
