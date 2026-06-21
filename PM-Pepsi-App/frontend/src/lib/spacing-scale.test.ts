import { describe, expect, it } from 'vitest'
import { APP_SPACING_SCALE, appSpacingPx } from './spacing-scale'

describe('spacing scale', () => {
  it('matches U0 spec 4/8/12/16/24/32', () => {
    expect([...APP_SPACING_SCALE]).toEqual([4, 8, 12, 16, 24, 32])
    expect(appSpacingPx(4)).toBe(16)
    expect(appSpacingPx(6)).toBe(32)
  })
})
