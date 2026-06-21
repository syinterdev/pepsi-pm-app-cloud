import { describe, expect, it } from 'vitest'
import { formatCalendarDayCellSummary, formatCalendarDayHourLabel } from './calendar-day-hours'

describe('formatCalendarDayHourLabel', () => {
  it('formats fractional hours', () => {
    expect(formatCalendarDayHourLabel(0.5)).toBe('0.5 Hour')
  })
})

describe('formatCalendarDayCellSummary', () => {
  it('shows WO count and hours per customer 4.2', () => {
    expect(formatCalendarDayCellSummary(10, 10.5)).toBe('10 WO 10.5 Hrs')
  })

  it('shows only WO when no hours', () => {
    expect(formatCalendarDayCellSummary(2, 0)).toBe('2 WO')
  })

  it('shows only hours when count is zero', () => {
    expect(formatCalendarDayCellSummary(0, 1)).toBe('1 Hr')
  })
})
