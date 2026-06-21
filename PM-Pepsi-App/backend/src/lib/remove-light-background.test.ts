import { describe, expect, it } from 'vitest'
import sharp from 'sharp'
import { parseRemoveBackgroundField, removeLightBackgroundBuffer } from './remove-light-background.js'

describe('remove-light-background', () => {
  it('parses removeBackground form field', () => {
    expect(parseRemoveBackgroundField('1')).toBe(true)
    expect(parseRemoveBackgroundField('true')).toBe(true)
    expect(parseRemoveBackgroundField('0')).toBe(false)
    expect(parseRemoveBackgroundField(undefined)).toBe(false)
  })

  it('makes white corners transparent', async () => {
    const input = await sharp({
      create: {
        width: 40,
        height: 40,
        channels: 3,
        background: { r: 255, g: 255, b: 255 },
      },
    })
      .composite([
        {
          input: await sharp({
            create: {
              width: 20,
              height: 20,
              channels: 3,
              background: { r: 200, g: 0, b: 0 },
            },
          })
            .png()
            .toBuffer(),
          left: 10,
          top: 10,
        },
      ])
      .png()
      .toBuffer()

    const out = await removeLightBackgroundBuffer(input)
    const { data, info } = await sharp(out).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
    const channels = info.channels ?? 4
    const cornerAlpha = data[channels - 1]!
    const centerIdx = (20 * info.width! + 20) * channels + (channels - 1)
    const centerAlpha = data[centerIdx]!
    expect(cornerAlpha).toBe(0)
    expect(centerAlpha).toBeGreaterThan(200)
  })
})
