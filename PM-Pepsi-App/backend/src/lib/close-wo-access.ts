import type { Pool, PoolClient } from 'pg'
import { userstToUserrole } from './primary-roles.js'

export type CloseWoAccessReason = 'not_technician' | 'not_assigned' | 'pending_ack'

export type PlanningAssigneeForCloseWo = {
  kind: 'person' | 'group'
  code: string
  pwteam: string
  ackStatus?: 'pending' | 'acknowledged' | 'declined'
  ackAt?: string | null
  ackChannel?: 'telegram' | 'web' | null
}

export type CloseWoAccess = {
  canView: boolean
  canWrite: boolean
  reason?: CloseWoAccessReason
  myAssignment?: {
    ackStatus?: 'pending' | 'acknowledged' | 'declined'
    ackChannel?: 'telegram' | 'web' | null
    ackAt?: string | null
  }
}

export class CloseWoAccessDeniedError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CloseWoAccessDeniedError'
  }
}

function normalizeWkctr(value: string | null | undefined): string {
  return (value ?? '').trim()
}

function findMyPersonAssignment(
  assignees: PlanningAssigneeForCloseWo[],
  wkctr: string,
): PlanningAssigneeForCloseWo | undefined {
  const code = normalizeWkctr(wkctr)
  if (!code) return undefined
  return assignees.find(
    (a) => a.kind === 'person' && a.code === code && (a.pwteam?.trim() ?? '') !== 'G',
  )
}

export function resolveCloseWoAccess(input: {
  assignees: PlanningAssigneeForCloseWo[]
  wkctr: string | null | undefined
  userst: string | null | undefined
  hasConfirmWrite: boolean
}): CloseWoAccess {
  const role = userstToUserrole(input.userst)
  const wkctr = normalizeWkctr(input.wkctr)

  if (role !== 'technician') {
    return { canView: false, canWrite: false, reason: 'not_technician' }
  }

  const myAssignment = findMyPersonAssignment(input.assignees, wkctr)
  if (!myAssignment) {
    return { canView: false, canWrite: false, reason: 'not_assigned' }
  }

  const assignmentMeta = {
    ackStatus: myAssignment.ackStatus,
    ackChannel: myAssignment.ackChannel ?? null,
    ackAt: myAssignment.ackAt ?? null,
  }

  if (myAssignment.ackStatus !== 'acknowledged') {
    return {
      canView: false,
      canWrite: false,
      reason: 'pending_ack',
      myAssignment: assignmentMeta,
    }
  }

  const canView = true
  return {
    canView,
    canWrite: canView && input.hasConfirmWrite,
    myAssignment: assignmentMeta,
  }
}

export function closeWoAccessDeniedMessage(reason: CloseWoAccessReason): string {
  if (reason === 'not_assigned') {
    return 'คุณไม่ได้รับมอบหมายงานนี้ — ไม่มีสิทธิ์ปิดงาน'
  }
  if (reason === 'pending_ack') {
    return 'กรุณากดรับงานก่อน (Telegram หรือหน้า Planning)'
  }
  return 'เฉพาะช่างที่ได้รับมอบหมายและรับงานแล้วเท่านั้นที่ปิดงานได้'
}

export async function assertTechnicianCloseWoAccess(
  pool: Pool | PoolClient,
  opts: {
    idiw37: number
    wkctr: string
    userst: string | null | undefined
    loginWkctr: string | null | undefined
  },
): Promise<void> {
  const role = userstToUserrole(opts.userst)
  if (role !== 'technician') return

  const loginWkctr = normalizeWkctr(opts.loginWkctr || opts.wkctr)
  const bodyWkctr = normalizeWkctr(opts.wkctr)
  if (!loginWkctr || bodyWkctr !== loginWkctr) {
    throw new CloseWoAccessDeniedError('รหัสช่างไม่ตรงกับบัญชีของคุณ')
  }

  const r = await pool.query<{
    ack_status: string | null
    pwteam: string | null
  }>(
    `SELECT ack_status, pwteam
     FROM app.tbplangingwork
     WHERE idiw37 = $1 AND wkctr = $2
     LIMIT 1`,
    [opts.idiw37, bodyWkctr],
  )
  const row = r.rows[0]
  if (!row || (row.pwteam?.trim() ?? '') === 'G') {
    throw new CloseWoAccessDeniedError(closeWoAccessDeniedMessage('not_assigned'))
  }
  if (row.ack_status !== 'acknowledged') {
    throw new CloseWoAccessDeniedError(closeWoAccessDeniedMessage('pending_ack'))
  }
}
