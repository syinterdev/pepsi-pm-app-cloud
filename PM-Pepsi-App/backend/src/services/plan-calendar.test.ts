import { describe, expect, it } from 'vitest'
import { mapPlanWorkRowToEvent } from './plan-calendar.js'

describe('mapPlanWorkRowToEvent', () => {
  const baseRow = {
    assign_count: 0,
    worktime_count: 0,
    ack_pending: 0,
    ack_acknowledged: 0,
    percent_close: 0,
    has_confirm: 0,
    confirm_qc_status: null as string | null,
  }

  it('uses pipeline red when unassigned', () => {
    const sec = Math.floor(new Date('2026-03-05').getTime() / 1000)
    const ev = mapPlanWorkRowToEvent({
      ...baseRow,
      idiw37: 1,
      wkorder: 'WO1',
      wktype: 'PM01',
      bscstart: sec,
      cday: null,
      syst: 'REL',
      operationshorttext: 'Test op',
    })
    expect(ev?.pipelineStatus).toBe('unassigned')
    expect(ev?.color).toBe('#FF3B30')
    expect(ev?.title).toBe('WO1 / PM01')
  })

  it('uses pipeline purple when assigned', () => {
    const sec = Math.floor(new Date('2026-03-05').getTime() / 1000)
    const ev = mapPlanWorkRowToEvent({
      ...baseRow,
      idiw37: 2,
      wkorder: 'WO2',
      wktype: null,
      bscstart: sec,
      cday: null,
      syst: 'CRTD',
      operationshorttext: null,
      assign_count: 1,
      ack_pending: 1,
    })
    expect(ev?.pipelineStatus).toBe('assigned')
    expect(ev?.color).toBe('#7B61FF')
    expect(ev?.pipelineBadges).toContain('ack_pending')
  })

  it('uses pipeline blue when worktime exists', () => {
    const sec = Math.floor(new Date('2026-03-05').getTime() / 1000)
    const ev = mapPlanWorkRowToEvent({
      ...baseRow,
      idiw37: 3,
      wkorder: 'WO3',
      wktype: 'PM01',
      bscstart: sec,
      cday: null,
      syst: 'REL',
      operationshorttext: null,
      assign_count: 1,
      worktime_count: 2,
      ack_acknowledged: 1,
    })
    expect(ev?.pipelineStatus).toBe('in_progress')
    expect(ev?.color).toBe('#4DA6FF')
  })

  it('uses pipeline green when closed with qc pending', () => {
    const sec = Math.floor(new Date('2026-03-05').getTime() / 1000)
    const ev = mapPlanWorkRowToEvent({
      ...baseRow,
      idiw37: 8,
      wkorder: 'WO8',
      wktype: 'PM01',
      bscstart: sec,
      cday: null,
      syst: 'REL',
      operationshorttext: null,
      assign_count: 1,
      worktime_count: 1,
      has_confirm: 1,
      confirm_qc_status: 'pending',
    })
    expect(ev?.pipelineStatus).toBe('closed')
    expect(ev?.color).toBe('#7AC943')
    expect(ev?.pipelineBadges).toEqual(['qc_pending'])
  })

  it('marks TECO as closed pipeline and not movable', () => {
    const sec = Math.floor(new Date('2026-03-05').getTime() / 1000)
    const ev = mapPlanWorkRowToEvent({
      ...baseRow,
      idiw37: 9,
      wkorder: 'WO9',
      wktype: 'PM01',
      bscstart: sec,
      cday: null,
      syst: 'TECO',
      operationshorttext: null,
      assign_count: 1,
      confirm_qc_status: 'approved',
    })
    expect(ev?.canMovePlan).toBe(false)
    expect(ev?.pipelineStatus).toBe('closed')
    expect(ev?.pipelineBadges).toEqual(['qc_approved'])
  })

  it('returns null without plan date', () => {
    expect(
      mapPlanWorkRowToEvent({
        ...baseRow,
        idiw37: 3,
        wkorder: 'WO3',
        wktype: null,
        bscstart: null,
        cday: null,
        syst: 'REL',
        operationshorttext: null,
      }),
    ).toBeNull()
  })
})
