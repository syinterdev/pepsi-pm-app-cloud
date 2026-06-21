import type { Pool } from 'pg'
import {
  resolveCalendarMoveReasonRequired,
} from '../lib/calendar-move-policy.js'
import {
  FACTORY_CODE,
  isPlanMovableStatus,
  pickDisplayUnix,
  sqlFactoryScope,
  unixToDateString,
} from './scheduling-shared.js'

function isoToUnixStart(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number)
  return Math.floor(new Date(y, m - 1, d).getTime() / 1000)
}

export type MovePlanReason = { code: string; name: string }

export async function listMovePlanReasons(pool: Pool): Promise<MovePlanReason[]> {
  const r = await pool.query<{ reasoncode: string; reasonname: string }>(
    `SELECT reasoncode, reasonname FROM app.tbreason ORDER BY reasoncode`,
  )
  return r.rows.map((row) => ({
    code: row.reasoncode.trim(),
    name: row.reasonname.trim(),
  }))
}

export class MovePlanError extends Error {
  constructor(
    message: string,
    readonly code: 'NOT_FOUND' | 'STATUS_NOT_MOVABLE' | 'INVALID_REASON',
  ) {
    super(message)
    this.name = 'MovePlanError'
  }
}

export async function moveWorkOrderPlan(
  pool: Pool,
  input: {
    idiw37: string
    targetDate: string
    reasonCode: string
    comment?: string
    mwkctr: string
  },
): Promise<{
  mpcount: number
  before: { displayDate: string; mpcount: number | null }
  after: { targetDate: string; reasonCode: string; comment: string; mpcount: number }
}> {
  const idNum = Number(input.idiw37)
  if (!Number.isFinite(idNum)) {
    throw new MovePlanError('Work order not found', 'NOT_FOUND')
  }

  const wo = await pool.query<{
    syst: string | null
    wkorder: string | null
    bscstart: string | number | null
    actfinish: string | number | null
    cday: string | number | null
    mpcount: number | null
  }>(
    `SELECT o.syst, o.wkorder, o.bscstart, o.actfinish, mp.cday, mp.mpcount
     FROM app.tbiw37n o
     LEFT JOIN app.tbmoveplan mp ON mp.idiw37 = o.idiw37
     WHERE o.idiw37 = $1 AND ${sqlFactoryScope('o', '$2')}`,
    [idNum, `%${FACTORY_CODE}%`],
  )
  const row = wo.rows[0]
  if (!row) throw new MovePlanError('Work order not found', 'NOT_FOUND')

  if (!isPlanMovableStatus(row.syst)) {
    throw new MovePlanError(
      'แผนสีเขียว (TECO/ปิดแล้ว) ย้ายแผนไม่ได้ — เฉพาะสถานะ CRTD/REL',
      'STATUS_NOT_MOVABLE',
    )
  }

  const displayUnix = pickDisplayUnix({
    idiw37: idNum,
    wkorder: '',
    wktype: null,
    wkctr: null,
    syst: row.syst,
    bscstart: row.bscstart,
    actfinish: row.actfinish,
    cday: row.cday,
    operationshorttext: null,
    wkstcolor: null,
  })
  if (displayUnix == null) {
    throw new MovePlanError('Work order not found', 'NOT_FOUND')
  }

  const reasonRequired = resolveCalendarMoveReasonRequired({
    syst: row.syst,
    displayUnix,
    wkorder: row.wkorder,
    cday: row.cday,
    mpcount: row.mpcount,
  })
  const reasonCode = input.reasonCode?.trim() ?? ''
  if (reasonRequired && !reasonCode) {
    throw new MovePlanError('กรุณาเลือก Reason Code', 'INVALID_REASON')
  }
  if (reasonCode) {
    const reasonCheck = await pool.query(
      `SELECT 1 FROM app.tbreason WHERE reasoncode = $1`,
      [reasonCode],
    )
    if (reasonCheck.rowCount === 0) {
      throw new MovePlanError('Invalid reason code', 'INVALID_REASON')
    }
  }

  const beforeDisplayDate = unixToDateString(displayUnix)
  const beforeMpcount = row.mpcount != null ? Number(row.mpcount) : null

  const cday = isoToUnixStart(input.targetDate)
  const mday = Math.floor(Date.now() / 1000)
  const comment = input.comment?.trim() ?? ''

  const existing = await pool.query<{ mpcount: number }>(
    `SELECT mpcount FROM app.tbmoveplan WHERE idiw37 = $1`,
    [idNum],
  )

  if (existing.rows[0]) {
    const mpcount = existing.rows[0].mpcount + 1
    await pool.query(
      `UPDATE app.tbmoveplan
       SET cday = $1, mday = $2, mwkctr = $3, reasoncode = $4, resoncom = $5, mpcount = $6
       WHERE idiw37 = $7`,
      [cday, mday, input.mwkctr, reasonCode, comment, mpcount, idNum],
    )
    return {
      mpcount,
      before: { displayDate: beforeDisplayDate, mpcount: beforeMpcount },
      after: {
        targetDate: input.targetDate,
        reasonCode,
        comment,
        mpcount,
      },
    }
  }

  await pool.query(
    `INSERT INTO app.tbmoveplan (cday, idiw37, mday, mwkctr, reasoncode, resoncom, mpcount)
     VALUES ($1, $2, $3, $4, $5, $6, 1)`,
    [cday, idNum, mday, input.mwkctr, reasonCode, comment],
  )
  return {
    mpcount: 1,
    before: { displayDate: beforeDisplayDate, mpcount: beforeMpcount },
    after: {
      targetDate: input.targetDate,
      reasonCode,
      comment,
      mpcount: 1,
    },
  }
}

export async function searchWorkOrderSuggestions(
  pool: Pool,
  q: string,
  limit = 50,
): Promise<{ id: string; wkorder: string; wktype: string; label: string }[]> {
  const term = q.trim()
  if (!term) return []

  const r = await pool.query<{
    idiw37: number
    wkorder: string
    wktype: string | null
    operationshorttext: string | null
  }>(
    `SELECT idiw37, wkorder, wktype, operationshorttext
     FROM app.view_order
     WHERE ${sqlFactoryScope('', '$1')}
       AND wkorder ILIKE $2
     ORDER BY wkorder
     LIMIT $3`,
    [`%${FACTORY_CODE}%`, `%${term}%`, limit],
  )

  return r.rows.map((row) => {
    const wktype = row.wktype?.trim() ?? ''
    const op = row.operationshorttext?.trim() ?? ''
    const label = [row.wkorder, wktype, op].filter(Boolean).join(' / ')
    return {
      id: String(row.idiw37),
      wkorder: row.wkorder,
      wktype,
      label,
    }
  })
}

export function formatUnixDate(sec: string | number | null | undefined): string {
  if (sec == null || sec === '') return ''
  const n = Number(sec)
  if (!Number.isFinite(n) || n <= 0) return ''
  return unixToDateString(n)
}
