import { describe, expect, it } from 'vitest'
import {
  isVisibleRoleCode,
  normalizePrimaryRolePair,
  resolvePostLoginPathForUserst,
  userroleToUserst,
} from './primary-roles.js'

describe('primary-roles', () => {
  it('maps userrole to userst', () => {
    expect(userroleToUserst('admin')).toBe('A')
    expect(userroleToUserst('planner')).toBe('U')
    expect(userroleToUserst('technician')).toBe('W')
  })

  it('migrates legacy manager to planner', () => {
    expect(normalizePrimaryRolePair({ userst: 'H', userrole: 'manager' })).toEqual({
      userst: 'U',
      userrole: 'planner',
    })
  })

  it('resolves post-login path by role', () => {
    expect(resolvePostLoginPathForUserst('A')).toBe('/')
    expect(resolvePostLoginPathForUserst('U')).toBe('/planning')
    expect(resolvePostLoginPathForUserst('W')).toBe('/plan-calendar')
  })

  it('hides deprecated H from role admin UI', () => {
    expect(isVisibleRoleCode('H')).toBe(false)
    expect(isVisibleRoleCode('U')).toBe(true)
  })
})
