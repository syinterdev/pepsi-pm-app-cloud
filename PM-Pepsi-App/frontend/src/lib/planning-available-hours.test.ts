import { describe, expect, it } from 'vitest'
import { formatPlanningAvailableLine, formatPlanningHourValue } from './planning-available-hours'

describe('formatPlanningHourValue', () => {
  it('formats decimals', () => {
    expect(formatPlanningHourValue(5.5)).toBe('5.5')
  })

  it('shows dash when missing', () => {
    expect(formatPlanningHourValue(null)).toBe('—')
  })
})

describe('formatPlanningAvailableLine', () => {
  it('shows available breakdown', () => {
    expect(
      formatPlanningAvailableLine({
        wkctr: 'P1',
        displayName: 'A',
        hrHours: 8,
        plannedHours: 3,
        availableHours: 5,
      }),
    ).toBe('ว่าง 5 ชม. · HR 8 − แผน 3')
  })
})
