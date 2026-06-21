import * as path from 'path'
import * as fs from 'fs'
import * as XLSX from 'xlsx'

export type EngUtilizationDailyRow = {
  idwkctr: string | null
  wkctr: string
  label: string
  hasImage: boolean
  displayName: string | null
  pmHours: number
  reactiveHours: number
  rcaHours: number
  hrHours: number
  pmPercent: number
  reactivePercent: number
  totalPercent: number
}

export type EngUtilizationDailyResponse = {
  source: 'xlsx'
  file: string
  sheet: string
  dateLabel: string | null
  averagePercent: number
  rows: EngUtilizationDailyRow[]
}

function toNumber(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : 0
}

function resolveRepoFilePath(relFromRepoRoot: string): string {
  // backend runs with cwd at PM-Pepsi-App/backend in dev
  return path.resolve(process.cwd(), '..', '..', relFromRepoRoot)
}

/**
 * Parses `new file/IW47 Daily 12May2026.xlsx` into utilization-by-person rows.
 * - PM: OrdCat = ZB02
 * - Reactive: OrdCat = ZB05
 * - RCA: OrdCat = ZB01
 * - HR hour: default 10.5 (from customer template)
 */
export async function loadEngUtilizationDailyFromIw47Xlsx(pool?: { query: (sql: string, params: unknown[]) => Promise<{ rows: any[] }> }): Promise<EngUtilizationDailyResponse> {
  const rel = path.join('new file', 'IW47 Daily 12May2026.xlsx')
  const filePath = resolveRepoFilePath(rel)
  const buf = fs.readFileSync(filePath)
  const wb = XLSX.read(buf, { type: 'buffer', cellDates: true })
  const sheet = wb.SheetNames[0] ?? 'IW47 Daily 12May'
  const ws = wb.Sheets[sheet]
  if (!ws) {
    return {
      source: 'xlsx',
      file: rel,
      sheet,
      dateLabel: null,
      averagePercent: 0,
      rows: [],
    }
  }

  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, raw: true, defval: null })
  const headerIdx = rows.findIndex((r) => Array.isArray(r) && r[1] === 'S' && r[2] === 'Confirm.')
  if (headerIdx < 0) {
    return {
      source: 'xlsx',
      file: rel,
      sheet,
      dateLabel: null,
      averagePercent: 0,
      rows: [],
    }
  }

  const header = rows[headerIdx] as unknown[]
  const col = (name: string) => header.findIndex((v) => String(v ?? '').trim() === name)

  const idxOrdCat = col('OrdCat')
  const idxWkCtrAct = col('WkCtrAct')
  const idxHr = col('HR')

  const byWkctr = new Map<
    string,
    { pm: number; reactive: number; rca: number }
  >()

  for (const r of rows.slice(headerIdx + 1)) {
    if (!Array.isArray(r)) continue
    const wkctr = String(r[idxWkCtrAct] ?? '').trim()
    if (!wkctr) continue
    const ordCat = String(r[idxOrdCat] ?? '').trim()
    const hr = toNumber(r[idxHr])

    const cur = byWkctr.get(wkctr) ?? { pm: 0, reactive: 0, rca: 0 }
    if (ordCat === 'ZB02') cur.pm += hr
    else if (ordCat === 'ZB05') cur.reactive += hr
    else if (ordCat === 'ZB01') cur.rca += hr
    byWkctr.set(wkctr, cur)
  }

  const hrHours = 10.5
  const outRowsBase = [...byWkctr.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([wkctr, v]) => {
      const pmPercent = hrHours > 0 ? (v.pm / hrHours) * 100 : 0
      const reactivePercent = hrHours > 0 ? (v.reactive / hrHours) * 100 : 0
      const totalPercent = pmPercent + reactivePercent
      return {
        idwkctr: null,
        wkctr,
        label: wkctr,
        hasImage: false,
        displayName: null,
        pmHours: v.pm,
        reactiveHours: v.reactive,
        rcaHours: v.rca,
        hrHours,
        pmPercent,
        reactivePercent,
        totalPercent,
      }
    })

  let outRows: EngUtilizationDailyRow[] = outRowsBase
  if (pool && outRowsBase.length > 0) {
    const wkctrs = outRowsBase.map((r) => r.wkctr)
    const r = await pool.query(
      `SELECT
         wc.idwkctr::text AS idwkctr,
         wc.wkctr::text AS wkctr,
         NULLIF(TRIM(CONCAT(
           COALESCE(wc.titlewkctr,''),
           COALESCE(wc.namewkctr,''),
           ' ',
           COALESCE(wc.surnamewkctr,'')
         )), '') AS display_name,
         (octet_length(wc.imgmember_data) > 0) AS has_image
       FROM app.tbworkcenter wc
       WHERE wc.wkctr = ANY($1::text[])`,
      [wkctrs],
    )
    const map = new Map<string, { idwkctr: string; displayName: string | null; hasImage: boolean }>()
    for (const row of r.rows) {
      map.set(String(row.wkctr), {
        idwkctr: String(row.idwkctr),
        displayName: row.display_name ? String(row.display_name) : null,
        hasImage: Boolean(row.has_image),
      })
    }
    outRows = outRowsBase.map((row) => {
      const extra = map.get(row.wkctr)
      if (!extra) return row
      return {
        ...row,
        idwkctr: extra.idwkctr,
        displayName: extra.displayName,
        hasImage: extra.hasImage,
      }
    })
  }

  const avg =
    outRows.length > 0
      ? outRows.reduce((s, r) => s + r.totalPercent, 0) / outRows.length
      : 0

  // A1 contains a display string like "13.05.2026 Dynamic List Display 1"
  const firstCell = (rows[0] as unknown[])?.[0]
  const dateLabel = typeof firstCell === 'string' && firstCell.trim() ? firstCell.trim() : null

  return {
    source: 'xlsx',
    file: rel,
    sheet,
    dateLabel,
    averagePercent: avg,
    rows: outRows,
  }
}

