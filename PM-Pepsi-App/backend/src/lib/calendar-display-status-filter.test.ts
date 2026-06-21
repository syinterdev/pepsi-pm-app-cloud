import { describe, expect, it } from 'vitest'
import {
  appendCalendarDisplayStatusFilter,
  matchesCalendarDisplayStatus,
} from './calendar-display-status-filter.js'

function isoDayStart(iso: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)!
  return Math.floor(
    new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).getTime() / 1000,
  )
}

describe('matchesCalendarDisplayStatus', () => {
  const now = new Date(2026, 5, 15, 12, 0, 0) // 15 Jun 2026
  const today = isoDayStart('2026-06-15')
  const yesterday = isoDayStart('2026-06-14')
  const tomorrow = isoDayStart('2026-06-16')

  it('classifies completed when syst closed', () => {
    expect(
      matchesCalendarDisplayStatus(
        'completed',
        { syst: 'TECO', displayUnix: today },
        now,
      ),
    ).toBe(true)
  })

  it('classifies overdue', () => {
    expect(
      matchesCalendarDisplayStatus(
        'overdue',
        { syst: 'REL', displayUnix: yesterday },
        now,
      ),
    ).toBe(true)
  })

  it('classifies upcoming', () => {
    expect(
      matchesCalendarDisplayStatus(
        'upcoming',
        { syst: 'CRTD', displayUnix: tomorrow },
        now,
      ),
    ).toBe(true)
  })

  it('classifies in_progress today', () => {
    expect(
      matchesCalendarDisplayStatus(
        'in_progress',
        { syst: 'REL', displayUnix: today },
        now,
      ),
    ).toBe(true)
  })
})

describe('appendCalendarDisplayStatusFilter', () => {
  it('returns empty when no codes', () => {
    expect(appendCalendarDisplayStatusFilter([], 'o', 'v', [])).toBe('')
  })

  it('treats undefined like empty (calendar filter omitted)', () => {
    expect(appendCalendarDisplayStatusFilter(undefined, 'o', 'v', [])).toBe('')
  })

  it('builds OR clause', () => {
    const params: unknown[] = []
    const sql = appendCalendarDisplayStatusFilter(['overdue', 'completed'], 'o', 'v', params)
    expect(sql).toContain(' AND (')
    expect(sql).toContain('OR')
  })
})
