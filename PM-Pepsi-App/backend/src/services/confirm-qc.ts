import type { Pool, PoolClient } from 'pg'
import {
  type ConfirmQcStatus,
  confirmQcStatusLabel,
  isConfirmQcApproved,
  parseConfirmQcStatus,
} from '../lib/confirm-qc-status.js'

export type ConfirmQcSnapshot = {
  idiw37: number
  wkorder: string
  status: ConfirmQcStatus | null
  statusLabel: string
  reviewedAt: string | null
  reviewedBy: string | null
  note: string | null
  imageCount: number
  imageBefore: number
  imageAfter: number
  closeCount: number
  worktimeCount: number
  readyForReview: boolean
  approved: boolean
}

async function hasTbwrkcloseTable(pool: Pool): Promise<boolean> {
  const r = await pool.query<{ reg: string | null }>(
    `SELECT to_regclass('app.tbwrkclose')::text AS reg`,
  )
  return Boolean(r.rows[0]?.reg)
}

export async function touchConfirmQcPending(pool: Pool | PoolClient, idiw37: number): Promise<void> {
  await pool.query(
    `UPDATE app.tbiw37n
     SET confirm_qc_status = 'pending',
         confirm_qc_at = NULL,
         confirm_qc_by = NULL,
         confirm_qc_note = NULL
     WHERE idiw37 = $1`,
    [idiw37],
  )
}

/** หลัง Admin อนุมัติ — แสดงบน Dashboard ช่างเป็นสถานะ TECO (เขียว) */
export async function applyTecoSystemStatus(pool: Pool, idiw37: number): Promise<void> {
  await pool.query(
    `UPDATE app.tbiw37n i
     SET syst = 'TECO',
         wkstcolor = COALESCE(
           (SELECT w.wkstcolor FROM app.tbwkstatus w WHERE w.syst = 'TECO' LIMIT 1),
           '#7AC943'
         )
     WHERE i.idiw37 = $1`,
    [idiw37],
  )
}

export async function setConfirmQcStatus(
  pool: Pool,
  idiw37: number,
  status: ConfirmQcStatus,
  reviewedBy: string,
  note?: string,
): Promise<ConfirmQcSnapshot | null> {
  const r = await pool.query<{ idiw37: number; confirm_qc_at: Date }>(
    `UPDATE app.tbiw37n
     SET confirm_qc_status = $2,
         confirm_qc_at = NOW(),
         confirm_qc_by = $3,
         confirm_qc_note = NULLIF(TRIM($4::text), '')
     WHERE idiw37 = $1
     RETURNING idiw37, confirm_qc_at`,
    [idiw37, status, reviewedBy, note ?? ''],
  )
  if (!r.rows[0]) return null
  const { upsertPage2SignatureOnConfirmQc } = await import('./wo-pm-page2.js')
  await upsertPage2SignatureOnConfirmQc(pool, {
    idiw37,
    reviewedBy,
    status,
    reviewedAt: r.rows[0].confirm_qc_at,
  })
  if (status === 'approved') {
    try {
      await applyTecoSystemStatus(pool, idiw37)
    } catch (err) {
      console.error('[confirm-qc] applyTecoSystemStatus failed (QC still approved):', err)
    }
  }
  return getConfirmQcSnapshot(pool, idiw37)
}

export async function getConfirmQcSnapshot(
  pool: Pool,
  idiw37: number,
): Promise<ConfirmQcSnapshot | null> {
  const wo = await pool.query<{
    idiw37: number
    wkorder: string
    confirm_qc_status: string | null
    confirm_qc_at: Date | null
    confirm_qc_by: string | null
    confirm_qc_note: string | null
  }>(
    `SELECT idiw37, wkorder, confirm_qc_status, confirm_qc_at, confirm_qc_by, confirm_qc_note
     FROM app.tbiw37n
     WHERE idiw37 = $1
     LIMIT 1`,
    [idiw37],
  )
  const row = wo.rows[0]
  if (!row) return null

  const imgR = await pool.query<{ phase: string | null; n: string }>(
    `SELECT COALESCE(NULLIF(TRIM(img_phase), ''), '') AS phase, COUNT(*)::text AS n
     FROM app.tbconfirmimg
     WHERE idiw37 = $1
     GROUP BY 1`,
    [idiw37],
  )
  let imageBefore = 0
  let imageAfter = 0
  let imageOther = 0
  for (const img of imgR.rows) {
    const n = Number(img.n ?? 0)
    if (img.phase === 'before') imageBefore += n
    else if (img.phase === 'after') imageAfter += n
    else imageOther += n
  }
  const imageCount = imageBefore + imageAfter + imageOther

  const closeR = await pool.query<{ n: string }>(
    `SELECT COUNT(*)::text AS n FROM app.tbcofirm WHERE idiw37 = $1`,
    [idiw37],
  )
  const closeCount = Number(closeR.rows[0]?.n ?? 0)

  let worktimeCount = 0
  if (await hasTbwrkcloseTable(pool)) {
    const wrkR = await pool.query<{ n: string }>(
      `SELECT COUNT(*)::text AS n FROM app.tbwrkclose WHERE idiw37 = $1`,
      [idiw37],
    )
    worktimeCount = Number(wrkR.rows[0]?.n ?? 0)
  }

  const status = parseConfirmQcStatus(row.confirm_qc_status)
  const readyForReview = imageCount > 0 || closeCount > 0 || worktimeCount > 0

  return {
    idiw37: Number(row.idiw37),
    wkorder: row.wkorder?.trim() ?? '',
    status,
    statusLabel: confirmQcStatusLabel(status),
    reviewedAt: row.confirm_qc_at?.toISOString() ?? null,
    reviewedBy: row.confirm_qc_by?.trim() || null,
    note: row.confirm_qc_note?.trim() || null,
    imageCount,
    imageBefore,
    imageAfter,
    closeCount,
    worktimeCount,
    readyForReview,
    approved: isConfirmQcApproved(status),
  }
}

export type ConfirmQcPendingItem = {
  idiw37: number
  wkorder: string
  wkctr: string | null
  syst: string | null
  systemstatus: string | null
  imageCount: number
  closeCount: number
  submittedAt: string | null
}

export async function listConfirmQcPending(
  pool: Pool,
  limit = 50,
): Promise<ConfirmQcPendingItem[]> {
  const cap = Math.max(1, Math.min(limit, 200))
  const r = await pool.query<{
    idiw37: number
    wkorder: string
    wkctr: string | null
    syst: string | null
    systemstatus: string | null
    image_count: string
    close_count: string
    submitted_at: Date | null
  }>(
    `SELECT i.idiw37,
            i.wkorder,
            i.wkctr,
            i.syst,
            i.systemstatus,
            (SELECT COUNT(*)::int FROM app.tbconfirmimg img WHERE img.idiw37 = i.idiw37) AS image_count,
            (SELECT COUNT(*)::int FROM app.tbcofirm c WHERE c.idiw37 = i.idiw37) AS close_count,
            GREATEST(
              (SELECT MAX(img.created_at) FROM app.tbconfirmimg img WHERE img.idiw37 = i.idiw37),
              (SELECT MAX(to_timestamp(c.timeclose)) FROM app.tbcofirm c WHERE c.idiw37 = i.idiw37)
            ) AS submitted_at
     FROM app.tbiw37n i
     WHERE i.confirm_qc_status = 'pending'
       AND i.syst IN ('CRTD', 'REL')
     ORDER BY submitted_at DESC NULLS LAST, i.idiw37 DESC
     LIMIT $1`,
    [cap],
  )
  return r.rows.map((row) => ({
    idiw37: row.idiw37,
    wkorder: row.wkorder?.trim() ?? '',
    wkctr: row.wkctr?.trim() || null,
    syst: row.syst?.trim() || null,
    systemstatus: row.systemstatus?.trim() || null,
    imageCount: Number(row.image_count ?? 0),
    closeCount: Number(row.close_count ?? 0),
    submittedAt: row.submitted_at?.toISOString() ?? null,
  }))
}
