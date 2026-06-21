import { describe, expect, it } from 'vitest'
import {
  hasCalendarPlanMove,
  hasCalendarWorkOrderNumber,
  isCalendarDisplayDateOverdue,
  resolveCalendarMoveReasonRequired,
  resolveCalendarTecoBellAlert,
} from './calendar-move-policy.js'

describe('calendar-move-policy', () => {
  it('detects overdue display date', () => {
    const yesterday = Math.floor(
      new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() - 1).getTime() /
        1000,
    )
    expect(isCalendarDisplayDateOverdue(yesterday)).toBe(true)
    const tomorrow = Math.floor(
      new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 1).getTime() /
        1000,
    )
    expect(isCalendarDisplayDateOverdue(tomorrow)).toBe(false)
  })

  it('detects assigned WO number', () => {
    expect(hasCalendarWorkOrderNumber('4001558092')).toBe(true)
    expect(hasCalendarWorkOrderNumber('')).toBe(false)
    expect(hasCalendarWorkOrderNumber('TBD')).toBe(false)
  })

  it('shows TECO bell when not fully closed in app', () => {
    expect(
      resolveCalendarTecoBellAlert({
        syst: 'TECO',
        percentClose: 50,
        hasConfirm: 0,
      }),
    ).toBe(true)
    expect(
      resolveCalendarTecoBellAlert({
        syst: 'TECO',
        percentClose: 100,
        confirmQcStatus: 'approved',
      }),
    ).toBe(false)
    expect(resolveCalendarTecoBellAlert({ syst: 'REL', percentClose: 0 })).toBe(false)
  })

  it('requires move reason for overdue or future WO (customer slide)', () => {
    const today = Math.floor(Date.now() / 1000)
    const past = Math.floor(
      new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() - 3).getTime() /
        1000,
    )
    const future = Math.floor(
      new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 7).getTime() /
        1000,
    )

    expect(
      resolveCalendarMoveReasonRequired({
        syst: 'REL',
        displayUnix: past,
        wkorder: '4001558092',
      }),
    ).toBe(true)

    expect(
      resolveCalendarMoveReasonRequired({
        syst: 'REL',
        displayUnix: future,
        wkorder: '4001558092',
      }),
    ).toBe(true)

    expect(
      resolveCalendarMoveReasonRequired({
        syst: 'REL',
        displayUnix: future,
        wkorder: '',
      }),
    ).toBe(false)

    expect(
      resolveCalendarMoveReasonRequired({
        syst: 'TECO',
        displayUnix: past,
        wkorder: '4001558092',
      }),
    ).toBe(false)
  })

  it('hasCalendarPlanMove still tracks tbmoveplan for /N title', () => {
    expect(
      hasCalendarPlanMove({ syst: 'REL', cday: 100, mpcount: 1 }),
    ).toBe(true)
    expect(hasCalendarPlanMove({ syst: 'TECO', cday: 100, mpcount: 1 })).toBe(false)
  })
})
