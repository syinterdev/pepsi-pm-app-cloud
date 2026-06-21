import { describe, expect, it } from 'vitest'
import {
  derivePlanningWorkcenterTags,
  matchesPlanningCategoryFilter,
  woTeamToShiftLabel,
} from './planning-workcenter-tags.js'

describe('derivePlanningWorkcenterTags', () => {
  it('maps cat A/B and craft from wkctrtype', () => {
    expect(derivePlanningWorkcenterTags({ cat: 'A', wkctrtype: 'EE-ME' })).toEqual({
      shiftTags: ['AA'],
      craftTags: ['EE'],
    })
    expect(derivePlanningWorkcenterTags({ cat: 'BB', idwkctrtype: 'UT01' })).toEqual({
      shiftTags: ['BB'],
      craftTags: ['UT'],
    })
  })
})

describe('matchesPlanningCategoryFilter', () => {
  it('passes all when nothing selected', () => {
    expect(
      matchesPlanningCategoryFilter({ shiftTags: ['AA'], craftTags: ['EE'] }, new Set()),
    ).toBe(true)
  })

  it('filters EE craft when tagged', () => {
    const selected = new Set(['EE'] as const)
    expect(
      matchesPlanningCategoryFilter({ shiftTags: [], craftTags: ['EE'] }, selected),
    ).toBe(true)
    expect(
      matchesPlanningCategoryFilter({ shiftTags: [], craftTags: ['UT'] }, selected),
    ).toBe(false)
    expect(matchesPlanningCategoryFilter({ shiftTags: [], craftTags: [] }, selected)).toBe(true)
  })
})

describe('woTeamToShiftLabel', () => {
  it('maps DB team A/B to AA/BB', () => {
    expect(woTeamToShiftLabel('A')).toBe('AA')
    expect(woTeamToShiftLabel('B')).toBe('BB')
    expect(woTeamToShiftLabel('EE')).toBeNull()
  })
})
