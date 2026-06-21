import { describe, expect, it } from 'vitest'
import { resolveBoardPeriodDateRange } from './board-period.js'

describe('resolveBoardPeriodDateRange', () => {
  const tz = 'Asia/Bangkok'
  const ref = new Date('2026-05-22T12:00:00+07:00') // Fri 22 May 2026 (Bangkok)

  it('resolves today', () => {
    expect(resolveBoardPeriodDateRange('today', tz, ref)).toEqual({
      from: '2026-05-22',
      to: '2026-05-22',
    })
  })

  it('resolves 7d', () => {
    expect(resolveBoardPeriodDateRange('7d', tz, ref)).toEqual({
      from: '2026-05-16',
      to: '2026-05-22',
    })
  })

  it('resolves Mon–Sun week', () => {
    expect(resolveBoardPeriodDateRange('week', tz, ref)).toEqual({
      from: '2026-05-18',
      to: '2026-05-24',
    })
  })
})
