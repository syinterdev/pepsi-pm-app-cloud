import { describe, expect, it } from 'vitest'
import {
  expandActivityFilterCodes,
  formatActivityTypeFilterLabel,
  listActivityFilterOptions,
  PM_PLAN_TEAM_FILTER_OPTIONS,
} from './activity-type-label.js'

describe('activity-type-label', () => {
  it('lists customer Z1 Z2 Z5 filter options', () => {
    expect(listActivityFilterOptions()).toEqual([
      { code: 'Z1', label: 'Z1 = Break Down Maintenance' },
      { code: 'Z2', label: 'Z2 = Preventive Maintenance' },
      { code: 'Z5', label: 'Z5 = Corrective Maintenance' },
    ])
  })

  it('expands Z codes to IW37N mat values', () => {
    expect(expandActivityFilterCodes(['Z2'])).toEqual(
      expect.arrayContaining(['2', 'PM01']),
    )
    expect(expandActivityFilterCodes(['Z1', 'Z5'])).toEqual(
      expect.arrayContaining(['1', '5', 'CM01']),
    )
  })

  it('maps numeric mat to Z display labels', () => {
    expect(formatActivityTypeFilterLabel('1')).toBe(
      'Z1 = Break Down Maintenance',
    )
    expect(formatActivityTypeFilterLabel('2')).toBe(
      'Z2 = Preventive Maintenance',
    )
    expect(formatActivityTypeFilterLabel('5')).toBe(
      'Z5 = Corrective Maintenance',
    )
  })

  it('lists PM Plan team filter A B EE UT', () => {
    expect(PM_PLAN_TEAM_FILTER_OPTIONS.map((o) => o.code)).toEqual([
      'A',
      'B',
      'EE',
      'UT',
    ])
  })
})
