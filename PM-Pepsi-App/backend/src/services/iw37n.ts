import { createHash } from 'node:crypto'
import type { Pool } from 'pg'
import type { z } from 'zod'
import type { iw37nBatchItemSchema } from '../schemas/iw37n.js'
import { parseIw37nFile, parseIw37nFileWithMeta, type Iw37nImportRow } from './iw37n-parser.js'

type BatchItem = z.infer<typeof iw37nBatchItemSchema>

type BatchRow = {
  id: string
  file_name: string
  imported_at: Date
  row_count: number
  sha256: string
  status: string
  is_duplicate?: boolean
  duplicate_of_batch_id?: string | null
}

function mapBatch(row: BatchRow): BatchItem {
  return {
    id: String(row.id),
    fileName: row.file_name,
    importedAt: row.imported_at.toISOString(),
    rows: row.row_count,
    sha256: row.sha256,
    status: row.status as BatchItem['status'],
    isDuplicate: Boolean(row.is_duplicate),
    duplicateOfBatchId: row.duplicate_of_batch_id ? String(row.duplicate_of_batch_id) : null,
  }
}

export type Iw37nImportRowResult = {
  rowNo: number
  action: 'inserted' | 'updated' | 'skipped' | 'error'
  wkorder: string
  opac: string
  mntplan: string
  wktype: string
  mat: string
  syst: string
  message: string
}

export async function listIw37nBatches(pool: Pool, limit = 50): Promise<BatchItem[]> {
  const r = await pool.query<BatchRow>(
    `SELECT
       id::text,
       file_name,
       imported_at,
       row_count,
       sha256,
       status,
       (COUNT(*) OVER (PARTITION BY sha256) > 1) AS is_duplicate,
       CASE
         WHEN id = FIRST_VALUE(id) OVER (PARTITION BY sha256 ORDER BY imported_at ASC) THEN NULL
         ELSE (FIRST_VALUE(id) OVER (PARTITION BY sha256 ORDER BY imported_at ASC))::text
       END AS duplicate_of_batch_id
     FROM app.tbiw37n_import_batch
     ORDER BY imported_at DESC
     LIMIT $1`,
    [limit],
  )
  return r.rows.map(mapBatch)
}

async function findEarliestBatchIdBySha256(pool: Pool, sha256: string): Promise<string | null> {
  const r = await pool.query<{ id: string }>(
    `SELECT id::text AS id
     FROM app.tbiw37n_import_batch
     WHERE sha256 = $1
     ORDER BY imported_at ASC
     LIMIT 1`,
    [sha256],
  )
  return r.rows[0]?.id ? String(r.rows[0].id) : null
}

type ImportRowDb = {
  row_no: number
  action: string
  wkorder: string | null
  opac: string | null
  mntplan: string | null
  wktype: string | null
  mat: string | null
  syst: string | null
  message: string | null
  created_at: Date
}

export async function listIw37nBatchRows(
  pool: Pool,
  batchId: string,
  opts?: { limit?: number; offset?: number },
): Promise<(Iw37nImportRowResult & { createdAt: string })[]> {
  const id = Number(batchId)
  if (!Number.isFinite(id)) return []
  const limit = opts?.limit ?? 500
  const offset = opts?.offset ?? 0
  const r = await pool.query<ImportRowDb>(
    `SELECT row_no, action, wkorder, opac, mntplan, wktype, mat, syst, message, created_at
     FROM app.tbiw37n_import_row
     WHERE batch_id = $1
     ORDER BY row_no ASC
     LIMIT $2 OFFSET $3`,
    [id, limit, offset],
  )
  return r.rows.map((x) => ({
    rowNo: Number(x.row_no),
    action: (x.action as Iw37nImportRowResult['action']) || 'skipped',
    wkorder: x.wkorder?.trim() ?? '',
    opac: x.opac?.trim() ?? '',
    mntplan: x.mntplan?.trim() ?? '',
    wktype: x.wktype?.trim() ?? '',
    mat: x.mat?.trim() ?? '',
    syst: x.syst?.trim() ?? '',
    message: x.message?.trim() ?? '',
    createdAt: x.created_at.toISOString(),
  }))
}

function deriveSyst(systemstatus: string): string {
  const parts = String(systemstatus ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (parts.length === 0) return ''
  if (parts[0] === 'REL' || parts[0] === 'CRTD') return parts[0]
  return parts.length >= 2 ? `${parts[0]} ${parts[1]}` : parts[0]
}

function parseEpochInput(v: unknown): number | null {
  if (v == null) return null
  if (typeof v === 'number') return Number.isFinite(v) ? Math.floor(v) : null
  const s = String(v).trim()
  if (!s) return null
  const n = Number(s)
  if (Number.isFinite(n)) return Math.floor(n)
  const mIso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
  if (mIso) {
    const dt = new Date(Number(mIso[1]), Number(mIso[2]) - 1, Number(mIso[3]), 0, 0, 0, 0)
    const ms = dt.getTime()
    return Number.isFinite(ms) ? Math.floor(ms / 1000) : null
  }
  const m = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(s)
  if (m) {
    const dt = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]), 0, 0, 0, 0)
    const ms = dt.getTime()
    return Number.isFinite(ms) ? Math.floor(ms / 1000) : null
  }
  return null
}

function parseNumberInput(v: unknown): number | null {
  if (v == null) return null
  if (typeof v === 'number') return Number.isFinite(v) ? v : null
  const s = String(v).trim()
  if (!s) return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

export type Iw37nItem = {
  idiw37: number
  mntplan: string
  wkorder: string
  wktype: string
  mat: string
  bscstart: number | null
  actfinish: number | null
  systemstatus: string
  syst: string
  opac: string
  operationshorttext: string
  ostdescription: string
  cknow: string
  wkctr: string
  work: number | null
  actwork: number | null
  untime: number | null
  equipment: string
  equdescrip: string
  functionalloc: string
  funcdescrip: string
  team: string | null
}

type ItemRow = {
  idiw37: number
  mntplan: string | null
  wkorder: string | null
  wktype: string | null
  mat: string | null
  bscstart: string | number | null
  actfinish: string | number | null
  systemstatus: string | null
  syst: string | null
  opac: string | null
  operationshorttext: string | null
  ostdescription: string | null
  cknow: string | null
  wkctr: string | null
  work: string | number | null
  actwork: string | number | null
  untime: string | number | null
  equipment: string | null
  equdescrip: string | null
  functionalloc: string | null
  funcdescrip: string | null
  team: string | null
}

function mapItemRow(r: ItemRow): Iw37nItem {
  return {
    idiw37: Number(r.idiw37),
    mntplan: (r.mntplan ?? '').trim(),
    wkorder: (r.wkorder ?? '').trim(),
    wktype: (r.wktype ?? '').trim(),
    mat: (r.mat ?? '').trim(),
    bscstart: r.bscstart == null ? null : Number(r.bscstart),
    actfinish: r.actfinish == null ? null : Number(r.actfinish),
    systemstatus: (r.systemstatus ?? '').trim(),
    syst: (r.syst ?? '').trim(),
    opac: (r.opac ?? '').trim(),
    operationshorttext: (r.operationshorttext ?? '').trim(),
    ostdescription: (r.ostdescription ?? '').trim(),
    cknow: (r.cknow ?? '').trim(),
    wkctr: (r.wkctr ?? '').trim(),
    work: r.work == null ? null : Number(r.work),
    actwork: r.actwork == null ? null : Number(r.actwork),
    untime: r.untime == null ? null : Number(r.untime),
    equipment: (r.equipment ?? '').trim(),
    equdescrip: (r.equdescrip ?? '').trim(),
    functionalloc: (r.functionalloc ?? '').trim(),
    funcdescrip: (r.funcdescrip ?? '').trim(),
    team: r.team?.trim() ?? null,
  }
}

export async function listIw37nItems(
  pool: Pool,
  opts?: { q?: string; limit?: number; offset?: number },
): Promise<Iw37nItem[]> {
  const limit = opts?.limit ?? 100
  const offset = opts?.offset ?? 0
  const q = (opts?.q ?? '').trim()
  const params: unknown[] = [limit, offset]
  let where = ''
  if (q) {
    params.push(`%${q}%`)
    where = `WHERE wkorder ILIKE $3 OR mntplan ILIKE $3 OR opac ILIKE $3`
  }
  const r = await pool.query<ItemRow>(
    `SELECT
       idiw37,
       mntplan,
       wkorder,
       wktype,
       mat,
       bscstart,
       actfinish,
       systemstatus,
       syst,
       opac,
       operationshorttext,
       ostdescription,
       cknow,
       wkctr,
       work,
       actwork,
       untime,
       equipment,
       equdescrip,
       functionalloc,
       funcdescrip,
       team
     FROM app.tbiw37n
     ${where}
     ORDER BY idiw37 DESC
     LIMIT $1 OFFSET $2`,
    params,
  )
  return r.rows.map(mapItemRow)
}

export async function getIw37nItem(pool: Pool, id: string): Promise<Iw37nItem | null> {
  const n = Number(id)
  if (!Number.isFinite(n)) return null
  const r = await pool.query<ItemRow>(
    `SELECT
       idiw37,
       mntplan,
       wkorder,
       wktype,
       mat,
       bscstart,
       actfinish,
       systemstatus,
       syst,
       opac,
       operationshorttext,
       ostdescription,
       cknow,
       wkctr,
       work,
       actwork,
       untime,
       equipment,
       equdescrip,
       functionalloc,
       funcdescrip,
       team
     FROM app.tbiw37n
     WHERE idiw37 = $1
     LIMIT 1`,
    [n],
  )
  const row = r.rows[0]
  return row ? mapItemRow(row) : null
}

export async function updateIw37nItem(
  pool: Pool,
  id: string,
  input: {
    mntplan: string
    wkorder: string
    wktype: string
    mat: string
    bscstart: unknown
    actfinish: unknown
    systemstatus: string
    opac: string
    operationshorttext: string
    ostdescription: string
    cknow: string
    wkctr: string
    work: unknown
    actwork: unknown
    untime: unknown
    equipment: string
    equdescrip: string
    functionalloc: string
    funcdescrip: string
    team?: string | null
  },
): Promise<
  | { kind: 'ok'; item: Iw37nItem }
  | { kind: 'not_found' }
  | { kind: 'validation'; message: string }
  | { kind: 'duplicate_key'; message: string }
> {
  const idiw37 = Number(id)
  if (!Number.isFinite(idiw37)) return { kind: 'not_found' }

  const wkorder = (input.wkorder ?? '').trim()
  const opac = (input.opac ?? '').trim()
  if (!wkorder || !opac) return { kind: 'validation', message: 'wkorder and opac are required' }

  const exists = await pool.query(`SELECT 1 FROM app.tbiw37n WHERE idiw37 = $1`, [idiw37])
  if ((exists.rowCount ?? 0) === 0) return { kind: 'not_found' }

  const dup = await pool.query(
    `SELECT 1 FROM app.tbiw37n WHERE wkorder = $1 AND opac = $2 AND idiw37 <> $3 LIMIT 1`,
    [wkorder, opac, idiw37],
  )
  if ((dup.rowCount ?? 0) > 0) {
    return { kind: 'duplicate_key', message: 'wkorder + opac already exists' }
  }

  const bscstart = parseEpochInput(input.bscstart)
  const actfinish = parseEpochInput(input.actfinish)
  const syst = deriveSyst(input.systemstatus)

  const work = parseNumberInput(input.work)
  const actwork = parseNumberInput(input.actwork)
  const untime = parseNumberInput(input.untime)

  await pool.query(
    `UPDATE app.tbiw37n SET
       mntplan = $1,
       wkorder = $2,
       wktype = $3,
       mat = $4,
       bscstart = $5,
       actfinish = $6,
       systemstatus = $7,
       syst = $8,
       opac = $9,
       operationshorttext = $10,
       ostdescription = $11,
       cknow = $12,
       wkctr = $13,
       work = $14,
       actwork = $15,
       untime = $16,
       equipment = $17,
       equdescrip = $18,
       functionalloc = $19,
       funcdescrip = $20,
       team = $21
     WHERE idiw37 = $22`,
    [
      (input.mntplan ?? '').trim(),
      wkorder,
      (input.wktype ?? '').trim(),
      (input.mat ?? '').trim(),
      bscstart,
      actfinish,
      (input.systemstatus ?? '').trim(),
      syst,
      opac,
      (input.operationshorttext ?? '').trim(),
      (input.ostdescription ?? '').trim(),
      (input.cknow ?? '').trim(),
      (input.wkctr ?? '').trim(),
      work,
      actwork,
      untime,
      (input.equipment ?? '').trim(),
      (input.equdescrip ?? '').trim(),
      (input.functionalloc ?? '').trim(),
      (input.funcdescrip ?? '').trim(),
      input.team == null ? null : String(input.team).trim(),
      idiw37,
    ],
  )

  const updated = await getIw37nItem(pool, String(idiw37))
  if (!updated) return { kind: 'not_found' }
  return { kind: 'ok', item: updated }
}

export async function deleteIw37nItem(pool: Pool, id: string): Promise<boolean> {
  const idiw37 = Number(id)
  if (!Number.isFinite(idiw37)) return false
  const r = await pool.query(`DELETE FROM app.tbiw37n WHERE idiw37 = $1`, [idiw37])
  return (r.rowCount ?? 0) > 0
}

async function wouldUpsertIw37Row(pool: Pool, row: Iw37nImportRow): Promise<'inserted' | 'updated'> {
  const existing = await pool.query<{ idiw37: number }>(
    `SELECT idiw37 FROM app.tbiw37n WHERE wkorder = $1 AND opac = $2 LIMIT 1`,
    [row.wkorder, row.opac],
  )
  return existing.rows[0] ? 'updated' : 'inserted'
}

async function upsertIw37Row(pool: Pool, row: Iw37nImportRow): Promise<'inserted' | 'updated'> {
  const existing = await pool.query<{ idiw37: number }>(
    `SELECT idiw37 FROM app.tbiw37n WHERE wkorder = $1 AND opac = $2 LIMIT 1`,
    [row.wkorder, row.opac],
  )

  const params = [
    row.mntplan,
    row.wkorder,
    row.wktype,
    row.mat,
    row.bscstart,
    row.actfinish,
    row.systemstatus,
    row.syst,
    row.opac,
    row.operationshorttext,
    row.ostdescription,
    row.cknow,
    row.wkctr,
    row.work,
    row.actwork,
    row.untime,
    row.equipment,
    row.equdescrip,
    row.functionalloc,
    row.funcdescrip,
  ]

  if (existing.rows[0]) {
    await pool.query(
      `UPDATE app.tbiw37n SET
         mntplan = $1, wktype = $3, mat = $4, bscstart = $5, actfinish = $6,
         systemstatus = $7, syst = $8, operationshorttext = $10, ostdescription = $11,
         cknow = $12, wkctr = $13, work = $14, actwork = $15, untime = $16,
         equipment = $17, equdescrip = $18, functionalloc = $19, funcdescrip = $20
       WHERE wkorder = $2 AND opac = $9`,
      params,
    )
    return 'updated'
  }

  await pool.query(
    `INSERT INTO app.tbiw37n (
       mntplan, wkorder, wktype, mat, bscstart, actfinish, systemstatus, syst, opac,
       operationshorttext, ostdescription, cknow, wkctr, work, actwork, untime,
       equipment, equdescrip, functionalloc, funcdescrip
     ) VALUES (
       $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20
     )`,
    params,
  )
  return 'inserted'
}

async function insertImportRows(
  pool: Pool,
  batchId: number,
  rows: Iw37nImportRowResult[],
): Promise<void> {
  const chunkSize = 400
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize)
    const params: unknown[] = [batchId]
    const values: string[] = []
    let p = 2
    for (const r of chunk) {
      values.push(
        `($1, $${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++})`,
      )
      params.push(
        r.rowNo,
        r.action,
        r.wkorder || null,
        r.opac || null,
        r.mntplan || null,
        r.wktype || null,
        r.mat || null,
        r.syst || null,
        r.message || null,
      )
    }
    await pool.query(
      `INSERT INTO app.tbiw37n_import_row (
         batch_id, row_no, action, wkorder, opac, mntplan, wktype, mat, syst, message
       ) VALUES ${values.join(', ')}`,
      params,
    )
  }
}

export type Iw37nImportSource = 'manual' | 'sap_folder' | 'api'

export type Iw37nImportSummary = {
  fileName: string
  sha256: string
  totalRows: number
  inserted: number
  updated: number
  skipped: number
  errors: number
  isDuplicate: boolean
  duplicateOfBatchId: string | null
  wouldStatus: BatchItem['status']
  errorGroups: { message: string; count: number }[]
}

function resolveImportStatus(
  _isDuplicate: boolean,
  inserted: number,
  updated: number,
  skipped: number,
  errors: number,
): BatchItem['status'] {
  const processed = inserted + updated
  if (processed === 0) return 'ERR'
  if (skipped > 0 || errors > 0) return 'PARTIAL'
  return 'OK'
}

function buildImportSummary(
  fileName: string,
  sha256: string,
  rows: Iw37nImportRowResult[],
  isDuplicate: boolean,
  duplicateOfBatchId: string | null,
): Iw37nImportSummary {
  let inserted = 0
  let updated = 0
  let skipped = 0
  let errors = 0
  const errMap = new Map<string, number>()
  for (const r of rows) {
    if (r.action === 'inserted') inserted++
    else if (r.action === 'updated') updated++
    else if (r.action === 'error') {
      errors++
      const msg = r.message.trim() || 'Error'
      errMap.set(msg, (errMap.get(msg) ?? 0) + 1)
    } else skipped++
  }
  const errorGroups = [...errMap.entries()]
    .map(([message, count]) => ({ message, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20)

  return {
    fileName,
    sha256,
    totalRows: rows.length,
    inserted,
    updated,
    skipped,
    errors,
    isDuplicate,
    duplicateOfBatchId,
    wouldStatus: resolveImportStatus(isDuplicate, inserted, updated, skipped, errors),
    errorGroups,
  }
}

async function processIw37nImportRows(
  pool: Pool,
  parsedRows: Iw37nImportRow[],
  opts: { dryRun: boolean; isDuplicate: boolean; duplicateOfBatchId: string | null },
): Promise<Iw37nImportRowResult[]> {
  const results: Iw37nImportRowResult[] = []
  const previewTag = opts.dryRun ? ' (ตรวจสอบก่อน commit)' : ''

  const duplicateNote = opts.isDuplicate
    ? ` (ไฟล์เคยนำเข้า batch #${opts.duplicateOfBatchId} — PHP อนุญาตนำเข้าซ้ำ)`
    : ''

  for (let idx = 0; idx < parsedRows.length; idx++) {
    const row = parsedRows[idx]!
    const rowNo = idx + 1
    if (!row.bscstart) {
      results.push({
        rowNo,
        action: 'error',
        wkorder: row.wkorder,
        opac: row.opac,
        mntplan: row.mntplan,
        wktype: row.wktype,
        mat: row.mat,
        syst: row.syst,
        message: `ผิดพลาด FALSE... วันที่ Bsc start ไม่ถูกต้อง${previewTag}`,
      })
      continue
    }
    try {
      const kind = opts.dryRun ? await wouldUpsertIw37Row(pool, row) : await upsertIw37Row(pool, row)
      if (kind === 'inserted') {
        results.push({
          rowNo,
          action: 'inserted',
          wkorder: row.wkorder,
          opac: row.opac,
          mntplan: row.mntplan,
          wktype: row.wktype,
          mat: row.mat,
          syst: row.syst,
          message: opts.dryRun
            ? `Would insert${previewTag}${duplicateNote}`
            : `New Success...${duplicateNote}`,
        })
      } else {
        results.push({
          rowNo,
          action: 'updated',
          wkorder: row.wkorder,
          opac: row.opac,
          mntplan: row.mntplan,
          wktype: row.wktype,
          mat: row.mat,
          syst: row.syst,
          message: opts.dryRun
            ? `Would update${previewTag}${duplicateNote}`
            : `Update Success...${duplicateNote}`,
        })
      }
    } catch (err) {
      results.push({
        rowNo,
        action: 'error',
        wkorder: row.wkorder,
        opac: row.opac,
        mntplan: row.mntplan,
        wktype: row.wktype,
        mat: row.mat,
        syst: row.syst,
        message: `${err instanceof Error ? err.message : 'Error'}${previewTag}`,
      })
    }
  }
  return results
}

/** ตรวจสอบก่อน commit — ไม่เขียน tbiw37n / batch */
export async function previewIw37nFile(
  pool: Pool,
  fileName: string,
  buffer: Buffer,
): Promise<{ summary: Iw37nImportSummary; rows: Iw37nImportRowResult[] }> {
  const sha256 = createHash('sha256').update(buffer).digest('hex')
  const { rows: parsedRows } = parseIw37nFileWithMeta(buffer, fileName)
  const duplicateOfBatchId = await findEarliestBatchIdBySha256(pool, sha256)
  const isDuplicate = Boolean(duplicateOfBatchId)
  const results = await processIw37nImportRows(pool, parsedRows, {
    dryRun: true,
    isDuplicate,
    duplicateOfBatchId,
  })
  return {
    summary: buildImportSummary(fileName, sha256, results, isDuplicate, duplicateOfBatchId),
    rows: results,
  }
}

export async function importIw37nFile(
  pool: Pool,
  fileName: string,
  buffer: Buffer,
  opts?: { source?: Iw37nImportSource },
): Promise<{ batch: BatchItem; rows: Iw37nImportRowResult[] }> {
  const source = opts?.source ?? 'manual'
  const sha256 = createHash('sha256').update(buffer).digest('hex')
  const { rows: parsedRows } = parseIw37nFileWithMeta(buffer, fileName)

  const duplicateOfBatchId = await findEarliestBatchIdBySha256(pool, sha256)
  const isDuplicate = Boolean(duplicateOfBatchId)

  const results = await processIw37nImportRows(pool, parsedRows, {
    dryRun: false,
    isDuplicate,
    duplicateOfBatchId,
  })

  const summary = buildImportSummary(fileName, sha256, results, isDuplicate, duplicateOfBatchId)
  const status = summary.wouldStatus

  const ins = await pool.query<BatchRow & { id_raw: number }>(
    `INSERT INTO app.tbiw37n_import_batch (
       file_name, sha256, row_count, inserted_count, updated_count, skipped_count, status, source
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id::bigint AS id_raw, id::text, file_name, imported_at, row_count, sha256, status`,
    [
      fileName,
      sha256,
      summary.totalRows,
      summary.inserted,
      summary.updated,
      summary.skipped,
      status,
      source,
    ],
  )

  const insertedBatch = ins.rows[0]!
  await insertImportRows(pool, Number(insertedBatch.id_raw), results)
  return {
    batch: mapBatch({
      ...insertedBatch,
      is_duplicate: isDuplicate,
      duplicate_of_batch_id: isDuplicate ? duplicateOfBatchId : null,
    }),
    rows: results,
  }
}
