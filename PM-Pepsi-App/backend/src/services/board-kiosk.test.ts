import { describe, expect, it } from 'vitest'
import { extractBoardKioskTokenFromRequest } from './board-kiosk.js'

describe('extractBoardKioskTokenFromRequest', () => {
  it('reads header then query', () => {
    expect(
      extractBoardKioskTokenFromRequest({
        headers: { 'x-board-kiosk-token': ' abc ' },
        query: { token: 'q' },
      }),
    ).toBe('abc')
    expect(
      extractBoardKioskTokenFromRequest({
        headers: {},
        query: { kiosk_token: 'from-query' },
      }),
    ).toBe('from-query')
  })
})
