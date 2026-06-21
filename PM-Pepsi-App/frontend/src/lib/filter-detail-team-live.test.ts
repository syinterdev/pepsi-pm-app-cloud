import { describe, expect, it } from 'vitest'
import { applyPendingTeamToFilterDetail, patchRowsTeam } from './filter-detail-team-live'

const base = {
  totalOrders: 10,
  completionCount: 3,
  completionPercent: 30,
  byWkzb: [],
  teamA: { count: 2, workSumMinutes: 100 },
  teamB: { count: 1, workSumMinutes: 50 },
  teamEE: { count: 0, workSumMinutes: 0 },
  teamUT: { count: 0, workSumMinutes: 0 },
}

describe('applyPendingTeamToFilterDetail', () => {
  it('moves one WO from A to B in summary', () => {
    const { data, hasPendingChanges } = applyPendingTeamToFilterDetail(
      base,
      [{ id: '1', team: 'A', work: 40 }],
      { '1': 'B' },
    )
    expect(hasPendingChanges).toBe(true)
    expect(data.teamA).toEqual({ count: 1, workSumMinutes: 60 })
    expect(data.teamB).toEqual({ count: 2, workSumMinutes: 90 })
  })

  it('returns unchanged when no pending diffs', () => {
    const { data, hasPendingChanges } = applyPendingTeamToFilterDetail(
      base,
      [{ id: '1', team: 'A', work: 40 }],
      { '1': 'A' },
    )
    expect(hasPendingChanges).toBe(false)
    expect(data.teamA).toEqual(base.teamA)
  })

  it('assigns unassigned row to team EE', () => {
    const { data } = applyPendingTeamToFilterDetail(
      base,
      [{ id: '9', team: '', work: 25 }],
      { '9': 'EE' },
    )
    expect(data.teamEE).toEqual({ count: 1, workSumMinutes: 25 })
  })

  it('patchRowsTeam updates team on matching ids only', () => {
    const rows = [
      { id: '1', team: 'A', work: 10 },
      { id: '2', team: 'B', work: 20 },
    ]
    const next = patchRowsTeam(rows, new Map([['1', 'UT']]))
    expect(next[0].team).toBe('UT')
    expect(next[1].team).toBe('B')
  })
})
