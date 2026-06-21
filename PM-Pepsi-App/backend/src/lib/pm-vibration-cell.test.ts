import { describe, expect, it } from 'vitest'
import { parseDstDbCell } from './pm-vibration-cell.js'

describe('parseDstDbCell', () => {
  it('parses Dst 08 dB 45', () => {
    expect(parseDstDbCell('Dst 08 dB 45')).toEqual({ dst: 8, db: 45 })
  })

  it('parses Dst:07 dB Lev:37', () => {
    expect(parseDstDbCell('Dst:07 dB Lev:37')).toEqual({ dst: 7, db: 37 })
  })

  it('parses lowercase and decimals', () => {
    expect(parseDstDbCell('dst 5.5 dB 30.2')).toEqual({ dst: 5.5, db: 30.2 })
  })

  it('returns null for plain numbers or garbage', () => {
    expect(parseDstDbCell('45')).toBeNull()
    expect(parseDstDbCell('')).toBeNull()
  })
})
