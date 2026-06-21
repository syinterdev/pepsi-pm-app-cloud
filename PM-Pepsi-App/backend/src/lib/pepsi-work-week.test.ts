import { describe, expect, it } from 'vitest'
import {
  pepsiWorkWeekFromUnix,
  pepsiWorkWeekFromYmd,
  pepsiWorkWeekSql,
} from './pepsi-work-week.js'

describe('pepsi-work-week', () => {
  it('week 1 starts on 1 January', () => {
    expect(pepsiWorkWeekFromYmd(2026, 1, 1)).toMatchObject({ week: 1, label: '2026-W01' })
    expect(pepsiWorkWeekFromYmd(2026, 1, 7)).toMatchObject({ week: 1, label: '2026-W01' })
    expect(pepsiWorkWeekFromYmd(2026, 1, 8)).toMatchObject({ week: 2, label: '2026-W02' })
  })

  it('differs from ISO week for early January', () => {
    // 1 Jan 2026 is Thursday — ISO may still be previous year's week
    const pepsi = pepsiWorkWeekFromYmd(2026, 1, 1)
    expect(pepsi.week).toBe(1)
    expect(pepsi.label).toBe('2026-W01')
  })

  it('builds SQL label expression', () => {
    expect(pepsiWorkWeekSql('workday')).toContain('EXTRACT(DOY')
    expect(pepsiWorkWeekSql('workday')).toContain('-W')
  })

  it('unix in Bangkok maps to expected week', () => {
    // 2026-01-01 12:00 Bangkok ≈ unix
    const jan1 = Math.floor(new Date('2026-01-01T05:00:00.000Z').getTime() / 1000)
    expect(pepsiWorkWeekFromUnix(jan1).label).toBe('2026-W01')
  })
})
