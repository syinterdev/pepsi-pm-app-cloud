import { describe, expect, it } from 'vitest'
import { mergeWorkcenterAvailableHours } from './planning-available-hours.js'
import { prorateManhourHoursToDay } from './manhour-day-prorate.js'

describe('mergeWorkcenterAvailableHours', () => {
  it('attaches hour fields from map', () => {
    const map = new Map([
      [
        'PRO001',
        {
          wkctr: 'PRO001',
          hrHours: 8,
          plannedHours: 3,
          availableHours: 5,
          hasManhour: true,
        },
      ],
    ])
    const merged = mergeWorkcenterAvailableHours(
      [{ wkctr: 'PRO001', displayName: 'A' }],
      map,
    )
    expect(merged[0]).toMatchObject({
      hrHours: 8,
      plannedHours: 3,
      availableHours: 5,
    })
  })

  it('returns nulls when no data', () => {
    const merged = mergeWorkcenterAvailableHours(
      [{ wkctr: 'X', displayName: 'Y' }],
      new Map(),
    )
    expect(merged[0]).toMatchObject({
      hrHours: null,
      plannedHours: null,
      availableHours: null,
    })
  })
})

describe('HR prorate integration', () => {
  it('weekly 40h yields 8h on one weekday', () => {
    const mon = Math.floor(new Date(2026, 5, 1).getTime() / 1000)
    const fri = Math.floor(new Date(2026, 5, 5).getTime() / 1000)
    const wed = Math.floor(new Date(2026, 5, 3).getTime() / 1000)
    expect(prorateManhourHoursToDay(40, mon, fri, wed, wed + 86400)).toBe(8)
  })
})
