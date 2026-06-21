import { describe, expect, it } from 'vitest'
import { resolvePlannerPipeline } from './planner-pipeline.js'

describe('resolvePlannerPipeline', () => {
  it('returns unassigned when no assign rows', () => {
    const r = resolvePlannerPipeline({
      syst: 'REL',
      assignCount: 0,
      worktimeCount: 0,
    })
    expect(r.status).toBe('unassigned')
    expect(r.color).toBe('#FF3B30')
    expect(r.badges).toEqual([])
  })

  it('returns assigned purple when assigned but no worktime', () => {
    const r = resolvePlannerPipeline({
      syst: 'REL',
      assignCount: 2,
      worktimeCount: 0,
      ackPending: 1,
      ackAcknowledged: 1,
    })
    expect(r.status).toBe('assigned')
    expect(r.badges).toContain('ack_pending')
  })

  it('returns in_progress blue when worktime recorded', () => {
    const r = resolvePlannerPipeline({
      syst: 'REL',
      assignCount: 1,
      worktimeCount: 2,
      ackAcknowledged: 1,
    })
    expect(r.status).toBe('in_progress')
    expect(r.badges).toContain('ack_done')
  })

  it('returns closed green with qc_pending after supervisor close', () => {
    const r = resolvePlannerPipeline({
      syst: 'REL',
      assignCount: 1,
      worktimeCount: 1,
      hasSupervisorClose: true,
      confirmQcStatus: 'pending',
    })
    expect(r.status).toBe('closed')
    expect(r.badges).toEqual(['qc_pending'])
  })

  it('returns closed with qc_approved', () => {
    const r = resolvePlannerPipeline({
      syst: 'TECO',
      assignCount: 1,
      worktimeCount: 1,
      confirmQcStatus: 'approved',
    })
    expect(r.status).toBe('closed')
    expect(r.badges).toEqual(['qc_approved'])
  })
})
