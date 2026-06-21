import { describe, expect, it } from 'vitest'
import { matchesPlanningCategoryFilter } from './planning-workcenter-tags'

describe('matchesPlanningCategoryFilter (frontend)', () => {
  it('filters EE craft when EE checkbox active', () => {
    const selected = new Set(['EE'] as const)
    expect(matchesPlanningCategoryFilter({ craftTags: ['EE'] }, selected)).toBe(true)
    expect(matchesPlanningCategoryFilter({ craftTags: ['UT'] }, selected)).toBe(false)
  })
})
