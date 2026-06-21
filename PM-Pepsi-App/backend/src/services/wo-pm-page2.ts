import type { Pool } from 'pg'
import type { ConfirmQcStatus } from '../lib/confirm-qc-status.js'
import {
  displayNameFromWkctrRow,
  formatDdMmYyyyFromEpochSeconds,
  type WkctrNameRow,
} from '../lib/wkctr-display-name.js'

export type WoPmPage2FormPayload = {
  activityReportWkctr: string | null
  completedByName: string | null
  closedDate: string | null
  signatureText: string | null
  signatureAt: string | null
  signatureAction: 'approved' | 'rejected' | null
  equipmentOk: 'Y' | 'N' | null
}

type Page2DbRow = {
  activity_report_wkctr: string | null
  completed_by_name: string | null
  closed_date: Date | null
  equipment_ok: string | null
  signature_planner_name: string | null
  signature_at: Date | null
  signature_action: string | null
}

function isPage2SchemaMissing(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err)
  return msg.includes('tbwo_pm_page2')
}

function mapSignatureText(name: string | null | undefined): string | null {
  const trimmed = name?.trim()
  if (!trimmed) return null
  return `RECEIVED by ${trimmed}`
}

function mapPage2Row(row: Page2DbRow | undefined): WoPmPage2FormPayload {
  if (!row) {
    return {
      activityReportWkctr: null,
      completedByName: null,
      closedDate: null,
      signatureText: null,
      signatureAt: null,
      signatureAction: null,
      equipmentOk: null,
    }
  }
  const action =
    row.signature_action === 'approved' || row.signature_action === 'rejected'
      ? row.signature_action
      : null
  const equipmentOk = row.equipment_ok === 'Y' || row.equipment_ok === 'N' ? row.equipment_ok : null
  return {
    activityReportWkctr: row.activity_report_wkctr?.trim() || null,
    completedByName: row.completed_by_name?.trim() || null,
    closedDate: row.closed_date
      ? formatDdMmYyyyFromEpochSeconds(Math.floor(row.closed_date.getTime() / 1000))
      : null,
    signatureText: mapSignatureText(row.signature_planner_name),
    signatureAt: row.signature_at?.toISOString() ?? null,
    signatureAction: action,
    equipmentOk,
  }
}

async function lookupWkctrDisplayName(pool: Pool, wkctr: string): Promise<string> {
  const code = wkctr.trim()
  if (!code) return ''
  const r = await pool.query<WkctrNameRow>(
    `SELECT titlewkctr, namewkctr, surnamewkctr, titlewkctreng, namewkctreng, surnamewkctreng
     FROM app.tbworkcenter
     WHERE wkctr = $1
     LIMIT 1`,
    [code],
  )
  const row = r.rows[0]
  if (!row) return code
  const name = displayNameFromWkctrRow(row)
  return name || code
}

export async function loadWoPmPage2Form(pool: Pool, idiw37: number): Promise<WoPmPage2FormPayload> {
  try {
    const r = await pool.query<Page2DbRow>(
      `SELECT activity_report_wkctr, completed_by_name, closed_date, equipment_ok,
              signature_planner_name, signature_at, signature_action
       FROM app.tbwo_pm_page2
       WHERE idiw37 = $1
       LIMIT 1`,
      [idiw37],
    )
    return mapPage2Row(r.rows[0])
  } catch (err) {
    if (isPage2SchemaMissing(err)) {
      return mapPage2Row(undefined)
    }
    throw err
  }
}

export async function upsertPage2OnPersonnelClose(
  pool: Pool,
  opts: { idiw37: number; wkctr: string; cendate: number },
): Promise<void> {
  const wkctr = opts.wkctr.trim()
  if (!wkctr) return
  try {
    const displayName = await lookupWkctrDisplayName(pool, wkctr)
    const closedDate = new Date(opts.cendate * 1000)
    await pool.query(
      `INSERT INTO app.tbwo_pm_page2
         (idiw37, activity_report_wkctr, completed_by_name, closed_date, updated_at)
       VALUES ($1, $2, $3, $4::date, now())
       ON CONFLICT (idiw37) DO UPDATE SET
         activity_report_wkctr = EXCLUDED.activity_report_wkctr,
         completed_by_name = EXCLUDED.completed_by_name,
         closed_date = EXCLUDED.closed_date,
         updated_at = now()`,
      [opts.idiw37, wkctr, displayName || wkctr, closedDate],
    )
  } catch (err) {
    if (isPage2SchemaMissing(err)) return
    throw err
  }
}

export async function upsertPage2SignatureOnConfirmQc(
  pool: Pool,
  opts: {
    idiw37: number
    reviewedBy: string
    status: ConfirmQcStatus
    reviewedAt: Date
  },
): Promise<void> {
  if (opts.status !== 'approved' && opts.status !== 'rejected') return
  const plannerName = await lookupWkctrDisplayName(pool, opts.reviewedBy)
  try {
    await pool.query(
      `INSERT INTO app.tbwo_pm_page2 (idiw37, signature_planner_name, signature_at, signature_action, updated_at)
       VALUES ($1, $2, $3, $4, now())
       ON CONFLICT (idiw37) DO UPDATE SET
         signature_planner_name = EXCLUDED.signature_planner_name,
         signature_at = EXCLUDED.signature_at,
         signature_action = EXCLUDED.signature_action,
         updated_at = now()`,
      [opts.idiw37, plannerName || opts.reviewedBy.trim(), opts.reviewedAt, opts.status],
    )
  } catch (err) {
    if (isPage2SchemaMissing(err)) return
    throw err
  }
}

export async function updateWoPmPage2Equipment(
  pool: Pool,
  idiw37: number,
  equipmentOk: 'Y' | 'N',
): Promise<WoPmPage2FormPayload> {
  const r = await pool.query<Page2DbRow>(
    `INSERT INTO app.tbwo_pm_page2 (idiw37, equipment_ok, updated_at)
     VALUES ($1, $2, now())
     ON CONFLICT (idiw37) DO UPDATE SET
       equipment_ok = EXCLUDED.equipment_ok,
       updated_at = now()
     RETURNING activity_report_wkctr, completed_by_name, closed_date, equipment_ok,
               signature_planner_name, signature_at, signature_action`,
    [idiw37, equipmentOk],
  )
  return mapPage2Row(r.rows[0])
}

export { formatDdMmYyyyFromEpochSeconds }
