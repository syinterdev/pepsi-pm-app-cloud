import { describe, expect, it } from 'vitest'
import { resolveBoardPeriodDateRange } from '@/lib/board-period'

describe('resolveBoardPeriodDateRange', () => {
  const ref = new Date(2026, 4, 22, 15, 0, 0) // Fri 22 May 2026

  it('today is single day', () => {
    const r = resolveBoardPeriodDateRange('today', ref)
    expect(r.from).toBe('2026-05-22')
    expect(r.to).toBe('2026-05-22')
  })

  it('7d is 7 calendar days ending ref', () => {
    const r = resolveBoardPeriodDateRange('7d', ref)
    expect(r.from).toBe('2026-05-16')
    expect(r.to).toBe('2026-05-22')
  })

  it('week is Mon–Sun containing ref', () => {
    const r = resolveBoardPeriodDateRange('week', ref)
    expect(r.from).toBe('2026-05-18')
    expect(r.to).toBe('2026-05-24')
  })
})
