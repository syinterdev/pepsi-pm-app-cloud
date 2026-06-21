import { describe, expect, it } from 'vitest'
import {
  formatPersonnelCloseDateTime,
  formatPersonnelCloseDuration,
  previewDurationMinutes,
} from './personnel-close-format'

describe('personnel-close-format', () => {
  it('formats datetime as DD.MM.YYYY HH:mm', () => {
    const sec = Math.floor(new Date(2026, 4, 22, 13, 0, 0).getTime() / 1000)
    expect(formatPersonnelCloseDateTime(sec)).toBe('22.05.2026 13:00')
  })

  it('formats duration with two decimals and Min unit', () => {
    expect(formatPersonnelCloseDuration(40)).toBe('40.00 Min')
  })

  it('previewDurationMinutes matches customer example', () => {
    expect(
      previewDurationMinutes('22.05.2026', '13:00', '22.05.2026', '13:40'),
    ).toBe(40)
  })
})
