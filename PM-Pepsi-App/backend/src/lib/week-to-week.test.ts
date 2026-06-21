import { describe, expect, it } from 'vitest'
import { buildWeekToWeek } from './week-to-week.js'

describe('buildWeekToWeek', () => {
  it('computes deltas between consecutive weeks', () => {
    const rows = buildWeekToWeek(
      ['2026-W01', '2026-W02', '2026-W03'],
      [50, 60, 55],
      [100, 90, 95],
    )
    expect(rows).toHaveLength(2)
    expect(rows[0]?.utilizationDelta).toBe(10)
    expect(rows[0]?.backlogDelta).toBe(-10)
    expect(rows[1]?.weekLabel).toBe('2026-W03')
  })
})
