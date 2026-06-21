import type { Pool } from 'pg'
import { assertMassConfirmBatchSize } from '../lib/mass-confirm-limit.js'
import { isConfirmQcApproved, parseConfirmQcStatus } from '../lib/confirm-qc-status.js'
import type { ConfirmationExportScope } from '../lib/confirmation-export-scope.js'
import { listConfirmationExportRows, type ConfirmationExportRow } from './confirmation.js'
import { setConfirmQcStatus } from './confirm-qc.js'

export type MassConfirmExportItem = {
  idiw37: number
  wkorder: string
  qcStatus: 'pending' | 'approved' | 'rejected' | null
  hasConfirm: boolean
  exportable: boolean
}

export type MassConfirmExportSummary = {
  total: number
  complete: boolean
  hasConfirm: number
  qcApproved: number
  qcPending: number
  qcRejected: number
  exportable: number
  items: MassConfirmExportItem[]
}

export async function getMassConfirmExportSummary(
  pool: Pool,
  idiw37n: number[],
): Promise<MassConfirmExportSummary> {
  const ids = [...new Set(idiw37n.filter((n) => Number.isFinite(n) && n > 0))]
  assertMassConfirmBatchSize(ids.length)
  if (ids.length === 0) {
    return {
      total: 0,
      complete: true,
      hasConfirm: 0,
      qcApproved: 0,
      qcPending: 0,
      qcRejected: 0,
      exportable: 0,
      items: [],
    }
  }

  const r = await pool.query<{
    idiw37: number
    wkorder: string
    confirm_qc_status: string | null
    has_confirm: boolean
    exportable: boolean
  }>(
    `SELECT i.idiw37,
            i.wkorder,
            i.confirm_qc_status,
            EXISTS (SELECT 1 FROM app.tbcofirm c WHERE c.idiw37 = i.idiw37) AS has_confirm,
            EXISTS (
              SELECT 1
              FROM app.view_exportconfirm e
              WHERE e.idiw37 = i.idiw37
                AND e.syst IN ('CRTD', 'REL')
                AND i.confirm_qc_status = 'approved'
            ) AS exportable
     FROM app.tbiw37n i
     WHERE i.idiw37 = ANY($1::int[])
     ORDER BY i.wkorder ASC`,
    [ids],
  )

  const items: MassConfirmExportItem[] = r.rows.map((row) => ({
    idiw37: row.idiw37,
    wkorder: row.wkorder?.trim() ?? '',
    qcStatus: parseConfirmQcStatus(row.confirm_qc_status),
    hasConfirm: row.has_confirm,
    exportable: row.exportable,
  }))

  let qcApproved = 0
  let qcPending = 0
  let qcRejected = 0
  let hasConfirm = 0
  let exportable = 0
  for (const it of items) {
    if (it.hasConfirm) hasConfirm += 1
    if (it.exportable) exportable += 1
    if (it.qcStatus === 'pending') qcPending += 1
    else if (it.qcStatus === 'rejected') qcRejected += 1
    else if (isConfirmQcApproved(it.qcStatus)) qcApproved += 1
  }

  return {
    total: items.length,
    complete: items.length === ids.length,
    hasConfirm,
    qcApproved,
    qcPending,
    qcRejected,
    exportable,
    items,
  }
}

export async function listConfirmationExportRowsForBatch(
  pool: Pool,
  actorWkctr: string | undefined,
  idiw37n: number[],
  scope: ConfirmationExportScope = 'OWN',
): Promise<ConfirmationExportRow[]> {
  const ids = [...new Set(idiw37n.filter((n) => Number.isFinite(n) && n > 0))]
  if (ids.length === 0) return []
  assertMassConfirmBatchSize(ids.length)
  return listConfirmationExportRows(pool, actorWkctr, ids, scope)
}

export type QcApproveBatchResult = {
  approved: number[]
  skipped: { idiw37: number; wkorder: string; reason: string }[]
}

export async function approveConfirmQcBatch(
  pool: Pool,
  idiw37n: number[],
  reviewedBy: string,
): Promise<QcApproveBatchResult> {
  const ids = [...new Set(idiw37n.filter((n) => Number.isFinite(n) && n > 0))]
  assertMassConfirmBatchSize(ids.length)
  const approved: number[] = []
  const skipped: QcApproveBatchResult['skipped'] = []

  const summary = await getMassConfirmExportSummary(pool, ids)
  for (const item of summary.items) {
    if (!item.hasConfirm) {
      skipped.push({ idiw37: item.idiw37, wkorder: item.wkorder, reason: 'ยังไม่มีข้อมูลปิดงาน' })
      continue
    }
    if (item.qcStatus === 'approved') {
      approved.push(item.idiw37)
      continue
    }
    const out = await setConfirmQcStatus(pool, item.idiw37, 'approved', reviewedBy)
    if (out) approved.push(item.idiw37)
    else skipped.push({ idiw37: item.idiw37, wkorder: item.wkorder, reason: 'อัปเดตไม่สำเร็จ' })
  }

  return { approved, skipped }
}
