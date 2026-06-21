import { describe, expect, it } from 'vitest'
import {
  manhourInclusivePeriodDays,
  manhourOverlapDaysOnTarget,
  prorateManhourHoursToDay,
} from './manhour-day-prorate.js'

function isoDayStart(iso: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)!
  const yyyy = Number(m[1])
  const mm = Number(m[2])
  const dd = Number(m[3])
  return Math.floor(new Date(yyyy, mm - 1, dd, 0, 0, 0, 0).getTime() / 1000)
}

describe('manhourInclusivePeriodDays', () => {
  it('counts Mon–Fri as 5 days', () => {
    const mon = isoDayStart('2026-06-01')
    const fri = isoDayStart('2026-06-05')
    expect(manhourInclusivePeriodDays(mon, fri)).toBe(5)
  })

  it('single day is 1', () => {
    const d = isoDayStart('2026-06-10')
    expect(manhourInclusivePeriodDays(d, d)).toBe(1)
  })
})

describe('prorateManhourHoursToDay', () => {
  it('splits 40h week evenly across 5 days', () => {
    const mon = isoDayStart('2026-06-01')
    const fri = isoDayStart('2026-06-05')
    const wedStart = isoDayStart('2026-06-03')
    const wedEnd = wedStart + 86400
    const h = prorateManhourHoursToDay(40, mon, fri, wedStart, wedEnd)
    expect(h).toBe(8)
  })

  it('returns 0 when target day outside period', () => {
    const mon = isoDayStart('2026-06-01')
    const fri = isoDayStart('2026-06-05')
    const sun = isoDayStart('2026-06-07')
    expect(prorateManhourHoursToDay(40, mon, fri, sun, sun + 86400)).toBe(0)
  })

  it('full amount on single-day manhour row', () => {
    const d = isoDayStart('2026-06-10')
    expect(prorateManhourHoursToDay(7.5, d, d, d, d + 86400)).toBe(7.5)
  })
})

describe('manhourOverlapDaysOnTarget', () => {
  it('overlap 1 day in middle of week', () => {
    const mon = isoDayStart('2026-06-01')
    const fri = isoDayStart('2026-06-05')
    const wed = isoDayStart('2026-06-03')
    expect(manhourOverlapDaysOnTarget(mon, fri, wed, wed + 86400)).toBe(1)
  })
})
