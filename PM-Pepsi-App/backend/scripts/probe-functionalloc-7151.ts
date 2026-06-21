/**
 * ตรวจ functionalloc vs filter โรงงาน 7151
 * Usage: npx tsx scripts/probe-functionalloc-7151.ts [path-to.xlsx]
 */
import 'dotenv/config'
import { readFileSync } from 'node:fs'
import * as XLSX from 'xlsx'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createPool } from '../src/db/pool.js'
import { parseIw37nFileWithMeta } from '../src/services/iw37n-parser.js'
import { FACTORY_CODE } from '../src/services/scheduling-shared.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(here, '../../..')
const DEFAULT = path.join(repoRoot, 'from customer/SAP data/Data/IW37N ล่าสุด.xlsx')
const MAY_JUN = path.join(repoRoot, 'from customer/SAP data/Jul/IW37N May-Jun.xls')

function count7151(rows: { functionalloc: string }[]) {
  const with7151 = rows.filter((r) => r.functionalloc.includes('7151'))
  const samples = [...new Set(rows.slice(0, 500).map((r) => r.functionalloc))].slice(0, 8)
  return { total: rows.length, with7151: with7151.length, samples }
}

function dumpAlvHeaders(filePath: string) {
  const buf = readFileSync(filePath)
  const wb = XLSX.read(buf, { type: 'buffer' })
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[wb.SheetNames[0]!]!, {
    header: 1,
    defval: '',
  })
  for (let i = 0; i < Math.min(6, matrix.length); i++) {
    const row = matrix[i]
    if (!Array.isArray(row)) continue
    const named = row
      .map((c, idx) => ({ idx, t: String(c ?? '').trim() }))
      .filter((x) => x.t)
    if (named.length > 0) console.log(`  row${i + 1}:`, named.map((x) => `${x.idx}:${x.t}`).join(' | '))
  }
}

function probeFile(label: string, filePath: string) {
  const buf = readFileSync(filePath)
  const { layout, rows } = parseIw37nFileWithMeta(buf, path.basename(filePath))
  const stats = count7151(rows)
  console.log(`\n=== ${label} ===`)
  console.log('file:', filePath)
  console.log('layout:', layout)
  console.log('parsed:', stats.total)
  console.log(`functionalloc มี "${FACTORY_CODE}":`, stats.with7151, `(${stats.total ? ((100 * stats.with7151) / stats.total).toFixed(1) : 0}%)`)
  console.log('ตัวอย่าง functionalloc:', stats.samples)
  if (layout === 'sap_alv') {
    console.log('หัวคอลัมน์ ALV:')
    dumpAlvHeaders(filePath)
  }
}

async function probeDb() {
  const url = process.env.DATABASE_URL?.trim()
  if (!url) {
    console.log('\n(DB skip — ไม่มี DATABASE_URL)')
    return
  }
  const pool = createPool(url)
  try {
    const total = await pool.query<{ n: number }>(`SELECT COUNT(*)::int AS n FROM app.tbiw37n`)
    const fac = await pool.query<{ n: number }>(
      `SELECT COUNT(*)::int AS n FROM app.tbiw37n WHERE functionalloc ILIKE $1`,
      [`%${FACTORY_CODE}%`],
    )
    const top = await pool.query<{ functionalloc: string; n: number }>(
      `SELECT COALESCE(NULLIF(TRIM(functionalloc), ''), '(ว่าง)') AS functionalloc,
              COUNT(*)::int AS n
       FROM app.tbiw37n
       GROUP BY 1
       ORDER BY n DESC
       LIMIT 10`,
    )
    const view = await pool.query<{ n: number }>(
      `SELECT COUNT(*)::int AS n FROM app.view_order WHERE functionalloc LIKE $1 AND bscstart IS NOT NULL AND bscstart > 0`,
      [`%${FACTORY_CODE}%`],
    )
    console.log('\n=== PostgreSQL ===')
    console.log('tbiw37n ทั้งหมด:', total.rows[0]?.n ?? 0)
    console.log(`tbiw37n ILIKE %${FACTORY_CODE}%:`, fac.rows[0]?.n ?? 0)
    console.log(`view_order (filter ปฏิทิน/WO):`, view.rows[0]?.n ?? 0)
    console.log('Top functionalloc:')
    for (const r of top.rows) console.log(`  ${r.n}\t${r.functionalloc}`)
  } finally {
    await pool.end()
  }
}

const arg = process.argv[2]
probeFile('ไฟล์ที่ระบุ', arg ?? DEFAULT)
if (!arg) probeFile('IW37N May-Jun (legacy)', MAY_JUN)
void probeDb()
