import type { Pool, PoolClient } from 'pg'
import * as XLSX from 'xlsx'
import { pepsiWorkWeekSql } from '../lib/pepsi-work-week.js'
import type {
  ManhourImportResponse,
  ManhourItem,
  ManhourUpsertBody,
  WorktimeDailyItem,
} from '../schemas/manhours.js'
import { parseThaiDate } from './personnel-import.js'

export type WorktimeBreakdown = {
  wh: number
  ot1: number
  ot15: number
  ot1hol: number
  ot2: number
  ot3: number
  total: number
}

export type ManhoursWeekRow = {
  week: string
  planned: number
  actual: number
  backlog: number
}

type ManhourDbRow = {
  idmanhour: string
  idwkctr: string
  display_name: string | null
  position: string | null
  wkctr: string | null
  stworkday: string
  workday: string
  wh: string
  ot1: string
  ot15: string
  ot1hol: string
  ot2: string
  ot3: string
  created_at: Date | null
  updated_at: Date | null
}

const SELECT_MANHOUR_BASE = `
  SELECT
    m.idmanhour::text,
    m.idwkctr,
    NULLIF(TRIM(CONCAT(COALESCE(w.titlewkctr,''), COALESCE(w.namewkctr,''), ' ', COALESCE(w.surnamewkctr,''))), '') AS display_name,
    NULLIF(TRIM(pos.position), '') AS position,
    w.wkctr,
    m.stworkday::text,
    m.workday::text,
    m.wh::text,
    m.ot1::text,
    m.ot15::text,
    m.ot1hol::text,
    m.ot2::text,
    m.ot3::text,
    m.created_at,
    m.updated_at
  FROM app.tbmanhours m
  LEFT JOIN app.tbworkcenter w ON w.idwkctr = m.idwkctr
  LEFT JOIN app.tbposition pos ON pos.idposition::text = w.idposition::text
`

function unixToIsoDate(sec: number): string | null {
  if (!Number.isFinite(sec) || sec <= 0) return null
  const d = new Date(sec * 1000)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function toHours(value: string | number | null | undefined): number {
  const n = Number(value ?? 0)
  return Number.isFinite(n) ? n : 0
}

/** ISO `yyyy-mm-dd` (frontend query params) — not dd.mm.yyyy */
function parseIsoYyyyMmDdToSec(value: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim())
  if (!m) return null
  const yyyy = Number(m[1])
  const mm = Number(m[2])
  const dd = Number(m[3])
  if (!Number.isFinite(yyyy) || !Number.isFinite(mm) || !Number.isFinite(dd)) return null
  if (dd < 1 || dd > 31 || mm < 1 || mm > 12 || yyyy < 1900 || yyyy > 2100) return null
  const dt = new Date(yyyy, mm - 1, dd, 0, 0, 0, 0)
  const sec = Math.floor(dt.getTime() / 1000)
  return sec > 0 ? sec : null
}

export function parseWorkday(value: string | number): number {
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || value <= 0) throw new Error('Invalid date')
    return Math.floor(value)
  }
  const trimmed = value.trim()
  if (!trimmed) throw new Error('Invalid date')
  const numeric = Number(trimmed)
  if (Number.isFinite(numeric) && numeric > 0) return Math.floor(numeric)
  const iso = parseIsoYyyyMmDdToSec(trimmed)
  if (iso != null) return iso
  const parsed = parseThaiDate(trimmed)
  if (!parsed) throw new Error(`Invalid date: ${value}`)
  return parsed
}

function mapManhour(row: ManhourDbRow): ManhourItem {
  const wh = toHours(row.wh)
  const ot1 = toHours(row.ot1)
  const ot15 = toHours(row.ot15)
  const ot1hol = toHours(row.ot1hol)
  const ot2 = toHours(row.ot2)
  const ot3 = toHours(row.ot3)
  const stworkday = Number(row.stworkday)
  const workday = Number(row.workday)
  return {
    idmanhour: Number(row.idmanhour),
    idwkctr: row.idwkctr,
    displayName: row.display_name,
    position: row.position,
    wkctr: row.wkctr,
    stworkday,
    workday,
    startDate: unixToIsoDate(stworkday),
    endDate: unixToIsoDate(workday),
    wh,
    ot1,
    ot15,
    ot1hol,
    ot2,
    ot3,
    total: wh + ot1 + ot15 + ot1hol + ot2 + ot3,
    createdAt: row.created_at?.toISOString() ?? null,
    updatedAt: row.updated_at?.toISOString() ?? null,
  }
}

export async function listManhours(
  pool: Pool,
  opts: {
    q?: string
    idwkctr?: string
    filterWkctr?: string
    from?: string
    to?: string
    limit?: number
    offset?: number
  } = {},
): Promise<{ items: ManhourItem[]; totalRows: number }> {
  const params: unknown[] = []
  const conds: string[] = []
  const limit = Math.max(1, Math.min(1000, opts.limit ?? 200))
  const offset = Math.max(0, opts.offset ?? 0)

  if (opts.filterWkctr?.trim()) {
    params.push(opts.filterWkctr.trim())
    conds.push(`w.wkctr = $${params.length}`)
  } else if (opts.idwkctr?.trim()) {
    params.push(opts.idwkctr.trim())
    conds.push(`m.idwkctr = $${params.length}`)
  }

  if (opts.q?.trim()) {
    params.push(`%${opts.q.trim().toLowerCase()}%`)
    conds.push(`(
      lower(m.idwkctr) LIKE $${params.length}
      OR lower(coalesce(w.wkctr,'')) LIKE $${params.length}
      OR lower(coalesce(w.namewkctr,'')) LIKE $${params.length}
      OR lower(coalesce(w.surnamewkctr,'')) LIKE $${params.length}
    )`)
  }

  if (opts.from?.trim()) {
    params.push(parseWorkday(opts.from.trim()))
    conds.push(`m.workday >= $${params.length}`)
  }

  if (opts.to?.trim()) {
    params.push(parseWorkday(opts.to.trim()))
    conds.push(`m.workday <= $${params.length}`)
  }

  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : ''
  const countRes = await pool.query<{ n: string }>(
    `SELECT COUNT(*)::text AS n
     FROM app.tbmanhours m
     LEFT JOIN app.tbworkcenter w ON w.idwkctr = m.idwkctr
     ${where}`,
    params,
  )

  params.push(limit, offset)
  const limitIdx = params.length - 1
  const offsetIdx = params.length
  const r = await pool.query<ManhourDbRow>(
    `${SELECT_MANHOUR_BASE}
     ${where}
     ORDER BY m.stworkday DESC, m.idmanhour DESC
     LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
    params,
  )

  return { items: r.rows.map(mapManhour), totalRows: Number(countRes.rows[0]?.n ?? '0') }
}

export async function getManhour(pool: Pool, idmanhour: number): Promise<ManhourItem | null> {
  const r = await pool.query<ManhourDbRow>(
    `${SELECT_MANHOUR_BASE} WHERE m.idmanhour = $1 LIMIT 1`,
    [idmanhour],
  )
  return r.rows[0] ? mapManhour(r.rows[0]) : null
}

export async function upsertManhour(
  pool: Pool,
  body: ManhourUpsertBody,
  idmanhour?: number,
): Promise<{ idmanhour: number; mode: 'inserted' | 'updated' }> {
  const stworkday = parseWorkday(body.stworkday)
  const workday = parseWorkday(body.workday)
  if (workday < stworkday) throw new Error('workday must be >= stworkday')

  if (idmanhour != null) {
    const r = await pool.query<{ idmanhour: string }>(
      `UPDATE app.tbmanhours
       SET idwkctr = $2,
           stworkday = $3,
           workday = $4,
           wh = $5,
           ot1 = $6,
           ot15 = $7,
           ot1hol = $8,
           ot2 = $9,
           ot3 = $10,
           updated_at = now()
       WHERE idmanhour = $1
       RETURNING idmanhour::text`,
      [
        idmanhour,
        body.idwkctr.trim(),
        stworkday,
        workday,
        body.wh,
        body.ot1,
        body.ot15,
        body.ot1hol,
        body.ot2,
        body.ot3,
      ],
    )
    if (!r.rows[0]) throw new Error('NOT_FOUND')
    return { idmanhour: Number(r.rows[0].idmanhour), mode: 'updated' }
  }

  const r = await pool.query<{ idmanhour: string }>(
    `INSERT INTO app.tbmanhours
       (idwkctr, stworkday, workday, wh, ot1, ot15, ot1hol, ot2, ot3)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (idwkctr, stworkday, workday)
     DO UPDATE SET
       wh = EXCLUDED.wh,
       ot1 = EXCLUDED.ot1,
       ot15 = EXCLUDED.ot15,
       ot1hol = EXCLUDED.ot1hol,
       ot2 = EXCLUDED.ot2,
       ot3 = EXCLUDED.ot3,
       updated_at = now()
     RETURNING idmanhour::text`,
    [
      body.idwkctr.trim(),
      stworkday,
      workday,
      body.wh,
      body.ot1,
      body.ot15,
      body.ot1hol,
      body.ot2,
      body.ot3,
    ],
  )
  return { idmanhour: Number(r.rows[0]?.idmanhour), mode: 'inserted' }
}

export async function deleteManhour(pool: Pool, idmanhour: number): Promise<boolean> {
  const r = await pool.query(`DELETE FROM app.tbmanhours WHERE idmanhour = $1`, [idmanhour])
  return (r.rowCount ?? 0) > 0
}

/** Sum wh + OT for all rows of idwkctr */
export async function getWorktimeTotal(
  pool: Pool,
  idwkctr: string,
): Promise<WorktimeBreakdown | null> {
  const r = await pool.query<{
    wh: string
    ot1: string
    ot15: string
    ot1hol: string
    ot2: string
    ot3: string
  }>(
    `SELECT
       COALESCE(SUM(wh), 0)::text AS wh,
       COALESCE(SUM(ot1), 0)::text AS ot1,
       COALESCE(SUM(ot15), 0)::text AS ot15,
       COALESCE(SUM(ot1hol), 0)::text AS ot1hol,
       COALESCE(SUM(ot2), 0)::text AS ot2,
       COALESCE(SUM(ot3), 0)::text AS ot3
     FROM app.tbmanhours
     WHERE idwkctr = $1`,
    [idwkctr],
  )
  const row = r.rows[0]
  if (!row) return null

  const wh = Number(row.wh)
  const ot1 = Number(row.ot1)
  const ot15 = Number(row.ot15)
  const ot1hol = Number(row.ot1hol)
  const ot2 = Number(row.ot2)
  const ot3 = Number(row.ot3)
  const total = wh + ot1 + ot15 + ot1hol + ot2 + ot3

  if (total === 0 && wh === 0) return null

  return { wh, ot1, ot15, ot1hol, ot2, ot3, total }
}

/** สรุปรายสัปดาห์สำหรับหน้า Manhours — จาก tbmanhours ช่วงล่าสุด */
export async function getManhoursWeeklySummary(
  pool: Pool,
  idwkctr: string,
  daysBack = 56,
): Promise<ManhoursWeekRow[]> {
  const since = Math.floor(Date.now() / 1000) - daysBack * 86400

  const r = await pool.query<{
    week_label: string
    wh: string
    actual: string
    ot_sum: string
  }>(
    `SELECT
       ${pepsiWorkWeekSql('stworkday')} AS week_label,
       COALESCE(SUM(wh), 0)::text AS wh,
       COALESCE(SUM(wh + ot1 + ot15 + ot1hol + ot2 + ot3), 0)::text AS actual,
       COALESCE(SUM(ot1 + ot15 + ot1hol + ot2 + ot3), 0)::text AS ot_sum
     FROM app.tbmanhours
     WHERE idwkctr = $1 AND stworkday >= $2
     GROUP BY 1
     ORDER BY MIN(stworkday)`,
    [idwkctr, since],
  )

  return r.rows.map((row) => {
    const planned = Number(row.wh)
    const actual = Number(row.actual)
    const backlog = Number(row.ot_sum)
    return {
      week: row.week_label,
      planned,
      actual,
      backlog,
    }
  })
}

export async function listWorktimeDaily(
  pool: Pool,
  idwkctr: string,
  opts: { from?: string; to?: string; limit?: number } = {},
): Promise<WorktimeDailyItem[]> {
  const params: unknown[] = [idwkctr]
  const conds = ['idwkctr = $1']
  if (opts.from?.trim()) {
    params.push(parseWorkday(opts.from.trim()))
    conds.push(`workday >= $${params.length}`)
  }
  if (opts.to?.trim()) {
    params.push(parseWorkday(opts.to.trim()))
    conds.push(`stworkday <= $${params.length}`)
  }
  const limit = Math.max(1, Math.min(500, opts.limit ?? 200))
  params.push(limit)

  const r = await pool.query<{
    workday: string
    wh: string
    ot1: string
    ot15: string
    ot1hol: string
    ot2: string
    ot3: string
  }>(
    `SELECT
       workday::text,
       COALESCE(SUM(wh), 0)::text AS wh,
       COALESCE(SUM(ot1), 0)::text AS ot1,
       COALESCE(SUM(ot15), 0)::text AS ot15,
       COALESCE(SUM(ot1hol), 0)::text AS ot1hol,
       COALESCE(SUM(ot2), 0)::text AS ot2,
       COALESCE(SUM(ot3), 0)::text AS ot3
     FROM app.tbmanhours
     WHERE ${conds.join(' AND ')}
     GROUP BY workday
     ORDER BY workday DESC
     LIMIT $${params.length}`,
    params,
  )

  return r.rows.map((row) => {
    const wh = toHours(row.wh)
    const ot1 = toHours(row.ot1)
    const ot15 = toHours(row.ot15)
    const ot1hol = toHours(row.ot1hol)
    const ot2 = toHours(row.ot2)
    const ot3 = toHours(row.ot3)
    const workday = Number(row.workday)
    return {
      workday,
      workDate: unixToIsoDate(workday),
      wh,
      ot1,
      ot15,
      ot1hol,
      ot2,
      ot3,
      total: wh + ot1 + ot15 + ot1hol + ot2 + ot3,
    }
  })
}

type ParsedImportRow =
  | { kind: 'ok'; rowNo: number; body: ManhourUpsertBody }
  | { kind: 'error'; rowNo: number; idwkctr: string; message: string }

function cellStr(v: unknown): string {
  if (v == null) return ''
  return String(v).trim()
}

function parseImportNumber(value: unknown): number {
  const s = cellStr(value)
  if (!s) return 0
  const n = Number(s)
  if (!Number.isFinite(n) || n < 0) throw new Error(`Bad hour value: ${s}`)
  return n
}

function parseManhourWorkbook(buffer: Buffer): ParsedImportRow[] {
  const wb = XLSX.read(buffer, { type: 'buffer', cellDates: false })
  const out: ParsedImportRow[] = []
  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName]
    if (!ws) continue
    const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, {
      header: 1,
      raw: false,
      defval: '',
      blankrows: false,
    })
    for (let i = 0; i < rows.length; i++) {
      const rowNo = i + 1
      if (rowNo <= 2) continue
      const row = rows[i] ?? []
      const idwkctr = cellStr(row[0])
      try {
        if (!idwkctr || !cellStr(row[1]) || !cellStr(row[2]) || !cellStr(row[3])) {
          out.push({ kind: 'error', rowNo, idwkctr, message: 'Required columns: idwkctr, StartDate, EndDate, WH' })
          continue
        }
        out.push({
          kind: 'ok',
          rowNo,
          body: {
            idwkctr,
            stworkday: cellStr(row[1]),
            workday: cellStr(row[2]),
            wh: parseImportNumber(row[3]),
            ot1: parseImportNumber(row[4]),
            ot15: parseImportNumber(row[5]),
            ot1hol: parseImportNumber(row[6]),
            ot2: parseImportNumber(row[7]),
            ot3: parseImportNumber(row[8]),
          },
        })
      } catch (err) {
        out.push({
          kind: 'error',
          rowNo,
          idwkctr,
          message: err instanceof Error ? err.message : String(err),
        })
      }
    }
  }
  return out
}

async function upsertImportRow(
  client: PoolClient,
  body: ManhourUpsertBody,
): Promise<{ idmanhour: number; mode: 'inserted' | 'updated' }> {
  const stworkday = parseWorkday(body.stworkday)
  const workday = parseWorkday(body.workday)
  if (workday < stworkday) throw new Error('workday must be >= stworkday')
  const r = await client.query<{ idmanhour: string; inserted: boolean }>(
    `INSERT INTO app.tbmanhours
       (idwkctr, stworkday, workday, wh, ot1, ot15, ot1hol, ot2, ot3)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (idwkctr, stworkday, workday)
     DO UPDATE SET
       wh = EXCLUDED.wh,
       ot1 = EXCLUDED.ot1,
       ot15 = EXCLUDED.ot15,
       ot1hol = EXCLUDED.ot1hol,
       ot2 = EXCLUDED.ot2,
       ot3 = EXCLUDED.ot3,
       updated_at = now()
     RETURNING idmanhour::text, (xmax = 0) AS inserted`,
    [
      body.idwkctr.trim(),
      stworkday,
      workday,
      body.wh,
      body.ot1,
      body.ot15,
      body.ot1hol,
      body.ot2,
      body.ot3,
    ],
  )
  const row = r.rows[0]
  return { idmanhour: Number(row?.idmanhour), mode: row?.inserted ? 'inserted' : 'updated' }
}

export async function importManhoursFile(
  pool: Pool,
  opts: { fileName: string; buffer: Buffer },
): Promise<ManhourImportResponse> {
  const parsed = parseManhourWorkbook(opts.buffer)
  const rows: ManhourImportResponse['rows'] = []
  let inserted = 0
  let updated = 0
  let skipped = 0
  let errors = 0
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    for (const p of parsed) {
      if (p.kind === 'error') {
        errors++
        rows.push({ rowNo: p.rowNo, idwkctr: p.idwkctr, action: 'error', message: p.message })
        continue
      }
      try {
        const res = await upsertImportRow(client, p.body)
        if (res.mode === 'inserted') inserted++
        else updated++
        rows.push({ rowNo: p.rowNo, idwkctr: p.body.idwkctr, action: res.mode })
      } catch (err) {
        errors++
        rows.push({
          rowNo: p.rowNo,
          idwkctr: p.body.idwkctr,
          action: 'error',
          message: err instanceof Error ? err.message : String(err),
        })
      }
    }
    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }

  return { fileName: opts.fileName, totalRows: parsed.length, inserted, updated, skipped, errors, rows }
}
