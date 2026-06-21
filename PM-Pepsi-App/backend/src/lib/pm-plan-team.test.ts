import { describe, expect, it } from 'vitest'
import { pmPlanTeamFieldSchema } from './pm-plan-team.js'

describe('pmPlanTeamFieldSchema', () => {
  it('accepts A B EE UT and empty', () => {
    for (const team of ['', 'A', 'B', 'EE', 'UT'] as const) {
      expect(pmPlanTeamFieldSchema.safeParse(team).success).toBe(true)
    }
  })

  it('rejects legacy P', () => {
    expect(pmPlanTeamFieldSchema.safeParse('P').success).toBe(false)
  })
})
