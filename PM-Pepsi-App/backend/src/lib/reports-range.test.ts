import { describe, expect, it } from 'vitest'
import {
  computeSummaryWeeklyPercents,
  resolveReportsRange,
  safeRatio,
  weekLabelsInRange,
} from './reports-range.js'

describe('reports-range', () => {
  it('resolves explicit from/to dates', () => {
    const r = resolveReportsRange({ fromInput: '01.04.2026', toInput: '01.05.2026' })
    expect(r.to).toBeGreaterThanOrEqual(r.from)
    expect(r.fromDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('defaults to weeksBack window', () => {
    const r = resolveReportsRange({ weeksBack: 8 })
    expect(r.to).toBeGreaterThan(r.from)
  })

 it('computes weekly percent totals for weekly percent totals', () => {
    const p = computeSummaryWeeklyPercents(40, 10, 5, 8)
    expect(p.percentPm).toBe(25)
    expect(p.percentTotal).toBe(57.5)
  })

  it('safeRatio returns 0 when denominator is 0', () => {
    expect(safeRatio(10, 0)).toBe(0)
  })

  it('builds week labels for KPI charts', () => {
    const range = resolveReportsRange({ fromInput: '01.04.2026', toInput: '15.05.2026' })
    const labels = weekLabelsInRange(range)
    expect(labels.length).toBeGreaterThan(0)
  })

  it('uses Pepsi week 1 from 1 January', () => {
    const jan1 = parseWorkdayForTest('01.01.2026')
    const jan8 = parseWorkdayForTest('08.01.2026')
    const labels = weekLabelsInRange({
      from: jan1,
      to: jan8,
      fromDate: '2026-01-01',
      toDate: '2026-01-08',
    })
    expect(labels).toContain('2026-W01')
    expect(labels).toContain('2026-W02')
  })
})

function parseWorkdayForTest(s: string): number {
  const [d, m, y] = s.split('.').map(Number)
  return Math.floor(Date.UTC(y!, m! - 1, d!, 5, 0, 0) / 1000)
}
