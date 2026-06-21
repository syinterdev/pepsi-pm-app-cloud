import { describe, expect, it } from 'vitest'
import { resolveManhourPerformanceRange } from '@/lib/manhour-performance-period'

describe('manhour-performance-period', () => {
  it('resolves daily as single day', () => {
    const r = resolveManhourPerformanceRange({ period: 'daily', day: '2026-06-20' })
    expect(r.from).toBe('2026-06-20')
    expect(r.to).toBe('2026-06-20')
    expect(r.periodLabel).toContain('มิถุนายน')
  })

  it('resolves weekly Pepsi week range', () => {
    const r = resolveManhourPerformanceRange({ period: 'weekly', week: '2026-W01' })
    expect(r.from).toBe('2026-01-01')
    expect(r.to).toBe('2026-01-07')
    expect(r.periodLabel).toContain('สัปดาห์ที่ 1/2026')
  })

  it('resolves yearly Jan 1 through Dec 31 for past years', () => {
    const r = resolveManhourPerformanceRange({ period: 'yearly', year: 2024 })
    expect(r.from).toBe('2024-01-01')
    expect(r.to).toBe('2024-12-31')
  })
})
