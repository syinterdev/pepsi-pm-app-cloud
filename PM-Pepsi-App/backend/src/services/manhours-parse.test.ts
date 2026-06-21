import { describe, expect, it } from 'vitest'
import { parseWorkday } from './manhours.js'

describe('parseWorkday', () => {
  it('accepts ISO yyyy-mm-dd from API query params', () => {
    const sec = parseWorkday('2026-04-22')
    expect(sec).toBeGreaterThan(0)
    const d = new Date(sec * 1000)
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(3)
    expect(d.getDate()).toBe(22)
  })

  it('still accepts dd.mm.yyyy', () => {
    expect(parseWorkday('22.04.2026')).toBe(parseWorkday('2026-04-22'))
  })

  it('rejects malformed ISO', () => {
    expect(() => parseWorkday('2026-13-40')).toThrow(/Invalid date/)
  })
})
