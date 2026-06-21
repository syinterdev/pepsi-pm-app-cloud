import { describe, expect, it } from 'vitest'
import { canViewTeamManhours } from '@/lib/manhours-team-view'
import type { AuthUser } from '@/api/schemas'

function user(partial: Partial<AuthUser> & Pick<AuthUser, 'userst'>): AuthUser {
  return {
    accountType: 'workcenter',
    idwkctr: 'WC001',
    username: 'WC001',
    wkctr: 'WC001',
    displayName: 'Test',
    userst: partial.userst,
    permissions: partial.permissions,
    ...partial,
  }
}

describe('manhours-team-view', () => {
  it('allows admin and planner team view', () => {
    expect(canViewTeamManhours(user({ userst: 'A' }))).toBe(true)
    expect(canViewTeamManhours(user({ userst: 'U' }))).toBe(true)
    expect(canViewTeamManhours(user({ userst: 'A', permissions: ['manhours.admin'] }))).toBe(true)
  })

  it('denies technician team view', () => {
    expect(canViewTeamManhours(user({ userst: 'W' }))).toBe(false)
    expect(canViewTeamManhours(user({ userst: 'H' }))).toBe(false)
  })
})
