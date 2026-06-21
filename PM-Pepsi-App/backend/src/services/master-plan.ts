import type { Pool, PoolClient } from 'pg'
import {
  applyFillDownDisplay,
  displayColumnsForSheet,
} from '../lib/master-plan-display.js'
import {
  buildMasterPlanWorkbookBuffer,
  type MasterPlanExportWorkbook,
} from '../lib/master-plan-export.js'
import {
  diffMasterPlanWorkbooks,
} from '../lib/master-plan-import-diff.js'
import { validateMasterPlanCellPatch } from '../lib/master-plan-patch.js'
import {
  parseMasterPlanWorkbook,
  type MasterPlanDiscipline,
  type ParsedMasterPlanWorkbook,
} from '../lib/master-plan-parse.js'
import { validateParsedMasterPlanImport } from '../lib/master-plan-discipline-guard.js'
import {
  extractMasterPlanLinkKeys,
  resolvePmMeasurementSuggestions,
} from '../lib/master-plan-row-links.js'
import { detailSheetRowsToTasklist } from '../lib/master-plan-tasklist.js'
import { buildMasterPlanSearchLabel, escapeIlikePattern } from '../lib/master-plan-search.js'
import { auditLogFromRequest } from '../lib/audit-log.js'
import { importTasklists } from './master-data.js'
import type { Request } from 'express'
import type {
  MasterPlanChangeItem,
  MasterPlanImportDiff,
  MasterPlanPatchRowBody,
  MasterPlanRowLinksResponse,
  MasterPlanSheetRowsResponse,
  MasterPlanStatusResponse,
  MasterPlanWorkbookResponse,
} from '../schemas/master-plan.js'

const PLAN_YEAR = 2026

type WorkbookRow = {
  id: number
  discipline: string
  plan_year: number
  source_filename: string
  version_no: number
}

type SheetRow = {
  id: number
  workbook_id: number
  sheet_name: string
  sort_order: number
  title_rows_json: unknown
  column_headers_json: unknown
  header_row_index: number | null
  sheet_kind: string
  row_count: string
}

async function deleteWorkbooksByStatus(
  client: PoolClient,
  discipline: MasterPlanDiscipline,
  planYear: number,
  status: 'draft' | 'published',
): Promise<void> {
  await client.query(
    `DELETE FROM app.tb_master_plan_workbook
     WHERE discipline = $1 AND plan_year = $2 AND status = $3`,
    [discipline, planYear, status],
  )
}

async function insertMasterPlanWorkbook(
  client: PoolClient,
  parsed: ParsedMasterPlanWorkbook,
  opts: { versionNo: number; status: 'draft' | 'published'; actorId?: string },
): Promise<{ workbookId: number; rowCount: number }> {
  const wbRes = await client.query<{ id: number }>(
    `INSERT INTO app.tb_master_plan_workbook
       (discipline, plan_year, source_filename, version_no, status, imported_by)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [parsed.discipline, PLAN_YEAR, parsed.sourceFilename, opts.versionNo, opts.status, opts.actorId ?? null],
  )
  const workbookId = wbRes.rows[0]?.id
  if (!workbookId) throw new Error('Failed to insert master plan workbook')

  let totalRows = 0
  for (const sheet of parsed.sheets) {
    const sheetRes = await client.query<{ id: number }>(
      `INSERT INTO app.tb_master_plan_sheet
         (workbook_id, sheet_name, sort_order, title_rows_json, column_headers_json,
          header_row_index, sheet_kind)
       VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6, $7)
       RETURNING id`,
      [
        workbookId,
        sheet.sheetName,
        sheet.sortOrder,
        JSON.stringify(sheet.titleRows),
        JSON.stringify(sheet.columnHeaders),
        sheet.headerRowIndex,
        sheet.sheetKind,
      ],
    )
    const sheetId = sheetRes.rows[0]?.id
    if (!sheetId) throw new Error(`Failed to insert sheet ${sheet.sheetName}`)

    for (const row of sheet.rows) {
      await client.query(
        `INSERT INTO app.tb_master_plan_row (sheet_id, row_index, cells_json)
         VALUES ($1, $2, $3::jsonb)`,
        [sheetId, row.rowIndex, JSON.stringify(row.cells)],
      )
      totalRows++
    }
  }

  return { workbookId, rowCount: totalRows }
}

export async function seedMasterPlanWorkbook(
  pool: Pool,
  parsed: ParsedMasterPlanWorkbook,
  actorId?: string,
): Promise<{ workbookId: number; rowCount: number }> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await deleteWorkbooksByStatus(client, parsed.discipline, PLAN_YEAR, 'published')

    const result = await insertMasterPlanWorkbook(client, parsed, {
      versionNo: 1,
      status: 'published',
      actorId,
    })

    await client.query('COMMIT')
    return result
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

export async function getPublishedWorkbook(
  pool: Pool,
  discipline: MasterPlanDiscipline,
): Promise<MasterPlanWorkbookResponse | null> {
  const wbRes = await pool.query<WorkbookRow>(
    `SELECT id, discipline, plan_year, source_filename, version_no
     FROM app.tb_master_plan_workbook
     WHERE discipline = $1 AND plan_year = $2 AND status = 'published'
     ORDER BY version_no DESC
     LIMIT 1`,
    [discipline, PLAN_YEAR],
  )
  const wb = wbRes.rows[0]
  if (!wb) return null

  const sheetsRes = await pool.query<SheetRow>(
    `SELECT s.id, s.workbook_id, s.sheet_name, s.sort_order, s.title_rows_json,
            s.column_headers_json, s.header_row_index, s.sheet_kind,
            COUNT(r.id)::text AS row_count
     FROM app.tb_master_plan_sheet s
     LEFT JOIN app.tb_master_plan_row r ON r.sheet_id = s.id
     WHERE s.workbook_id = $1
     GROUP BY s.id
     ORDER BY s.sort_order ASC`,
    [wb.id],
  )

  return {
    discipline: discipline as MasterPlanDiscipline,
    planYear: wb.plan_year,
    sourceFilename: wb.source_filename,
    versionNo: wb.version_no,
    sheets: sheetsRes.rows.map((s) => ({
      id: s.id,
      sheetName: s.sheet_name,
      sortOrder: s.sort_order,
      sheetKind: s.sheet_kind as MasterPlanWorkbookResponse['sheets'][0]['sheetKind'],
      rowCount: Number(s.row_count),
    })),
  }
}

/** Draft (latest import) if present, otherwise published — for UI grid. */
export async function getActiveWorkbook(
  pool: Pool,
  discipline: MasterPlanDiscipline,
): Promise<MasterPlanWorkbookResponse | null> {
  for (const status of ['draft', 'published'] as const) {
    const wbRes = await pool.query<WorkbookRow>(
      `SELECT id, discipline, plan_year, source_filename, version_no
       FROM app.tb_master_plan_workbook
       WHERE discipline = $1 AND plan_year = $2 AND status = $3
       ORDER BY version_no DESC
       LIMIT 1`,
      [discipline, PLAN_YEAR, status],
    )
    const wb = wbRes.rows[0]
    if (!wb) continue

    const sheetsRes = await pool.query<SheetRow>(
      `SELECT s.id, s.workbook_id, s.sheet_name, s.sort_order, s.title_rows_json,
              s.column_headers_json, s.header_row_index, s.sheet_kind,
              COUNT(r.id)::text AS row_count
       FROM app.tb_master_plan_sheet s
       LEFT JOIN app.tb_master_plan_row r ON r.sheet_id = s.id
       WHERE s.workbook_id = $1
       GROUP BY s.id
       ORDER BY s.sort_order ASC`,
      [wb.id],
    )

    return {
      discipline: discipline as MasterPlanDiscipline,
      planYear: wb.plan_year,
      sourceFilename: wb.source_filename,
      versionNo: wb.version_no,
      sheets: sheetsRes.rows.map((s) => ({
        id: s.id,
        sheetName: s.sheet_name,
        sortOrder: s.sort_order,
        sheetKind: s.sheet_kind as MasterPlanWorkbookResponse['sheets'][0]['sheetKind'],
        rowCount: Number(s.row_count),
      })),
    }
  }
  return null
}

export async function getSheetRows(
  pool: Pool,
  sheetId: number,
  offset: number,
  limit: number,
): Promise<MasterPlanSheetRowsResponse | null> {
  const sheetRes = await pool.query<{
    id: number
    sheet_name: string
    sheet_kind: string
    title_rows_json: string[][]
    column_headers_json: string[]
  }>(
    `SELECT id, sheet_name, sheet_kind, title_rows_json, column_headers_json
     FROM app.tb_master_plan_sheet
     WHERE id = $1`,
    [sheetId],
  )
  const sheet = sheetRes.rows[0]
  if (!sheet) return null

  const countRes = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM app.tb_master_plan_row WHERE sheet_id = $1`,
    [sheetId],
  )
  const total = Number(countRes.rows[0]?.count ?? 0)

  const rowsRes = await pool.query<{ id: number; row_index: number; cells_json: Record<string, string> }>(
    `SELECT id, row_index, cells_json
     FROM app.tb_master_plan_row
     WHERE sheet_id = $1
     ORDER BY row_index ASC
     OFFSET $2 LIMIT $3`,
    [sheetId, offset, limit],
  )

  const columnHeaders = Array.isArray(sheet.column_headers_json) ? sheet.column_headers_json : []
  const rawRows = rowsRes.rows.map((r) => ({
    id: Number(r.id),
    rowIndex: r.row_index,
    cells: r.cells_json ?? {},
  }))
  const displayColumns = displayColumnsForSheet(sheet.sheet_kind, columnHeaders, rawRows)
  const withDisplay = applyFillDownDisplay(
    rawRows.map(({ rowIndex, cells }) => ({ rowIndex, cells })),
    columnHeaders,
  )

  return {
    sheetId: sheet.id,
    sheetName: sheet.sheet_name,
    sheetKind: sheet.sheet_kind as MasterPlanSheetRowsResponse['sheetKind'],
    titleRows: Array.isArray(sheet.title_rows_json) ? sheet.title_rows_json : [],
    columnHeaders,
    displayColumns,
    total,
    offset,
    limit,
    rows: withDisplay.map((r, i) => ({
      id: rawRows[i]?.id ?? 0,
      rowIndex: r.rowIndex,
      cells: r.cells,
      display: r.display,
    })),
  }
}

export async function searchMasterPlanRows(
  pool: Pool,
  discipline: MasterPlanDiscipline,
  query: string,
  limit = 50,
): Promise<{
  query: string
  items: Array<{
    rowId: number
    rowIndex: number
    sheetId: number
    sheetName: string
    label: string
  }>
}> {
  const q = query.trim()
  if (!q) return { query: '', items: [] }

  const wb = await getPublishedWorkbook(pool, discipline)
  if (!wb) return { query: q, items: [] }

  const safeLimit = Math.min(100, Math.max(1, limit))
  const pattern = `%${escapeIlikePattern(q)}%`

  const rowsRes = await pool.query<{
    row_id: number
    row_index: number
    sheet_id: number
    sheet_name: string
    column_headers_json: string[]
    cells_json: Record<string, string>
  }>(
    `SELECT r.id AS row_id, r.row_index, s.id AS sheet_id, s.sheet_name,
            s.column_headers_json, r.cells_json
     FROM app.tb_master_plan_row r
     INNER JOIN app.tb_master_plan_sheet s ON s.id = r.sheet_id
     INNER JOIN app.tb_master_plan_workbook w ON w.id = s.workbook_id
     WHERE w.discipline = $1 AND w.plan_year = $2 AND w.status = 'published'
       AND (
         s.sheet_name ILIKE $3 ESCAPE '\\'
         OR EXISTS (
           SELECT 1 FROM jsonb_each_text(r.cells_json) kv
           WHERE kv.value ILIKE $3 ESCAPE '\\'
         )
       )
     ORDER BY s.sort_order ASC, r.row_index ASC
     LIMIT $4`,
    [discipline, PLAN_YEAR, pattern, safeLimit],
  )

  const items = rowsRes.rows.map((row) => {
    const columnHeaders = Array.isArray(row.column_headers_json) ? row.column_headers_json : []
    const cells = row.cells_json ?? {}
    const withDisplay = applyFillDownDisplay(
      [{ rowIndex: row.row_index, cells }],
      columnHeaders,
    )
    const display = withDisplay[0]?.display ?? cells
    return {
      rowId: Number(row.row_id),
      rowIndex: row.row_index,
      sheetId: Number(row.sheet_id),
      sheetName: row.sheet_name,
      label: buildMasterPlanSearchLabel(columnHeaders, cells, display),
    }
  })

  return { query: q, items }
}

export async function sheetBelongsToDiscipline(
  pool: Pool,
  sheetId: number,
  discipline: MasterPlanDiscipline,
): Promise<boolean> {
  const res = await pool.query<{ ok: boolean }>(
    `SELECT EXISTS (
       SELECT 1
       FROM app.tb_master_plan_sheet s
       JOIN app.tb_master_plan_workbook w ON w.id = s.workbook_id
       WHERE s.id = $1 AND w.discipline = $2 AND w.status IN ('draft', 'published')
     ) AS ok`,
    [sheetId, discipline],
  )
  return res.rows[0]?.ok === true
}

type RowEditContext = {
  rowId: number
  sheetId: number
  rowIndex: number
  cells: Record<string, string>
  sheetKind: string
  columnHeaders: string[]
  sheetName: string
  discipline: MasterPlanDiscipline
}

async function getRowEditContext(
  client: PoolClient,
  rowId: number,
): Promise<RowEditContext | null> {
  const res = await client.query<{
    row_id: number
    sheet_id: number
    row_index: number
    cells_json: Record<string, string>
    sheet_kind: string
    column_headers_json: string[]
    sheet_name: string
    discipline: string
    status: string
  }>(
    `SELECT r.id AS row_id, r.sheet_id, r.row_index, r.cells_json,
            s.sheet_kind, s.column_headers_json, s.sheet_name,
            w.discipline, w.status
     FROM app.tb_master_plan_row r
     JOIN app.tb_master_plan_sheet s ON s.id = r.sheet_id
     JOIN app.tb_master_plan_workbook w ON w.id = s.workbook_id
     WHERE r.id = $1
     FOR UPDATE OF r`,
    [rowId],
  )
  const row = res.rows[0]
  if (!row || row.status !== 'published') return null
  const columnHeaders = Array.isArray(row.column_headers_json) ? row.column_headers_json : []
  return {
    rowId: Number(row.row_id),
    sheetId: Number(row.sheet_id),
    rowIndex: Number(row.row_index),
    cells: row.cells_json ?? {},
    sheetKind: row.sheet_kind,
    columnHeaders,
    sheetName: row.sheet_name,
    discipline: row.discipline as MasterPlanDiscipline,
  }
}

function mapChangeRow(row: {
  id: number
  row_id: number
  sheet_id: number
  sheet_name: string | null
  row_index: number | null
  change_type: string
  field_name: string | null
  before_json: unknown
  after_json: unknown
  changed_by: string
  changed_at: Date
  comment: string | null
}): MasterPlanChangeItem {
  return {
    id: Number(row.id),
    rowId: Number(row.row_id),
    sheetId: Number(row.sheet_id),
    sheetName: row.sheet_name ?? undefined,
    rowIndex: row.row_index != null ? Number(row.row_index) : undefined,
    changeType: row.change_type as MasterPlanChangeItem['changeType'],
    fieldName: row.field_name,
    before: row.before_json ?? null,
    after: row.after_json ?? null,
    changedBy: row.changed_by,
    changedAt: row.changed_at.toISOString(),
    comment: row.comment,
  }
}

export type PatchMasterPlanRowResult =
  | {
      ok: true
      rowId: number
      sheetId: number
      cells: Record<string, string>
      changedFields: string[]
    }
  | { ok: false; status: number; code: string; message: string }

export async function patchMasterPlanRow(
  pool: Pool,
  rowId: number,
  body: MasterPlanPatchRowBody,
  actorId: string,
  req: Request,
): Promise<PatchMasterPlanRowResult> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const ctx = await getRowEditContext(client, rowId)
    if (!ctx) {
      await client.query('ROLLBACK')
      return { ok: false, status: 404, code: 'NOT_FOUND', message: 'Row not found' }
    }

    const validation = validateMasterPlanCellPatch(
      ctx.sheetKind,
      ctx.columnHeaders,
      ctx.cells,
      body.cells,
    )
    if (!validation.ok) {
      await client.query('ROLLBACK')
      const status = validation.code === 'SHEET_READ_ONLY' ? 403 : 400
      return { ok: false, status, code: validation.code, message: validation.message }
    }
    if (validation.changes.length === 0) {
      await client.query('ROLLBACK')
      return {
        ok: true,
        rowId: ctx.rowId,
        sheetId: ctx.sheetId,
        cells: ctx.cells,
        changedFields: [],
      }
    }

    const nextCells = { ...ctx.cells }
    for (const change of validation.changes) {
      nextCells[change.fieldName] = change.after
    }

    await client.query(
      `UPDATE app.tb_master_plan_row SET cells_json = $2::jsonb WHERE id = $1`,
      [ctx.rowId, JSON.stringify(nextCells)],
    )

    for (const change of validation.changes) {
      await client.query(
        `INSERT INTO app.tb_master_plan_change
           (row_id, sheet_id, change_type, field_name, before_json, after_json, changed_by, comment)
         VALUES ($1, $2, 'update', $3, $4::jsonb, $5::jsonb, $6, $7)`,
        [
          ctx.rowId,
          ctx.sheetId,
          change.fieldName,
          JSON.stringify({ value: change.before }),
          JSON.stringify({ value: change.after }),
          actorId,
          body.comment ?? null,
        ],
      )
    }

    await auditLogFromRequest(pool, req, {
      action: 'master-plan.update',
      resource: 'master-plan-row',
      resourceId: String(ctx.rowId),
      before: { cells: ctx.cells, sheetId: ctx.sheetId },
      after: {
        cells: nextCells,
        sheetId: ctx.sheetId,
        changedFields: validation.changes.map((c) => c.fieldName),
      },
      message: body.comment ?? null,
    })

    await client.query('COMMIT')
    return {
      ok: true,
      rowId: ctx.rowId,
      sheetId: ctx.sheetId,
      cells: nextCells,
      changedFields: validation.changes.map((c) => c.fieldName),
    }
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

export type ListMasterPlanChangesInput = {
  discipline?: MasterPlanDiscipline
  sheetId?: number
  from?: string
  to?: string
  changedBy?: string
  fieldName?: string
  limit: number
}

export async function listMasterPlanChanges(
  pool: Pool,
  input: ListMasterPlanChangesInput,
): Promise<{ items: MasterPlanChangeItem[]; total: number; limit: number }> {
  const conditions: string[] = ['w.status = $1']
  const params: unknown[] = ['published']
  let paramIdx = 2

  if (input.discipline) {
    conditions.push(`w.discipline = $${paramIdx++}`)
    params.push(input.discipline)
  }
  if (input.sheetId) {
    conditions.push(`c.sheet_id = $${paramIdx++}`)
    params.push(input.sheetId)
  }
  if (input.from) {
    conditions.push(`c.changed_at >= $${paramIdx++}::timestamptz`)
    params.push(input.from)
  }
  if (input.to) {
    conditions.push(`c.changed_at <= $${paramIdx++}::timestamptz`)
    params.push(input.to)
  }
  if (input.changedBy?.trim()) {
    conditions.push(`c.changed_by ILIKE $${paramIdx++}`)
    params.push(`%${input.changedBy.trim()}%`)
  }
  if (input.fieldName?.trim()) {
    conditions.push(`c.field_name ILIKE $${paramIdx++}`)
    params.push(`%${input.fieldName.trim()}%`)
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const countRes = await pool.query<{ total: string }>(
    `SELECT COUNT(*)::text AS total
     FROM app.tb_master_plan_change c
     JOIN app.tb_master_plan_sheet s ON s.id = c.sheet_id
     JOIN app.tb_master_plan_workbook w ON w.id = s.workbook_id
     ${where}`,
    params,
  )
  const total = Number(countRes.rows[0]?.total ?? 0)

  const listRes = await pool.query<{
    id: number
    row_id: number
    sheet_id: number
    sheet_name: string
    row_index: number
    change_type: string
    field_name: string | null
    before_json: unknown
    after_json: unknown
    changed_by: string
    changed_at: Date
    comment: string | null
  }>(
    `SELECT c.id, c.row_id, c.sheet_id, s.sheet_name, r.row_index,
            c.change_type, c.field_name, c.before_json, c.after_json,
            c.changed_by, c.changed_at, c.comment
     FROM app.tb_master_plan_change c
     JOIN app.tb_master_plan_sheet s ON s.id = c.sheet_id
     JOIN app.tb_master_plan_row r ON r.id = c.row_id
     JOIN app.tb_master_plan_workbook w ON w.id = s.workbook_id
     ${where}
     ORDER BY c.changed_at DESC, c.id DESC
     LIMIT $${paramIdx}`,
    [...params, input.limit],
  )

  return {
    items: listRes.rows.map(mapChangeRow),
    total,
    limit: input.limit,
  }
}

export async function listMasterPlanRowChanges(
  pool: Pool,
  rowId: number,
  limit: number,
): Promise<{ items: MasterPlanChangeItem[]; total: number; limit: number } | null> {
  const exists = await pool.query<{ ok: boolean }>(
    `SELECT EXISTS (SELECT 1 FROM app.tb_master_plan_row WHERE id = $1) AS ok`,
    [rowId],
  )
  if (!exists.rows[0]?.ok) return null

  const countRes = await pool.query<{ total: string }>(
    `SELECT COUNT(*)::text AS total FROM app.tb_master_plan_change WHERE row_id = $1`,
    [rowId],
  )
  const total = Number(countRes.rows[0]?.total ?? 0)

  const listRes = await pool.query<{
    id: number
    row_id: number
    sheet_id: number
    sheet_name: string
    row_index: number
    change_type: string
    field_name: string | null
    before_json: unknown
    after_json: unknown
    changed_by: string
    changed_at: Date
    comment: string | null
  }>(
    `SELECT c.id, c.row_id, c.sheet_id, s.sheet_name, r.row_index,
            c.change_type, c.field_name, c.before_json, c.after_json,
            c.changed_by, c.changed_at, c.comment
     FROM app.tb_master_plan_change c
     JOIN app.tb_master_plan_sheet s ON s.id = c.sheet_id
     JOIN app.tb_master_plan_row r ON r.id = c.row_id
     WHERE c.row_id = $1
     ORDER BY c.changed_at DESC, c.id DESC
     LIMIT $2`,
    [rowId, limit],
  )

  return {
    items: listRes.rows.map(mapChangeRow),
    total,
    limit,
  }
}

async function getRowLinkContext(
  pool: Pool,
  rowId: number,
): Promise<{
  rowId: number
  sheetId: number
  sheetName: string
  rowIndex: number
  sheetKind: string
  columnHeaders: string[]
  cells: Record<string, string>
  display: Record<string, string>
  discipline: MasterPlanDiscipline
} | null> {
  const res = await pool.query<{
    row_id: number
    sheet_id: number
    row_index: number
    cells_json: Record<string, string>
    sheet_kind: string
    column_headers_json: string[]
    sheet_name: string
    discipline: string
    status: string
  }>(
    `SELECT r.id AS row_id, r.sheet_id, r.row_index, r.cells_json,
            s.sheet_kind, s.column_headers_json, s.sheet_name,
            w.discipline, w.status
     FROM app.tb_master_plan_row r
     JOIN app.tb_master_plan_sheet s ON s.id = r.sheet_id
     JOIN app.tb_master_plan_workbook w ON w.id = s.workbook_id
     WHERE r.id = $1`,
    [rowId],
  )
  const row = res.rows[0]
  if (!row || row.status !== 'published') return null
  const columnHeaders = Array.isArray(row.column_headers_json) ? row.column_headers_json : []
  const cells = row.cells_json ?? {}
  const [displayRow] = applyFillDownDisplay(
    [{ rowIndex: row.row_index, cells }],
    columnHeaders,
  )
  const display = displayRow?.display ?? cells
  return {
    rowId: Number(row.row_id),
    sheetId: Number(row.sheet_id),
    sheetName: row.sheet_name,
    rowIndex: Number(row.row_index),
    sheetKind: row.sheet_kind,
    columnHeaders,
    cells,
    display,
    discipline: row.discipline as MasterPlanDiscipline,
  }
}

export async function getMasterPlanRowLinks(
  pool: Pool,
  rowId: number,
): Promise<MasterPlanRowLinksResponse | null> {
  const ctx = await getRowLinkContext(pool, rowId)
  if (!ctx) return null

  const keys = extractMasterPlanLinkKeys(ctx.columnHeaders, ctx.cells, ctx.display)
  const mntplan = keys.mntplan.trim()
  const machine = keys.machine.trim()
  const zone = keys.zone.trim()
  const pmlist = keys.pmlist.trim()
  const mpoint = keys.mpoint.trim()

  let iw37nCount = 0
  let iw37nWkOrders: string[] = []
  if (mntplan) {
    const iw = await pool.query<{ cnt: string; wkorders: string[] | null }>(
      `SELECT COUNT(*)::text AS cnt,
              (ARRAY_AGG(DISTINCT TRIM(wkorder) ORDER BY TRIM(wkorder))
               FILTER (WHERE NULLIF(TRIM(wkorder), '') IS NOT NULL))[1:5] AS wkorders
       FROM app.tbiw37n
       WHERE TRIM(mntplan) = $1`,
      [mntplan],
    )
    iw37nCount = Number(iw.rows[0]?.cnt ?? 0)
    iw37nWkOrders = iw.rows[0]?.wkorders ?? []
  }

  let tasklistCount = 0
  if (mntplan) {
    const tl = await pool.query<{ cnt: string }>(
      `SELECT COUNT(*)::text AS cnt FROM app.tbtasklist WHERE TRIM(mntplan) = $1`,
      [mntplan],
    )
    tasklistCount = Number(tl.rows[0]?.cnt ?? 0)
  } else if (zone && machine && pmlist) {
    const tl = await pool.query<{ cnt: string }>(
      `SELECT COUNT(*)::text AS cnt
       FROM app.tbtasklist
       WHERE TRIM(idzone) ILIKE $1 AND TRIM(machine) ILIKE $2 AND TRIM(pmlist) ILIKE $3`,
      [zone, machine, pmlist],
    )
    tasklistCount = Number(tl.rows[0]?.cnt ?? 0)
  }

  let equipmentCount = 0
  let equipmentCodes: string[] = []
  if (machine) {
    const eq = await pool.query<{ cnt: string; codes: string[] | null }>(
      `SELECT COUNT(*)::text AS cnt,
              (ARRAY_AGG(equipment ORDER BY equipment))[1:5] AS codes
       FROM app.tbequipment
       WHERE equipment ILIKE $1 OR equdescrip ILIKE $1`,
      [`%${machine}%`],
    )
    equipmentCount = Number(eq.rows[0]?.cnt ?? 0)
    equipmentCodes = eq.rows[0]?.codes ?? []
  }

  let zoneCount = 0
  let zoneCodes: string[] = []
  if (zone) {
    const zn = await pool.query<{ cnt: string; codes: string[] | null }>(
      `SELECT COUNT(*)::text AS cnt,
              (ARRAY_AGG(idzone ORDER BY idzone))[1:5] AS codes
       FROM app.tbzone
       WHERE idzone ILIKE $1 OR zone ILIKE $1`,
      [`%${zone}%`],
    )
    zoneCount = Number(zn.rows[0]?.cnt ?? 0)
    zoneCodes = zn.rows[0]?.codes ?? []
  }

  const pmSuggestions = resolvePmMeasurementSuggestions({ pmlist, mpoint })

  return {
    rowId: ctx.rowId,
    sheetId: ctx.sheetId,
    sheetName: ctx.sheetName,
    rowIndex: ctx.rowIndex,
    discipline: ctx.discipline,
    keys,
    iw37n: { count: iw37nCount, wkOrders: iw37nWkOrders },
    workOrders: { count: iw37nCount, wkOrders: iw37nWkOrders },
    tasklist: { count: tasklistCount, mntplan: mntplan || undefined },
    equipment: { count: equipmentCount, equipment: equipmentCodes },
    zone: { count: zoneCount, zones: zoneCodes },
    pmMeasurements: {
      current3Phase: {
        suggested: pmSuggestions.current3Phase,
        pmlist: pmlist || undefined,
      },
      vibrationDstDb: {
        suggested: pmSuggestions.vibrationDstDb,
        pmlist: pmlist || undefined,
      },
    },
  }
}

type WorkbookMeta = {
  id: number
  discipline: MasterPlanDiscipline
  plan_year: number
  source_filename: string
  version_no: number
  status: string
  imported_at: Date
}

async function getWorkbookMeta(
  pool: Pool,
  discipline: MasterPlanDiscipline,
  status: 'draft' | 'published',
): Promise<WorkbookMeta | null> {
  const res = await pool.query<WorkbookMeta>(
    `SELECT id, discipline, plan_year, source_filename, version_no, status, imported_at
     FROM app.tb_master_plan_workbook
     WHERE discipline = $1 AND plan_year = $2 AND status = $3
     ORDER BY version_no DESC
     LIMIT 1`,
    [discipline, PLAN_YEAR, status],
  )
  const row = res.rows[0]
  if (!row) return null
  return { ...row, discipline: row.discipline as MasterPlanDiscipline }
}

async function loadWorkbookParsed(pool: Pool, workbookId: number): Promise<ParsedMasterPlanWorkbook | null> {
  const wbRes = await pool.query<WorkbookMeta>(
    `SELECT id, discipline, plan_year, source_filename, version_no, status, imported_at
     FROM app.tb_master_plan_workbook WHERE id = $1`,
    [workbookId],
  )
  const wb = wbRes.rows[0]
  if (!wb) return null

  const sheetsRes = await pool.query<{
    sheet_name: string
    sort_order: number
    title_rows_json: string[][]
    column_headers_json: string[]
    header_row_index: number | null
    sheet_kind: string
    sheet_id: number
  }>(
    `SELECT id AS sheet_id, sheet_name, sort_order, title_rows_json, column_headers_json,
            header_row_index, sheet_kind
     FROM app.tb_master_plan_sheet
     WHERE workbook_id = $1
     ORDER BY sort_order ASC`,
    [workbookId],
  )

  const sheets: ParsedMasterPlanWorkbook['sheets'] = []
  for (const s of sheetsRes.rows) {
    const rowsRes = await pool.query<{ row_index: number; cells_json: Record<string, string> }>(
      `SELECT row_index, cells_json FROM app.tb_master_plan_row
       WHERE sheet_id = $1 ORDER BY row_index ASC`,
      [s.sheet_id],
    )
    sheets.push({
      sheetName: s.sheet_name,
      sortOrder: s.sort_order,
      titleRows: Array.isArray(s.title_rows_json) ? s.title_rows_json : [],
      columnHeaders: Array.isArray(s.column_headers_json) ? s.column_headers_json : [],
      headerRowIndex: s.header_row_index,
      sheetKind: s.sheet_kind as ParsedMasterPlanWorkbook['sheets'][0]['sheetKind'],
      rows: rowsRes.rows.map((r) => ({ rowIndex: r.row_index, cells: r.cells_json ?? {} })),
    })
  }

  return {
    discipline: wb.discipline as MasterPlanDiscipline,
    sourceFilename: wb.source_filename,
    sheets,
  }
}

async function loadWorkbookExport(pool: Pool, workbookId: number): Promise<MasterPlanExportWorkbook | null> {
  const parsed = await loadWorkbookParsed(pool, workbookId)
  if (!parsed) return null
  return {
    sourceFilename: parsed.sourceFilename,
    sheets: parsed.sheets.map((s) => ({
      sheetName: s.sheetName,
      sortOrder: s.sortOrder,
      titleRows: s.titleRows,
      columnHeaders: s.columnHeaders,
      headerRowIndex: s.headerRowIndex,
      sheetKind: s.sheetKind,
      rows: s.rows.map((r) => ({ rowIndex: r.rowIndex, cells: r.cells })),
    })),
  }
}

export async function getMasterPlanStatus(
  pool: Pool,
  discipline: MasterPlanDiscipline,
): Promise<MasterPlanStatusResponse> {
  const published = await getWorkbookMeta(pool, discipline, 'published')
  const draft = await getWorkbookMeta(pool, discipline, 'draft')

  let tasklistSync: MasterPlanStatusResponse['tasklistSync'] = 'unknown'
  let tasklistPublishableRows = 0
  let tasklistMatchedRows = 0

  if (draft) {
    tasklistSync = 'diverged'
  } else if (published) {
    const parsed = await loadWorkbookParsed(pool, published.id)
    if (parsed) {
      for (const sheet of parsed.sheets) {
        if (sheet.sheetKind !== 'detail') continue
        const { rows } = detailSheetRowsToTasklist(sheet.columnHeaders, sheet.rows, discipline)
        tasklistPublishableRows += rows.length
      }
    }

    const lastPublish = await pool.query<{ cnt: string }>(
      `SELECT COUNT(*)::text AS cnt
       FROM app.tb_master_plan_change c
       JOIN app.tb_master_plan_sheet s ON s.id = c.sheet_id
       JOIN app.tb_master_plan_workbook w ON w.id = s.workbook_id
       WHERE w.discipline = $1 AND c.change_type = 'publish'`,
      [discipline],
    )
    const hasPublishLog = Number(lastPublish.rows[0]?.cnt ?? 0) > 0
    tasklistMatchedRows = tasklistPublishableRows
    tasklistSync = hasPublishLog ? 'in_sync' : 'never_published'
  }

  return {
    discipline,
    planYear: PLAN_YEAR,
    published: published
      ? {
          versionNo: published.version_no,
          sourceFilename: published.source_filename,
          importedAt: published.imported_at.toISOString(),
        }
      : null,
    draft: draft
      ? {
          versionNo: draft.version_no,
          sourceFilename: draft.source_filename,
          importedAt: draft.imported_at.toISOString(),
        }
      : null,
    tasklistSync,
    tasklistPublishableRows,
    tasklistMatchedRows,
  }
}

export type ImportMasterPlanResult =
  | {
      ok: true
      workbookId: number
      versionNo: number
      status: 'draft'
      rowCount: number
      diff: MasterPlanImportDiff
    }
  | { ok: false; code: string; message: string; diff?: MasterPlanImportDiff }

export async function importMasterPlanWorkbook(
  pool: Pool,
  buffer: Buffer,
  discipline: MasterPlanDiscipline,
  sourceFilename: string,
  actorId: string,
): Promise<ImportMasterPlanResult> {
  const imported = parseMasterPlanWorkbook(buffer, discipline, sourceFilename)
  const guard = validateParsedMasterPlanImport(discipline, imported)
  if (!guard.ok) {
    return { ok: false, code: guard.code, message: guard.message }
  }

  const publishedMeta = await getWorkbookMeta(pool, discipline, 'published')
  const publishedParsed = publishedMeta ? await loadWorkbookParsed(pool, publishedMeta.id) : null
  const diff = diffMasterPlanWorkbooks(publishedParsed, imported)

  if (publishedParsed && !diff.structure.ok) {
    return {
      ok: false,
      code: 'STRUCTURE_MISMATCH',
      message: 'Imported workbook sheet layout does not match published version',
      diff,
    }
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await deleteWorkbooksByStatus(client, discipline, PLAN_YEAR, 'draft')

    const versionRes = await client.query<{ max: string | null }>(
      `SELECT MAX(version_no)::text AS max FROM app.tb_master_plan_workbook
       WHERE discipline = $1 AND plan_year = $2`,
      [discipline, PLAN_YEAR],
    )
    const nextVersion = Number(versionRes.rows[0]?.max ?? 0) + 1

    const inserted = await insertMasterPlanWorkbook(client, imported, {
      versionNo: nextVersion,
      status: 'draft',
      actorId,
    })

    await client.query('COMMIT')
    return {
      ok: true,
      workbookId: inserted.workbookId,
      versionNo: nextVersion,
      status: 'draft',
      rowCount: inserted.rowCount,
      diff,
    }
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

export async function exportMasterPlanWorkbook(
  pool: Pool,
  discipline: MasterPlanDiscipline,
  status: 'draft' | 'published' = 'published',
): Promise<{ buffer: Buffer; filename: string } | null> {
  const meta = await getWorkbookMeta(pool, discipline, status)
  if (!meta) return null
  const exportData = await loadWorkbookExport(pool, meta.id)
  if (!exportData) return null
  return {
    buffer: buildMasterPlanWorkbookBuffer(exportData),
    filename: meta.source_filename,
  }
}

export type PublishMasterPlanResult =
  | {
      ok: true
      promotedDraft: boolean
      versionNo: number
      tasklist: { inserted: number; updated: number; skipped: number; failed: number }
      publishableRows: number
      skippedRows: number
    }
  | { ok: false; code: string; message: string }

export async function publishMasterPlanToTasklist(
  pool: Pool,
  discipline: MasterPlanDiscipline,
  actorId: string,
  req: Request,
): Promise<PublishMasterPlanResult> {
  let workbookId: number
  let versionNo: number
  let promotedDraft = false

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const draftRes = await client.query<WorkbookMeta>(
      `SELECT id, discipline, plan_year, source_filename, version_no, status, imported_at
       FROM app.tb_master_plan_workbook
       WHERE discipline = $1 AND plan_year = $2 AND status = 'draft'
       ORDER BY version_no DESC LIMIT 1`,
      [discipline, PLAN_YEAR],
    )
    const draft = draftRes.rows[0]

    if (draft) {
      await deleteWorkbooksByStatus(client, discipline, PLAN_YEAR, 'published')
      await client.query(
        `UPDATE app.tb_master_plan_workbook SET status = 'published', imported_by = $2
         WHERE id = $1`,
        [draft.id, actorId],
      )
      workbookId = draft.id
      versionNo = draft.version_no
      promotedDraft = true
    } else {
      const publishedRes = await client.query<WorkbookMeta>(
        `SELECT id, discipline, plan_year, source_filename, version_no, status, imported_at
         FROM app.tb_master_plan_workbook
         WHERE discipline = $1 AND plan_year = $2 AND status = 'published'
         ORDER BY version_no DESC LIMIT 1`,
        [discipline, PLAN_YEAR],
      )
      const published = publishedRes.rows[0]
      if (!published) {
        await client.query('ROLLBACK')
        return { ok: false, code: 'NOT_FOUND', message: 'No workbook to publish' }
      }
      workbookId = published.id
      versionNo = published.version_no
    }
    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }

  const parsed = await loadWorkbookParsed(pool, workbookId)
  if (!parsed) {
    return { ok: false, code: 'NOT_FOUND', message: 'Workbook data missing' }
  }

  const guard = validateParsedMasterPlanImport(discipline, parsed)
  if (!guard.ok) {
    return { ok: false, code: guard.code, message: guard.message }
  }

  const allTasklistRows: Parameters<typeof importTasklists>[1] = []
  let skippedRows = 0

  for (const sheet of parsed.sheets) {
    if (sheet.sheetKind !== 'detail') continue
    const { rows, skipped } = detailSheetRowsToTasklist(sheet.columnHeaders, sheet.rows, discipline)
    skippedRows += skipped
    allTasklistRows.push(...rows)
  }

  const tasklistResult = await importTasklists(pool, allTasklistRows)

  const sheetIdsRes = await pool.query<{ id: number }>(
    `SELECT id FROM app.tb_master_plan_sheet WHERE workbook_id = $1 AND sheet_kind = 'detail' LIMIT 1`,
    [workbookId],
  )
  const sampleSheetId = sheetIdsRes.rows[0]?.id
  if (sampleSheetId) {
    const sampleRow = await pool.query<{ id: number }>(
      `SELECT id FROM app.tb_master_plan_row WHERE sheet_id = $1 ORDER BY row_index ASC LIMIT 1`,
      [sampleSheetId],
    )
    const rowId = sampleRow.rows[0]?.id
    if (rowId) {
      await pool.query(
        `INSERT INTO app.tb_master_plan_change
           (row_id, sheet_id, change_type, field_name, before_json, after_json, changed_by, comment)
         VALUES ($1, $2, 'publish', NULL, NULL, $3::jsonb, $4, $5)`,
        [
          rowId,
          sampleSheetId,
          JSON.stringify({
            tasklistInserted: tasklistResult.inserted,
            tasklistUpdated: tasklistResult.updated,
            tasklistFailed: tasklistResult.failed,
            publishableRows: allTasklistRows.length,
          }),
          actorId,
          `Publish to tasklist (v${versionNo})`,
        ],
      )
    }
  }

  await auditLogFromRequest(pool, req, {
    action: 'master-plan.publish',
    resource: 'master-plan',
    resourceId: String(workbookId),
    after: {
      discipline,
      versionNo,
      promotedDraft,
      tasklist: tasklistResult,
      publishableRows: allTasklistRows.length,
    },
  })

  return {
    ok: true,
    promotedDraft,
    versionNo,
    tasklist: {
      inserted: tasklistResult.inserted,
      updated: tasklistResult.updated,
      skipped: tasklistResult.skipped,
      failed: tasklistResult.failed,
    },
    publishableRows: allTasklistRows.length,
    skippedRows,
  }
}
