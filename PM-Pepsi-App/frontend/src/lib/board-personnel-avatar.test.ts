import { afterEach, describe, expect, it } from 'vitest'
import { boardPersonnelAvatarUrl } from './board-personnel-avatar'
import { setBoardKioskToken } from './board-kiosk'

describe('boardPersonnelAvatarUrl', () => {
  afterEach(() => {
    setBoardKioskToken(null)
  })

  it('builds board avatar path', () => {
    expect(boardPersonnelAvatarUrl('PAC010')).toBe(
      '/api/v1/board/personnel/PAC010/avatar',
    )
  })

  it('appends kiosk_token when board kiosk is active', () => {
    setBoardKioskToken('secret-tok')
    const url = boardPersonnelAvatarUrl('PAC010')
    expect(url).toContain('/api/v1/board/personnel/PAC010/avatar')
    expect(url).toContain('kiosk_token=secret-tok')
  })
})
