import { describe, expect, it } from 'vitest'
import { resolveHrConfirmPeriod } from './manhour-hr-confirm.js'

describe('resolveHrConfirmPeriod', () => {
  it('resolves April 2026 month range', () => {
    const r = resolveHrConfirmPeriod({ period: 'month', month: '2026-04' })
    expect(r.period).toBe('month')
    expect(r.range.fromDate).toBe('2026-04-01')
    expect(r.range.toDate).toBe('2026-04-30')
    expect(r.periodLabel).toMatch(/เมษายน/)
  })

  it('resolves Pepsi work week W17 2026', () => {
    const r = resolveHrConfirmPeriod({ period: 'week', week: '2026-W17' })
    expect(r.period).toBe('week')
    expect(r.range.to).toBeGreaterThanOrEqual(r.range.from)
    expect(r.periodLabel).toContain('2026')
  })
})
