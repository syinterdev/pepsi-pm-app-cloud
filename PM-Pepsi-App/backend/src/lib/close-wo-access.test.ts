import { describe, expect, it } from 'vitest'
import { closeWoAccessDeniedMessage, resolveCloseWoAccess } from './close-wo-access.js'

const assignees = [
  {
    kind: 'person' as const,
    code: 'PAC001',
    pwteam: 'A',
    ackStatus: 'pending' as const,
    ackAt: null,
    ackChannel: null,
  },
  {
    kind: 'person' as const,
    code: 'PAC002',
    pwteam: 'B',
    ackStatus: 'acknowledged' as const,
    ackAt: '2026-06-09T10:00:00.000Z',
    ackChannel: 'web' as const,
  },
]

describe('resolveCloseWoAccess', () => {
  it('hides tab for planner/admin', () => {
    expect(
      resolveCloseWoAccess({
        assignees,
        wkctr: 'PAC002',
        userst: 'U',
        hasConfirmWrite: true,
      }),
    ).toEqual({ canView: false, canWrite: false, reason: 'not_technician' })
  })

  it('hides tab when technician is not assigned', () => {
    expect(
      resolveCloseWoAccess({
        assignees,
        wkctr: 'PAC999',
        userst: 'W',
        hasConfirmWrite: true,
      }),
    ).toEqual({ canView: false, canWrite: false, reason: 'not_assigned' })
  })

  it('hides tab when assigned but not acknowledged', () => {
    const access = resolveCloseWoAccess({
      assignees,
      wkctr: 'PAC001',
      userst: 'W',
      hasConfirmWrite: true,
    })
    expect(access.canView).toBe(false)
    expect(access.reason).toBe('pending_ack')
    expect(access.myAssignment?.ackStatus).toBe('pending')
  })

  it('shows tab when assigned and acknowledged (web or telegram)', () => {
    const access = resolveCloseWoAccess({
      assignees,
      wkctr: 'PAC002',
      userst: 'W',
      hasConfirmWrite: true,
    })
    expect(access).toEqual({
      canView: true,
      canWrite: true,
      myAssignment: {
        ackStatus: 'acknowledged',
        ackChannel: 'web',
        ackAt: '2026-06-09T10:00:00.000Z',
      },
    })
  })

  it('shows read-only tab when acknowledged but no confirmation.write', () => {
    const access = resolveCloseWoAccess({
      assignees,
      wkctr: 'PAC002',
      userst: 'W',
      hasConfirmWrite: false,
    })
    expect(access.canView).toBe(true)
    expect(access.canWrite).toBe(false)
  })
})

describe('closeWoAccessDeniedMessage', () => {
  it('returns Thai messages', () => {
    expect(closeWoAccessDeniedMessage('pending_ack')).toMatch(/รับงาน/)
    expect(closeWoAccessDeniedMessage('not_assigned')).toMatch(/มอบหมาย/)
  })
})
