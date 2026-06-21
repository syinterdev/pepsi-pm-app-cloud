import fs from 'node:fs/promises'
import path from 'node:path'
import type { Pool, PoolClient } from 'pg'
import type { ConfirmImagePhase } from '../lib/confirm-image-phase.js'
import { touchConfirmQcPending } from './confirm-qc.js'
import { notifyPlannerWorkClosed } from './planner-close-notify.js'
import { SAP_MASS_CONFIRM_MAX, assertMassConfirmBatchSize } from '../lib/mass-confirm-limit.js'
import type { ConfirmationExportScope } from '../lib/confirmation-export-scope.js'
import { FACTORY_CODE } from './scheduling-shared.js'
import { parseConfirmFileWithMeta, type ConfirmImportRow, type ConfirmLayout } from './confirmation-import.js'
import {
  ENG_TECHNICIAN_CODES,
  engTechnicianDisplayName,
} from '../data/eng-technician-codes.js'
import { personnelIsActiveSql } from '../lib/personnel-active-sql.js'
import {
  buildConfirmationExportRow,
  formatDdMmYyyyCompact,
  formatHhMm,
} from '../lib/confirmation-export-format.js'

export { SAP_MASS_CONFIRM_MAX as MASS_CONFIRM_MAX_ITEMS }

type WorkcenterRow = {
  wkctr: string
  titlewkctr: string | null
  namewkctr: string | null
  surnamewkctr: string | null
}

export type WorkcenterItem = { wkctr: string; displayName: string }

export async function listWorkcenters(pool: Pool): Promise<WorkcenterItem[]> {
  const r = await pool.query<WorkcenterRow>(
    `SELECT wc.wkctr, wc.titlewkctr, wc.namewkctr, wc.surnamewkctr
     FROM app.tbworkcenter wc
     WHERE trim(wc.wkctr) <> ''
       AND ${personnelIsActiveSql('wc')}
       AND (
         wc.userrole = 'technician'
         OR wc.userst = 'W'
         OR wc.wkctr ~ '^(PAC|PRO|UTI)[0-9]{3}$'
       )`,
  )
  const order = new Map(ENG_TECHNICIAN_CODES.map((t, i) => [t.wkctr, i]))
  const rows = [...r.rows].sort((a, b) => {
    const oa = order.get(a.wkctr) ?? 9999
    const ob = order.get(b.wkctr) ?? 9999
    if (oa !== ob) return oa - ob
    return a.wkctr.localeCompare(b.wkctr)
  })
  if (rows.length === 0) {
    return ENG_TECHNICIAN_CODES.map((def) => ({
      wkctr: def.wkctr,
      displayName: engTechnicianDisplayName(def),
    }))
  }
  return rows.map((row) => ({
    wkctr: row.wkctr,
    displayName: engTechnicianDisplayName(row),
  }))
}

type ConfirmationRow = {
  idclose: number
  idiw37: number
  wkorder: string | null
  wkctr: string
  titlewkctr: string | null
  namewkctr: string | null
  surnamewkctr: string | null
  stdate: string | number
  endate: string | number
  timewk: string | number
  unitc: string
}

export type ConfirmationCloseItem = {
  idclose: number
  idiw37: number
  wkctr: string
  displayName: string
  stdate: number
  endate: number
  timewk: number
  unitc: string
}

export async function getConfirmationByWorkOrder(
  pool: Pool,
  wkorder: string,
): Promise<{ idiw37: number; wkorder: string; items: ConfirmationCloseItem[] } | null> {
  const r = await pool.query<ConfirmationRow>(
    `SELECT idclose, idiw37, wkorder, wkctr, titlewkctr, namewkctr, surnamewkctr,
            stdate, endate, timewk, unitc
     FROM app.view_confirmation
     WHERE wkorder = $1
     ORDER BY wkctr ASC, idclose ASC`,
    [wkorder],
  )
  if (r.rows.length === 0) return null
  const idiw37 = Number(r.rows[0].idiw37)
  const items = r.rows.map((row) => ({
    idclose: row.idclose,
    idiw37: Number(row.idiw37),
    wkctr: row.wkctr,
    displayName: `${row.titlewkctr ?? ''}${row.namewkctr ?? ''} ${row.surnamewkctr ?? ''}`.trim(),
    stdate: Number(row.stdate),
    endate: Number(row.endate),
    timewk: Number(row.timewk),
    unitc: row.unitc,
  }))
  return { idiw37, wkorder, items }
}

type Iw37Row = { idiw37: number; wkorder: string }

export async function findWorkOrderByWkorder(
  pool: Pool,
  wkorder: string,
): Promise<Iw37Row | null> {
  const r = await pool.query<Iw37Row>(
    `SELECT idiw37, wkorder
     FROM app.tbiw37n
     WHERE wkorder = $1
     LIMIT 1`,
    [wkorder],
  )
  return r.rows[0] ?? null
}

function parseDdMmYyyy(v: string): { dd: number; mm: number; yyyy: number } | null {
  const m = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(v.trim())
  if (!m) return null
  const dd = Number(m[1])
  const mm = Number(m[2])
  const yyyy = Number(m[3])
  if (!Number.isFinite(dd) || !Number.isFinite(mm) || !Number.isFinite(yyyy)) return null
  if (dd < 1 || dd > 31 || mm < 1 || mm > 12 || yyyy < 1970 || yyyy > 2100) return null
  return { dd, mm, yyyy }
}

function parseHhMm(v: string): { hh: number; min: number } | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(v.trim())
  if (!m) return null
  const hh = Number(m[1])
  const min = Number(m[2])
  if (!Number.isFinite(hh) || !Number.isFinite(min)) return null
  if (hh < 0 || hh > 23 || min < 0 || min > 59) return null
  return { hh, min }
}

function computeEpochSeconds(d: { dd: number; mm: number; yyyy: number }, t: { hh: number; min: number }): number {
  const dt = new Date(d.yyyy, d.mm - 1, d.dd, t.hh, t.min, 0, 0)
  return Math.floor(dt.getTime() / 1000)
}

function durationMinutes(stSec: number, enSec: number): number {
  const diff = enSec - stSec
  if (!Number.isFinite(diff) || diff <= 0) return 0
  return Math.floor(diff / 60)
}

export async function addConfirmationClose(
  pool: Pool | PoolClient,
  opts: {
    idiw37: number
    wkctr: string
    startD: string
    startT: string
    endD: string
    endT: string
    cwkctr: string | null
  },
): Promise<void> {
  const { assertWorkOrderCloseReady } = await import('../lib/work-order-close-guard.js')
  await assertWorkOrderCloseReady(pool, opts.idiw37)

  const d1 = parseDdMmYyyy(opts.startD)
  const d2 = parseDdMmYyyy(opts.endD)
  const t1 = parseHhMm(opts.startT)
  const t2 = parseHhMm(opts.endT)
  if (!d1 || !d2 || !t1 || !t2) throw new Error('Invalid date/time format')

  const stdate = computeEpochSeconds(d1, t1)
  const endate = computeEpochSeconds(d2, t2)
  const timewk = durationMinutes(stdate, endate)
  if (timewk <= 0) throw new Error('End time must be after start time')

  const timeclose = Math.floor(Date.now() / 1000)

  const qcBeforeR = await pool.query<{ confirm_qc_status: string | null }>(
    `SELECT confirm_qc_status FROM app.tbiw37n WHERE idiw37 = $1`,
    [opts.idiw37],
  )
  const qcBefore = (qcBeforeR.rows[0]?.confirm_qc_status ?? '').trim().toLowerCase()

  // unique key หลัง migration 032: (idiw37, wkctr, confirmation, timeclose)
  // การกดบันทึกซ้ำในวินาทีเดียวกัน + ช่างเดิม + WO เดิม จะถูก upsert
  // ส่วน confirmation จากหน้าแอป (ไม่ใช่ import) จะเป็น '' เสมอ
  await pool.query(
    `INSERT INTO app.tbcofirm
       (idiw37, wkctr, confirmation, stdate, endate, cwkctr, timeclose, timewk, unitc)
     VALUES ($1, $2, '', $3, $4, $5, $6, $7, 'Min')
     ON CONFLICT (idiw37, wkctr, confirmation, timeclose)
     DO UPDATE SET stdate = EXCLUDED.stdate, endate = EXCLUDED.endate,
                   cwkctr = EXCLUDED.cwkctr, timewk = EXCLUDED.timewk, unitc = 'Min'`,
    [opts.idiw37, opts.wkctr, stdate, endate, opts.cwkctr, timeclose, timewk],
  )
  await touchConfirmQcPending(pool, opts.idiw37)

  if (qcBefore !== 'pending') {
    void notifyPlannerWorkClosed(pool as Pool, opts.idiw37, opts.wkctr).catch((err) => {
      console.error('[planner-close-notify]', opts.idiw37, err)
    })
  }
}

export type ConfirmationMassCloseFail = { idiw37: number; message: string }

export type ConfirmationMassCloseResult = {
  succeeded: number[]
  failed: ConfirmationMassCloseFail[]
}

async function idiw37InFactory(pool: Pool | PoolClient, idiw37: number): Promise<boolean> {
  const r = await pool.query(
    `SELECT 1 FROM app.tbiw37n WHERE idiw37 = $1 AND functionalloc LIKE $2 LIMIT 1`,
    [idiw37, `%${FACTORY_CODE}%`],
  )
  return (r.rowCount ?? 0) > 0
}

/**
 * ปิดงาน (confirm) หลาย WO ในคำขอเดียว — ตาม Mass Confirm 44 ของ SAP
 */
export async function addConfirmationCloseBatch(
  pool: Pool,
  opts: {
    idiw37n: number[]
    wkctr: string
    startD: string
    startT: string
    endD: string
    endT: string
    cwkctr: string | null
  },
): Promise<ConfirmationMassCloseResult> {
  const seen = new Set<number>()
  const unique: number[] = []
  for (const raw of opts.idiw37n) {
    const n = Number(raw)
    if (!Number.isFinite(n) || n <= 0 || seen.has(n)) continue
    seen.add(n)
    unique.push(n)
  }

  assertMassConfirmBatchSize(unique.length)

  const succeeded: number[] = []
  const failed: ConfirmationMassCloseFail[] = []
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    for (const idiw37 of unique) {
      try {
        if (!(await idiw37InFactory(client, idiw37))) {
          failed.push({ idiw37, message: 'Work order not found' })
          continue
        }
        await addConfirmationClose(client, {
          idiw37,
          wkctr: opts.wkctr,
          startD: opts.startD,
          startT: opts.startT,
          endD: opts.endD,
          endT: opts.endT,
          cwkctr: opts.cwkctr,
        })
        succeeded.push(idiw37)
      } catch (err) {
        failed.push({
          idiw37,
          message: err instanceof Error ? err.message : String(err),
        })
      }
    }
    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK').catch(() => undefined)
    throw err
  } finally {
    client.release()
  }

  return { succeeded, failed }
}

// ----- Confirmation import -----

export type ConfirmImportRowResult = {
  rowNo: number
  action: 'inserted' | 'updated' | 'skipped' | 'error'
  confirmation: string
  wkorder: string
  wkctr: string
  stdate: number | null
  endate: number | null
  timewk: number | null
  message: string
}

export type ConfirmImportSummary = {
  totalRows: number
  inserted: number
  updated: number
  skipped: number
  errors: number
  rows: ConfirmImportRowResult[]
}

export type ConfirmImportPreviewResult = ConfirmImportSummary & {
  layout: ConfirmLayout
  parseOk: number
  matchWoInDb: number
}

async function findIdiw37ByWkorder(
  client: PoolClient,
  wkorder: string,
): Promise<number | null> {
  const r = await client.query<{ idiw37: number }>(
    `SELECT idiw37 FROM app.tbiw37n WHERE wkorder = $1 LIMIT 1`,
    [wkorder],
  )
  return r.rows[0]?.idiw37 ?? null
}

async function resolveConfirmImportAction(
  client: PoolClient,
  row: ConfirmImportRow,
  idiw37: number,
  dryRun: boolean,
): Promise<'inserted' | 'updated'> {
  const existing = await client.query<{ idclose: number }>(
    `SELECT idclose FROM app.tbcofirm
     WHERE idiw37 = $1 AND wkctr = $2 AND confirmation = $3 AND timeclose = $4
     LIMIT 1`,
    [idiw37, row.wkctr, row.confirmation, row.timeclose],
  )
  if (existing.rows.length > 0) {
    if (!dryRun) {
      await client.query(
        `UPDATE app.tbcofirm
         SET stdate = $2, endate = $3, cwkctr = $4, timewk = $5, unitc = 'Min'
         WHERE idclose = $1`,
        [existing.rows[0]!.idclose, row.stdate, row.endate, row.cwkctr, row.timewk],
      )
    }
    return 'updated'
  }
  if (!dryRun) {
    await client.query(
      `INSERT INTO app.tbcofirm
         (idiw37, confirmation, wkctr, stdate, endate, cwkctr, timeclose, timewk, unitc)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Min')`,
      [
        idiw37,
        row.confirmation,
        row.wkctr,
        row.stdate,
        row.endate,
        row.cwkctr,
        row.timeclose,
        row.timewk,
      ],
    )
  }
  return 'inserted'
}

async function processConfirmImportParsed(
  client: PoolClient,
  parsed: ReturnType<typeof parseConfirmFileWithMeta>['results'],
  dryRun: boolean,
): Promise<ConfirmImportSummary> {
  const rows: ConfirmImportRowResult[] = []
  let inserted = 0
  let updated = 0
  let skipped = 0
  let errors = 0

  for (const r of parsed) {
    if (r.kind === 'error') {
      rows.push({
        rowNo: r.rowNo,
        action: 'error',
        confirmation: r.raw.confirmation,
        wkorder: r.raw.wkorder,
        wkctr: r.raw.wkctr,
        stdate: null,
        endate: null,
        timewk: null,
        message: r.message,
      })
      errors++
      continue
    }
    const row = r.row
    try {
      const idiw37 = await findIdiw37ByWkorder(client, row.wkorder)
      if (idiw37 == null) {
        rows.push({
          rowNo: row.rowNo,
          action: 'skipped',
          confirmation: row.confirmation,
          wkorder: row.wkorder,
          wkctr: row.wkctr,
          stdate: row.stdate,
          endate: row.endate,
          timewk: row.timewk,
          message: `ไม่พบ WO ใน tbiw37n: ${row.wkorder}`,
        })
        skipped++
        continue
      }
      const action = await resolveConfirmImportAction(client, row, idiw37, dryRun)
      rows.push({
        rowNo: row.rowNo,
        action,
        confirmation: row.confirmation,
        wkorder: row.wkorder,
        wkctr: row.wkctr,
        stdate: row.stdate,
        endate: row.endate,
        timewk: row.timewk,
        message: dryRun
          ? action === 'inserted'
            ? 'จะเพิ่มใหม่'
            : 'จะอัปเดต'
          : action === 'inserted'
            ? 'New Success'
            : 'Update Success',
      })
      if (action === 'inserted') inserted++
      else updated++
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown DB error'
      rows.push({
        rowNo: row.rowNo,
        action: 'error',
        confirmation: row.confirmation,
        wkorder: row.wkorder,
        wkctr: row.wkctr,
        stdate: row.stdate,
        endate: row.endate,
        timewk: row.timewk,
        message: msg,
      })
      errors++
    }
  }

  return { totalRows: parsed.length, inserted, updated, skipped, errors, rows }
}

/** ตรวจสอบก่อน commit — ไม่เขียน tbcofirm */
export async function previewConfirmFile(
  pool: Pool,
  fileName: string,
  buffer: Buffer,
): Promise<ConfirmImportPreviewResult> {
  const parsed = parseConfirmFileWithMeta(buffer, fileName)
  const parseOk = parsed.results.filter((r) => r.kind === 'ok').length
  const client = await pool.connect()
  try {
    const summary = await processConfirmImportParsed(client, parsed.results, true)
    const matchWoInDb = summary.rows.filter(
      (r) => r.action === 'inserted' || r.action === 'updated',
    ).length
    return { ...summary, layout: parsed.layout, parseOk, matchWoInDb }
  } finally {
    client.release()
  }
}

export async function importConfirmFile(
  pool: Pool,
  fileName: string,
  buffer: Buffer,
): Promise<ConfirmImportSummary> {
  const parsed = parseConfirmFileWithMeta(buffer, fileName)
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const summary = await processConfirmImportParsed(client, parsed.results, false)
    await client.query('COMMIT')
    return summary
  } catch (err) {
    await client.query('ROLLBACK').catch(() => undefined)
    throw err
  } finally {
    client.release()
  }
}

export async function deleteConfirmationClose(pool: Pool, idclose: number): Promise<void> {
  await pool.query(`DELETE FROM app.tbcofirm WHERE idclose = $1`, [idclose])
}

type ConfirmationExportRowDb = {
  wkorder: string | null
  opac: string | number | null
  wkctr: string | null
  timewk: string | number | null
  unitc: string | null
  stdate: string | number | null
  endate: string | number | null
}

export type ConfirmationExportRow = {
  no: number
  confirmation: string
  wkorder: string
  opac: string
  subO: string
  ca: string
  split: string
  wkctr: string
  timewk: number
  unitc: string
  startDateExe: string
  endDateExe: string
  startExecute: string
  endExecute: string
}

export type ConfirmationPreviewRow = ConfirmationExportRow & {
  idiw37: number
  confirmQcStatus: 'pending' | 'rejected'
  source: 'personnel' | 'supervisor'
}

export { formatDdMmYyyyCompact, formatHhMm }

export async function listConfirmationExportRows(
  pool: Pool,
  actorWkctr: string | undefined,
  idiw37n?: number[],
  scope: ConfirmationExportScope = 'OWN',
): Promise<ConfirmationExportRow[]> {
  const wkctr = (actorWkctr ?? '').trim()
  const hasWrkclose = await hasTbwrkcloseTable(pool)
  const params: unknown[] = []
  const parts: string[] = []

  const supervisorWhere: string[] = [
    `e.syst IN ('CRTD', 'REL')`,
    `i.confirm_qc_status = 'approved'`,
  ]
  if (idiw37n?.length) {
    params.push(idiw37n)
    supervisorWhere.push(`e.idiw37 = ANY($${params.length}::int[])`)
  }
  if (scope === 'OWN') {
    params.push(wkctr)
    supervisorWhere.push(`e.cwkctr = $${params.length}`)
  }
  parts.push(
    `SELECT e.wkorder, e.opac, e.wkctr, e.timewk, e.unitc, e.stdate, e.endate
     FROM app.view_exportconfirm e
     JOIN app.tbiw37n i ON i.idiw37 = e.idiw37
     WHERE ${supervisorWhere.join(' AND ')}`,
  )

  if (hasWrkclose) {
    const personnelWhere: string[] = [
      `i.confirm_qc_status = 'approved'`,
      `i.syst IN ('CRTD', 'REL')`,
      `NOT EXISTS (
         SELECT 1 FROM app.tbcofirm c
         WHERE c.idiw37 = w.idiw37 AND c.wkctr = w.wkctr
       )`,
    ]
    if (idiw37n?.length) {
      personnelWhere.push(`w.idiw37 = ANY($${params.indexOf(idiw37n) + 1}::int[])`)
    }
    if (scope === 'OWN') {
      const wkctrIdx = params.indexOf(wkctr) + 1
      if (wkctrIdx > 0) personnelWhere.push(`w.wkctr = $${wkctrIdx}`)
    }
    parts.push(
      `SELECT i.wkorder, i.opac, w.wkctr, w.wktimewk AS timewk, w.wkunit AS unitc,
              w.cstdate AS stdate, w.cendate AS endate
       FROM app.tbwrkclose w
       JOIN app.tbiw37n i ON i.idiw37 = w.idiw37
       WHERE ${personnelWhere.join(' AND ')}`,
    )
  }

  const r = await pool.query<ConfirmationExportRowDb>(
    `SELECT * FROM (${parts.join(' UNION ALL ')}) export_rows
     ORDER BY wkorder ASC, wkctr ASC`,
    params,
  )

  return r.rows.map((row, idx) =>
    buildConfirmationExportRow(idx, {
      wkorder: row.wkorder,
      opac: row.opac,
      wkctr: row.wkctr,
      timewk: row.timewk,
      unitc: row.unitc,
      stdate: row.stdate,
      endate: row.endate,
    }),
  )
}

export type ConfirmationPreviewStatus = 'pending' | 'rejected' | 'all'

async function hasTbwrkcloseTable(pool: Pool): Promise<boolean> {
  const r = await pool.query<{ reg: string | null }>(
    `SELECT to_regclass('app.tbwrkclose')::text AS reg`,
  )
  return Boolean(r.rows[0]?.reg)
}

export async function listConfirmationPreviewRows(
  pool: Pool,
  opts: { status?: ConfirmationPreviewStatus } = {},
): Promise<ConfirmationPreviewRow[]> {
  const status = opts.status ?? 'pending'
  const qcStatuses =
    status === 'all' ? (['pending', 'rejected'] as const) : ([status] as const)

  const hasWrkclose = await hasTbwrkcloseTable(pool)
  const params: unknown[] = [qcStatuses]
  const parts: string[] = []

  if (hasWrkclose) {
    parts.push(
      `SELECT w.idiw37,
              i.wkorder,
              i.opac,
              w.wkctr,
              w.wktimewk AS timewk,
              w.wkunit AS unitc,
              w.cstdate AS stdate,
              w.cendate AS endate,
              i.confirm_qc_status,
              'personnel'::text AS source
       FROM app.tbwrkclose w
       JOIN app.tbiw37n i ON i.idiw37 = w.idiw37
       WHERE i.confirm_qc_status = ANY($1::text[])
         AND i.syst IN ('CRTD', 'REL')`,
    )
  }

  parts.push(
    `SELECT c.idiw37,
            i.wkorder,
            i.opac,
            c.wkctr,
            c.timewk,
            c.unitc,
            c.stdate,
            c.endate,
            i.confirm_qc_status,
            'supervisor'::text AS source
     FROM app.tbcofirm c
     JOIN app.tbiw37n i ON i.idiw37 = c.idiw37
     WHERE i.confirm_qc_status = ANY($1::text[])
       AND i.syst IN ('CRTD', 'REL')${
         hasWrkclose
           ? `
       AND NOT EXISTS (
         SELECT 1 FROM app.tbwrkclose w
         WHERE w.idiw37 = c.idiw37 AND w.wkctr = c.wkctr
       )`
           : ''
       }`,
  )

  const r = await pool.query<{
    idiw37: number
    wkorder: string | null
    opac: string | number | null
    wkctr: string | null
    timewk: string | number | null
    unitc: string | null
    stdate: string | number | null
    endate: string | number | null
    confirm_qc_status: string | null
    source: 'personnel' | 'supervisor'
  }>(
    `SELECT * FROM (${parts.join(' UNION ALL ')}) preview_rows
     ORDER BY wkorder ASC, wkctr ASC`,
    params,
  )

  return r.rows.map((row, idx) => {
    const qc = row.confirm_qc_status === 'rejected' ? 'rejected' : 'pending'
    return {
      ...buildConfirmationExportRow(idx, row),
      idiw37: Number(row.idiw37),
      confirmQcStatus: qc,
      source: row.source,
    }
  })
}

export type ConfirmationCommentItem = {
  idcom: number
  idiw37: number
  comdetail: string
  wkctr: string
  createdAt: string
}

export async function listConfirmationComments(
  pool: Pool,
  idiw37: number,
): Promise<ConfirmationCommentItem[]> {
  const r = await pool.query<{
    idcom: string | number
    idiw37: string | number
    comdetail: string
    wkctr: string | null
    created_at: Date
  }>(
    `SELECT idcom, idiw37, comdetail, wkctr, created_at
     FROM app.tbconfirmcom
     WHERE idiw37 = $1
     ORDER BY created_at DESC, idcom DESC
     LIMIT 500`,
    [idiw37],
  )
  return r.rows.map((row) => ({
    idcom: Number(row.idcom),
    idiw37: Number(row.idiw37),
    comdetail: row.comdetail ?? '',
    wkctr: row.wkctr ?? '',
    createdAt: row.created_at.toISOString(),
  }))
}

export async function createConfirmationComment(
  pool: Pool,
  opts: { idiw37: number; comdetail: string; wkctr: string },
): Promise<ConfirmationCommentItem> {
  const r = await pool.query<{
    idcom: number
    idiw37: number
    comdetail: string
    wkctr: string
    created_at: Date
  }>(
    `INSERT INTO app.tbconfirmcom (idiw37, comdetail, wkctr)
     VALUES ($1, $2, $3)
     RETURNING idcom, idiw37, comdetail, wkctr, created_at`,
    [opts.idiw37, opts.comdetail, opts.wkctr],
  )
  const row = r.rows[0]
  return {
    idcom: Number(row.idcom),
    idiw37: Number(row.idiw37),
    comdetail: row.comdetail ?? '',
    wkctr: row.wkctr ?? '',
    createdAt: row.created_at.toISOString(),
  }
}

export async function updateConfirmationComment(
  pool: Pool,
  idcom: number,
  comdetail: string,
): Promise<ConfirmationCommentItem | null> {
  const r = await pool.query<{
    idcom: number
    idiw37: number
    comdetail: string
    wkctr: string
    created_at: Date
  }>(
    `UPDATE app.tbconfirmcom
     SET comdetail = $2
     WHERE idcom = $1
     RETURNING idcom, idiw37, comdetail, wkctr, created_at`,
    [idcom, comdetail],
  )
  const row = r.rows[0]
  if (!row) return null
  return {
    idcom: Number(row.idcom),
    idiw37: Number(row.idiw37),
    comdetail: row.comdetail ?? '',
    wkctr: row.wkctr ?? '',
    createdAt: row.created_at.toISOString(),
  }
}

export async function deleteConfirmationComment(pool: Pool, idcom: number): Promise<boolean> {
  const r = await pool.query(`DELETE FROM app.tbconfirmcom WHERE idcom = $1`, [idcom])
  return (r.rowCount ?? 0) > 0
}

export type ConfirmationImageItem = {
  idcimg: number
  idiw37: number
  fileName: string
  originalName: string
  mime: string
  bytes: number
  wkctr: string
  phase: ConfirmImagePhase | ''
  comment: string
  createdAt: string
}

function mapConfirmationImageRow(row: {
  idcimg: string | number
  idiw37: string | number
  cfilename: string
  original: string | null
  mime: string | null
  bytes: string | number | null
  wkctr: string | null
  img_phase?: string | null
  img_comment?: string | null
  created_at: Date
}): ConfirmationImageItem {
  const rawPhase = (row.img_phase ?? '').trim().toLowerCase()
  const phase: ConfirmImagePhase | '' =
    rawPhase === 'before' || rawPhase === 'after' ? rawPhase : ''
  return {
    idcimg: Number(row.idcimg),
    idiw37: Number(row.idiw37),
    fileName: row.cfilename ?? '',
    originalName: row.original ?? '',
    mime: row.mime ?? 'image/jpeg',
    bytes: row.bytes != null && row.bytes !== '' ? Number(row.bytes) || 0 : 0,
    wkctr: row.wkctr ?? '',
    phase,
    comment: row.img_comment ?? '',
    createdAt: row.created_at.toISOString(),
  }
}

export async function listConfirmationImages(
  pool: Pool,
  idiw37: number,
): Promise<ConfirmationImageItem[]> {
  const r = await pool.query<{
    idcimg: string | number
    idiw37: string | number
    cfilename: string
    original: string | null
    mime: string | null
    bytes: string | number | null
    wkctr: string | null
    img_phase: string | null
    img_comment: string | null
    created_at: Date
  }>(
    `SELECT idcimg, idiw37, cfilename, original, mime, bytes, wkctr,
            COALESCE(img_phase, '') AS img_phase,
            COALESCE(img_comment, '') AS img_comment,
            created_at
     FROM app.tbconfirmimg
     WHERE idiw37 = $1
     ORDER BY
       CASE COALESCE(img_phase, '')
         WHEN 'before' THEN 0
         WHEN 'after' THEN 1
         ELSE 2
       END,
       created_at DESC,
       idcimg DESC
     LIMIT 200`,
    [idiw37],
  )
  return r.rows.map(mapConfirmationImageRow)
}

/** โฟลเดอร์เก่าบนดิสก์ — อ่าน fallback จนกว่าจะ migrate เข้า img_data */
export const CONFIRM_IMAGE_LEGACY_DIRS = [
  path.resolve(process.cwd(), 'uploads', 'confirm-images'),
  path.resolve(process.cwd(), 'data', 'confirmation-images'),
]

export async function createConfirmationImageRecord(
  pool: Pool,
  opts: {
    idiw37: number
    fileName: string
    originalName: string
    mime: string
    bytes: number
    imageData: Buffer
    wkctr: string
    phase: ConfirmImagePhase
    comment: string
  },
): Promise<ConfirmationImageItem> {
  const r = await pool.query<{
    idcimg: number
    idiw37: number
    cfilename: string
    original: string | null
    mime: string | null
    bytes: number | null
    wkctr: string | null
    img_phase: string | null
    img_comment: string | null
    created_at: Date
  }>(
    `INSERT INTO app.tbconfirmimg
       (idiw37, cfilename, original, mime, bytes, wkctr, img_phase, img_comment, img_data)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING idcimg, idiw37, cfilename, original, mime, bytes, wkctr,
               img_phase, img_comment, created_at`,
    [
      opts.idiw37,
      opts.fileName,
      opts.originalName,
      opts.mime,
      opts.bytes,
      opts.wkctr,
      opts.phase,
      opts.comment,
      opts.imageData,
    ],
  )
  const row = r.rows[0]
  await touchConfirmQcPending(pool, opts.idiw37)
  return mapConfirmationImageRow(row)
}

export async function deleteConfirmationImageRecord(
  pool: Pool,
  idcimg: number,
): Promise<{ ok: boolean; fileName: string | null }> {
  const r = await pool.query<{ cfilename: string; idiw37: number }>(
    `DELETE FROM app.tbconfirmimg
     WHERE idcimg = $1
     RETURNING cfilename, idiw37`,
    [idcimg],
  )
  const row = r.rows[0]
  if (row) await touchConfirmQcPending(pool, row.idiw37)
  return { ok: (r.rowCount ?? 0) > 0, fileName: row?.cfilename ?? null }
}

export async function getConfirmationImageMeta(
  pool: Pool,
  idcimg: number,
): Promise<{ idcimg: number; idiw37: number; fileName: string; mime: string } | null> {
  const r = await pool.query<{
    idcimg: number
    idiw37: number
    cfilename: string
    mime: string | null
  }>(
    `SELECT idcimg, idiw37, cfilename, mime
     FROM app.tbconfirmimg
     WHERE idcimg = $1
     LIMIT 1`,
    [idcimg],
  )
  const row = r.rows[0]
  if (!row) return null
  return {
    idcimg: row.idcimg,
    idiw37: row.idiw37,
    fileName: row.cfilename,
    mime: row.mime ?? 'image/jpeg',
  }
}

/** อ่าน binary — img_data ก่อน แล้ว fallback ไฟล์ legacy บนดิสก์ */
export async function readConfirmationImageBuffer(
  pool: Pool,
  idcimg: number,
): Promise<{ idcimg: number; mime: string; data: Buffer } | null> {
  const r = await pool.query<{
    idcimg: string | number
    cfilename: string
    mime: string | null
    img_data: Buffer | null
  }>(
    `SELECT idcimg, cfilename, mime, img_data
     FROM app.tbconfirmimg
     WHERE idcimg = $1
     LIMIT 1`,
    [idcimg],
  )
  const row = r.rows[0]
  if (!row) return null

  if (row.img_data?.length) {
    return {
      idcimg: Number(row.idcimg),
      mime: row.mime ?? 'image/webp',
      data: row.img_data,
    }
  }

 for (const dir of CONFIRM_IMAGE_LEGACY_DIRS) {
    const abs = path.join(dir, row.cfilename)
    try {
      const data = await fs.readFile(abs)
      return {
        idcimg: Number(row.idcimg),
        mime: row.mime ?? 'image/jpeg',
        data,
      }
    } catch {
      /* try next dir */
    }
  }
  return null
}

/** ลบไฟล์ legacy บนดิสก์ (ถ้ามี) หลังลบแถวใน DB */
export async function unlinkLegacyConfirmationImageFile(fileName: string): Promise<void> {
 for (const dir of CONFIRM_IMAGE_LEGACY_DIRS) {
    await fs.unlink(path.join(dir, fileName)).catch(() => {})
  }
}
