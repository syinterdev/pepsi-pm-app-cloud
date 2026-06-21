import { describe, expect, it } from 'vitest'
import { canViewTeamManhours } from './manhours-team-access.js'

describe('manhours-team-access', () => {
  it('allows admin and planner', () => {
    expect(
      canViewTeamManhours(
        { accountType: 'workcenter', idwkctr: 'A1', userst: 'A', wkctr: 'A1' } as any,
        false,
      ),
    ).toBe(true)
    expect(
      canViewTeamManhours(
        { accountType: 'workcenter', idwkctr: 'U1', userst: 'U', wkctr: 'U1' } as any,
        false,
      ),
    ).toBe(true)
    expect(
      canViewTeamManhours(
        { accountType: 'workcenter', idwkctr: 'W1', userst: 'W', wkctr: 'W1' } as any,
        true,
      ),
    ).toBe(true)
  })

  it('denies technician without admin', () => {
    expect(
      canViewTeamManhours(
        { accountType: 'workcenter', idwkctr: 'W1', userst: 'W', wkctr: 'W1' } as any,
        false,
      ),
    ).toBe(false)
  })
})
