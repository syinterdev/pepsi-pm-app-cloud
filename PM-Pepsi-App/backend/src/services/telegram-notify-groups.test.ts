import { describe, expect, it } from 'vitest'
import { groupMatchesLink } from './telegram-notify-groups.js'

describe('groupMatchesLink', () => {
  const ctx = {
    pmTeam: 'EE',
    wkctrGroups: new Set(['GRP01']),
    wkctrs: new Set(['PAC001', 'WC001']),
  }

  it('none matches always', () => {
    expect(groupMatchesLink('none', null, undefined, ctx)).toBe(true)
  })

  it('pm_team matches ref', () => {
    expect(groupMatchesLink('pm_team', 'EE', undefined, ctx)).toBe(true)
    expect(groupMatchesLink('pm_team', 'ME', undefined, ctx)).toBe(false)
  })

  it('wkctrgroup matches ref', () => {
    expect(groupMatchesLink('wkctrgroup', 'GRP01', undefined, ctx)).toBe(true)
    expect(groupMatchesLink('wkctrgroup', 'GRP99', undefined, ctx)).toBe(false)
  })

  it('workcenters matches member list', () => {
    expect(groupMatchesLink('workcenters', null, ['WC001'], ctx)).toBe(true)
    expect(groupMatchesLink('workcenters', null, ['WC999'], ctx)).toBe(false)
  })
})
