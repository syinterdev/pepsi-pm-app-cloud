import type { Pool } from 'pg'

export type ResourceRevisionInput = {
  resourceType: 'plan_assign' | 'calendar_event' | 'work_order'
  resourceId: string
  changeKind: 'assign' | 'unassign' | 'reschedule' | 'team_change' | 'move_plan'
  actorId?: string | null
  actorRole?: string | null
  before?: Record<string, unknown> | null
  after?: Record<string, unknown> | null
}

export function isRevisionTableMissing(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  const message = 'message' in err && typeof err.message === 'string' ? err.message : ''
  return message.includes('tbl_resource_revision') && message.includes('does not exist')
}

async function nextRevisionNo(
  pool: Pool,
  resourceType: string,
  resourceId: string,
): Promise<number> {
  const r = await pool.query<{ n: string }>(
    `SELECT COALESCE(MAX(revision_no), 0)::text AS n
     FROM app.tbl_resource_revision
     WHERE resource_type = $1 AND resource_id = $2`,
    [resourceType, resourceId],
  )
  return Number(r.rows[0]?.n ?? 0) + 1
}

/** บันทึก revision — ไม่ throw ถ้าตารางยังไม่ migrate */
export async function recordRevision(pool: Pool, input: ResourceRevisionInput): Promise<void> {
  try {
    const revisionNo = await nextRevisionNo(pool, input.resourceType, input.resourceId)
    await pool.query(
      `INSERT INTO app.tbl_resource_revision (
         resource_type, resource_id, revision_no, actor_id, actor_role,
         change_kind, before_json, after_json
       ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb)`,
      [
        input.resourceType,
        input.resourceId,
        revisionNo,
        input.actorId?.trim() || null,
        input.actorRole?.trim() || null,
        input.changeKind,
        input.before ? JSON.stringify(input.before) : null,
        input.after ? JSON.stringify(input.after) : null,
      ],
    )
  } catch (err) {
    if (isRevisionTableMissing(err)) return
    console.error('[recordRevision]', input.changeKind, err)
  }
}

export type RevisionRow = {
  id: string
  resourceType: string
  resourceId: string
  revisionNo: number
  actorId: string | null
  actorRole: string | null
  changeKind: string
  beforeJson: unknown
  afterJson: unknown
  createdAt: string
  wkorder: string | null
  operationshorttext: string | null
}

export async function listRecentRevisions(
  pool: Pool,
  opts: { from: string; to: string; limit?: number },
): Promise<RevisionRow[]> {
  const limit = Math.max(1, Math.min(opts.limit ?? 30, 100))
  try {
    const r = await pool.query<{
      id: string
      resource_type: string
      resource_id: string
      revision_no: number
      actor_id: string | null
      actor_role: string | null
      change_kind: string
      before_json: unknown
      after_json: unknown
      created_at: Date
      wkorder: string | null
      operationshorttext: string | null
    }>(
      `SELECT
         rev.id::text,
         rev.resource_type,
         rev.resource_id,
         rev.revision_no,
         rev.actor_id,
         rev.actor_role,
         rev.change_kind,
         rev.before_json,
         rev.after_json,
         rev.created_at,
         wo.wkorder,
         wo.operationshorttext
       FROM app.tbl_resource_revision rev
       LEFT JOIN app.tbiw37n wo ON wo.idiw37::text = rev.resource_id
       WHERE rev.created_at >= $1::timestamptz AND rev.created_at <= $2::timestamptz
       ORDER BY rev.created_at DESC
       LIMIT $3`,
      [opts.from, opts.to, limit],
    )
    return r.rows.map((row) => ({
      id: row.id,
      resourceType: row.resource_type,
      resourceId: row.resource_id,
      revisionNo: row.revision_no,
      actorId: row.actor_id?.trim() || null,
      actorRole: row.actor_role?.trim() || null,
      changeKind: row.change_kind,
      beforeJson: row.before_json,
      afterJson: row.after_json,
      createdAt: row.created_at.toISOString(),
      wkorder: row.wkorder?.trim() || null,
      operationshorttext: row.operationshorttext?.trim() || null,
    }))
  } catch (err) {
    if (isRevisionTableMissing(err)) return []
    throw err
  }
}
