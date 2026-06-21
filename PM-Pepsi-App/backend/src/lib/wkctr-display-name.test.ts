import { describe, expect, it } from 'vitest'
import { displayNameFromWkctrRow, formatDdMmYyyyFromEpochSeconds } from './wkctr-display-name.js'

describe('displayNameFromWkctrRow', () => {
  it('prefers Thai name parts', () => {
    expect(
      displayNameFromWkctrRow({
        titlewkctr: 'Mr.',
        namewkctr: 'Somchai',
        surnamewkctr: 'Tech',
        titlewkctreng: null,
        namewkctreng: null,
        surnamewkctreng: null,
      }),
    ).toBe('Mr. Somchai Tech')
  })

  it('falls back to English name', () => {
    expect(
      displayNameFromWkctrRow({
        titlewkctr: '',
        namewkctr: '',
        surnamewkctr: '',
        titlewkctreng: 'Ms.',
        namewkctreng: 'Jane',
        surnamewkctreng: 'Doe',
      }),
    ).toBe('Ms. Jane Doe')
  })
})

describe('formatDdMmYyyyFromEpochSeconds', () => {
  it('formats epoch as DD.MM.YYYY', () => {
    const sec = Math.floor(new Date(2026, 4, 26, 15, 30).getTime() / 1000)
    expect(formatDdMmYyyyFromEpochSeconds(sec)).toBe('26.05.2026')
  })
})
