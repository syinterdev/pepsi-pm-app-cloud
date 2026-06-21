import { describe, expect, it } from 'vitest'
import { parseBoardThemeFromSearchParams } from './board-theme'

describe('board-theme', () => {
  it('parses theme query', () => {
    expect(parseBoardThemeFromSearchParams(new URLSearchParams('theme=light'))).toBe('light')
    expect(parseBoardThemeFromSearchParams(new URLSearchParams('theme=dark'))).toBe('dark')
    expect(parseBoardThemeFromSearchParams(new URLSearchParams())).toBe(null)
  })
})
