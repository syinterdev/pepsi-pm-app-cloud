import { describe, expect, it } from 'vitest'
import { resolvePlanCalendarScope } from './plan-calendar-scope.js'

describe('resolvePlanCalendarScope', () => {
  it('technician sees assignee scope only', () => {
    expect(resolvePlanCalendarScope('W')).toBe('assignee')
  })

  it('planner and admin see factory scope', () => {
    expect(resolvePlanCalendarScope('U')).toBe('planner')
    expect(resolvePlanCalendarScope('A')).toBe('planner')
  })
})
