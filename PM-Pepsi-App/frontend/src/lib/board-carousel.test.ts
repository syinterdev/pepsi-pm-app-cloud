import { describe, expect, it } from 'vitest'
import {
  nextBoardCarouselSlide,
  parseBoardCarouselFromSearchParams,
} from './board-carousel'

describe('board-carousel', () => {
  it('cycles a → b → c → a', () => {
    expect(nextBoardCarouselSlide('a')).toBe('b')
    expect(nextBoardCarouselSlide('b')).toBe('c')
    expect(nextBoardCarouselSlide('c')).toBe('a')
  })

  it('parses carousel query param', () => {
    expect(parseBoardCarouselFromSearchParams(new URLSearchParams('carousel=1'))).toBe(true)
    expect(parseBoardCarouselFromSearchParams(new URLSearchParams('carousel=off'))).toBe(false)
    expect(parseBoardCarouselFromSearchParams(new URLSearchParams())).toBe(null)
  })
})
