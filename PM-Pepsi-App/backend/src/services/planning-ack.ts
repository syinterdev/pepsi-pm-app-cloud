import type { Pool } from 'pg'

export type AckChannel = 'telegram' | 'web'

export type PlanningAckRow = {
  idplanw: number
  idiw37: number
  wkctr: string
  ack_status: string
  ack_at: Date | null
  ack_channel: string | null
  wkctrpw: string | null
}

export function isPlanningAckSchemaMissing(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err)
  return message.includes('ack_status') || message.includes('does not exist')
}

export async function getPlanningAssignment(
  pool: Pool,
  idplanw: number,
): Promise<PlanningAckRow | null> {
  const { rows } = await pool.query<PlanningAckRow>(
    `SELECT idplanw, idiw37, wkctr, ack_status, ack_at, ack_channel, wkctrpw
     FROM app.tbplangingwork WHERE idplanw = $1`,
    [idplanw],
  )
  return rows[0] ?? null
}

export async function getPlanningAssignmentByKey(
  pool: Pool,
  idiw37: number,
  wkctr: string,
): Promise<PlanningAckRow | null> {
  const { rows } = await pool.query<PlanningAckRow>(
    `SELECT idplanw, idiw37, wkctr, ack_status, ack_at, ack_channel, wkctrpw
     FROM app.tbplangingwork WHERE idiw37 = $1 AND wkctr = $2`,
    [idiw37, wkctr],
  )
  return rows[0] ?? null
}

export async function listAssignmentsForWo(
  pool: Pool,
  idiw37: number,
): Promise<PlanningAckRow[]> {
  const { rows } = await pool.query<PlanningAckRow>(
    `SELECT idplanw, idiw37, wkctr, ack_status, ack_at, ack_channel, wkctrpw
     FROM app.tbplangingwork WHERE idiw37 = $1 ORDER BY idplanw`,
    [idiw37],
  )
  return rows
}

export type AcknowledgeResult =
  | {
      ok: true
      idplanw: number
      idiw37: number
      wkctr: string
      alreadyAcked: boolean
      ackAt: string
    }
  | { ok: false; reason: 'not_found' | 'chat_mismatch' | 'wkctr_mismatch' }

export async function acknowledgePlanningAssignment(
  pool: Pool,
  idplanw: number,
  channel: AckChannel,
  opts?: { expectedWkctr?: string; expectedChatId?: number | string },
): Promise<AcknowledgeResult> {
  const row = await getPlanningAssignment(pool, idplanw)
  if (!row) return { ok: false, reason: 'not_found' }

  if (opts?.expectedWkctr && row.wkctr !== opts.expectedWkctr) {
    return { ok: false, reason: 'wkctr_mismatch' }
  }

  if (opts?.expectedChatId != null) {
    const chatR = await pool.query<{ telegram_chat_id: string | null }>(
      `SELECT telegram_chat_id::text FROM app.tbworkcenter WHERE wkctr = $1`,
      [row.wkctr],
    )
    const linked = chatR.rows[0]?.telegram_chat_id
    if (!linked || String(linked) !== String(opts.expectedChatId)) {
      return { ok: false, reason: 'chat_mismatch' }
    }
  }

  if (row.ack_status === 'acknowledged' && row.ack_at) {
    return {
      ok: true,
      idplanw: row.idplanw,
      idiw37: row.idiw37,
      wkctr: row.wkctr,
      alreadyAcked: true,
      ackAt: row.ack_at.toISOString(),
    }
  }

  const upd = await pool.query<{ ack_at: Date }>(
    `UPDATE app.tbplangingwork
     SET ack_status = 'acknowledged',
         ack_at = now(),
         ack_channel = $2
     WHERE idplanw = $1
     RETURNING ack_at`,
    [idplanw, channel],
  )
  const ackAt = upd.rows[0]?.ack_at ?? new Date()

  return {
    ok: true,
    idplanw: row.idplanw,
    idiw37: row.idiw37,
    wkctr: row.wkctr,
    alreadyAcked: false,
    ackAt: ackAt.toISOString(),
  }
}

export async function getAssignmentIdplanw(
  pool: Pool,
  idiw37: number,
  wkctr: string,
): Promise<number | null> {
  const row = await getPlanningAssignmentByKey(pool, idiw37, wkctr)
  return row?.idplanw ?? null
}

export async function getPlanningAckSummary(pool: Pool, idiw37: number) {
  const woR = await pool.query<{ wkorder: string }>(
    `SELECT wkorder FROM app.tbiw37n WHERE idiw37 = $1`,
    [idiw37],
  )
  const wkorder = woR.rows[0]?.wkorder ?? String(idiw37)
  const rows = await listAssignmentsForWo(pool, idiw37)
  const items = rows.map((r) => ({
    wkctr: r.wkctr,
    ackStatus: r.ack_status,
    ackAt: r.ack_at?.toISOString() ?? null,
    ackChannel: r.ack_channel,
  }))
  const acknowledged = items.filter((i) => i.ackStatus === 'acknowledged').length
  return {
    idiw37,
    wkorder,
    total: items.length,
    acknowledged,
    pending: items.length - acknowledged,
    items,
  }
}
