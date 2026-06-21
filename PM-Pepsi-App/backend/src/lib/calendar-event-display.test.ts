import { describe, expect, it } from 'vitest'
import {
  buildCalendarDayHourTotals,
  buildCalendarEventDescription,
  buildCalendarEventHoverDetail,
  buildCalendarEventTitle,
  mapCalendarOrderRowToEvent,
  resolveCalendarEventColor,
  resolveCalendarWorkHours,
} from './calendar-event-display.js'

const baseRow = {
  idiw37: 1,
  wkorder: '4001558092',
  wktype: 'ZB02',
  mat: '2',
  bscstart: Math.floor(new Date('2026-05-28').getTime() / 1000),
  actfinish: Math.floor(new Date('2026-05-15').getTime() / 1000),
  cday: null,
  syst: 'REL',
  operationshorttext: '2W - ME Liquid Preparation Zone',
  ostdescription: 'Water Dosing Pump-ตรวจเช็คการรั่ว',
  wkctr: 'PRO001',
  opac: '0010',
  equipment: '10051604',
  equdescrip: 'Liquid Preparation',
  functionalloc: 'PI-TH-7151-FA-F2-SC',
  funcdescrip: 'FACTORY 1 SCHAAF 1',
  wkstcolor: '#22c55e',
  mpcount: null,
  percent_close: 0,
  has_confirm: 0,
  confirm_qc_status: null,
}

describe('calendar-event-display', () => {
  it('builds full WO title with wktype and maint code prefix', () => {
    expect(buildCalendarEventTitle(baseRow)).toBe('4001558092 / 002 · ZB02 · ZD02')
  })

  it('appends move count /N to title', () => {
    const moved = {
      ...baseRow,
      cday: Math.floor(new Date('2026-05-26').getTime() / 1000),
      mpcount: 2,
    }
    expect(buildCalendarEventTitle(moved)).toBe('4001558092 / 002 · ZB02 · ZD02/2')
  })

  it('uses blue for estimate (no WO), orange for upcoming WO, green for completed', () => {
    const display = Math.floor(
      new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 7).getTime() /
        1000,
    )
    expect(resolveCalendarEventColor(baseRow, '#F7941D', display).color).toBe('#F7941D')

    const estimate = { ...baseRow, wkorder: '' }
    expect(resolveCalendarEventColor(estimate, '#F7941D', display).color).toBe('#4DA6FF')
    expect(resolveCalendarEventColor(estimate, '#F7941D', display).displayStatus).toBe('in_progress')

    const done = { ...baseRow, confirm_qc_status: 'approved', percent_close: 100 }
    expect(resolveCalendarEventColor(done, '#F7941D', display).color).toBe('#7AC943')
  })

  it('keeps orange for moved WO that still has order number', () => {
    const display = Math.floor(
      new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 7).getTime() /
        1000,
    )
    const moved = {
      ...baseRow,
      cday: Math.floor(new Date('2026-05-26').getTime() / 1000),
      mpcount: 2,
    }
    expect(resolveCalendarEventColor(moved, '#F7941D', display).color).toBe('#F7941D')
    expect(resolveCalendarEventColor(moved, '#F7941D', display).displayStatus).toBe('moved')
  })

  it('uses red for overdue movable work', () => {
    const past = Math.floor(
      new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() - 5).getTime() /
        1000,
    )
    expect(resolveCalendarEventColor(baseRow, '#F7941D', past).color).toBe('#FF3B30')
  })

  it('builds rich description for tooltip', () => {
    const desc = buildCalendarEventDescription(baseRow)
    expect(desc).toContain('Work Order: 4001558092')
    expect(desc).toContain('Functional Location: PI-TH-7151-FA-F2-SC')
    expect(desc).toContain('Equipment: 10051604')
    expect(desc).toContain('Z2 = Preventive Maintenance')
    expect(desc).toContain('Water Dosing Pump')
  })

  it('builds hover detail for customer popup', () => {
    const hover = buildCalendarEventHoverDetail({
      ...baseRow,
      namewkctr: 'Yuttakan',
      surnamewkctr: 'K.',
      mday: Math.floor(new Date('2026-04-12').getTime() / 1000),
      resoncom: 'เครื่องหยุด',
      mpcount: 1,
      cday: Math.floor(new Date('2026-05-26').getTime() / 1000),
    })
    expect(hover.workOrder).toBe('4001558092')
    expect(hover.wktype).toBe('ZB02')
    expect(hover.syst).toBe('REL')
    expect(hover.resourceName).toContain('Yuttakan')
    expect(hover.functionalDesc).toBe('FACTORY 1 SCHAAF 1')
    expect(hover.planDate).toBe('28.05.2026')
    expect(hover.movedToDate).toBeTruthy()
    expect(hover.moveReason).toBe('เครื่องหยุด')
  })

  it('maps row to calendar event — unassigned uses pipeline red', () => {
    const futureStart = Math.floor(
      new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 14).getTime() /
        1000,
    )
    const ev = mapCalendarOrderRowToEvent(
      { ...baseRow, bscstart: futureStart, actfinish: null, cday: null, assign_count: 0 },
      '#F7941D',
    )
    expect(ev?.title).toBe('4001558092 / 002 · ZB02 · ZD02')
    expect(ev?.activityCode).toBe('Z2')
    expect(ev?.color).toBe('#FF3B30')
    expect(ev?.pipelineStatus).toBe('unassigned')
    expect(ev?.moveReasonRequired).toBe(true)
    expect(ev?.hoverDetail?.workOrder).toBe('4001558092')
    expect(ev?.planStartIso).toBeTruthy()
    expect(ev?.planEndIso).toBeTruthy()
    expect(ev?.hoverDetail?.orderFrameStart).toMatch(/^\d{2}:\d{2}$/)
    expect(ev?.hoverDetail?.orderFrameEnd).toMatch(/^\d{2}:\d{2}$/)
  })

  it('maps assigned row to pipeline purple', () => {
    const futureStart = Math.floor(
      new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 14).getTime() /
        1000,
    )
    const ev = mapCalendarOrderRowToEvent(
      {
        ...baseRow,
        bscstart: futureStart,
        actfinish: null,
        cday: null,
        assign_count: 2,
        ack_pending: 1,
        ack_acknowledged: 1,
      },
      '#F7941D',
    )
    expect(ev?.color).toBe('#7B61FF')
    expect(ev?.pipelineStatus).toBe('assigned')
    expect(ev?.pipelineBadges).toContain('ack_pending')
  })

  it('resolves work hours from H and MIN', () => {
    expect(resolveCalendarWorkHours(0.5, 'H')).toBe(0.5)
    expect(resolveCalendarWorkHours(30, 'MIN')).toBe(0.5)
    expect(resolveCalendarWorkHours(0, 'H')).toBe(0)
  })

  it('maps unassigned row without WO to pipeline red', () => {
    const futureStart = Math.floor(
      new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 14).getTime() /
        1000,
    )
    const ev = mapCalendarOrderRowToEvent(
      { ...baseRow, wkorder: '', bscstart: futureStart, actfinish: null, cday: null, assign_count: 0 },
      '#F7941D',
    )
    expect(ev?.color).toBe('#FF3B30')
    expect(ev?.pipelineStatus).toBe('unassigned')
    expect(ev?.moveReasonRequired).toBe(false)
    expect(ev?.displayStatus).toBe('in_progress')
  })

  it('sums day hour totals by display date', () => {
    const totals = buildCalendarDayHourTotals([
      { date: '2026-05-28', workHours: 0.5 },
      { date: '2026-05-28', workHours: 1 },
      { date: '2026-05-29', workHours: 2 },
    ])
    expect(totals['2026-05-28']).toBe(1.5)
    expect(totals['2026-05-29']).toBe(2)
  })
})
