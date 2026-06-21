/**
 * Phase 2 UAT — ZB02All template pair (customer docs)
 * Usage: npx tsx scripts/phase2-uat-zb02all.ts [--reset]
 */
import 'dotenv/config'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createPool } from '../src/db/pool.js'
import { importConfirmFile } from '../src/services/confirmation.js'
import { importIw37nFile } from '../src/services/iw37n.js'
import { parseConfirmFileWithMeta } from '../src/services/confirmation-import.js'
import { listCalendarEvents } from '../src/services/calendar.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(here, '../../..')

const IW37N_ZB02ALL = path.join(
  repoRoot,
  'docs from customer/Templete IW37N on PM App - ZB02All.xlsx',
)
const CONFIRM_CANDIDATES = [
  path.join(repoRoot, 'new file/IW47 Daily 12May2026.xlsx'),
  path.join(repoRoot, 'docs from customer/Export_Confirm (26May).xlsx'),
  path.join(repoRoot, 'from customer/AcZB02,ZB05-Done.xlsx'),
  path.join(repoRoot, 'from customer/SAP data/Data/Confirm WO.xls'),
]

type Check = { id: string; pass: boolean; detail: string }
const checks: Check[] = []

function record(id: string, pass: boolean, detail: string) {
  checks.push({ id, pass, detail })
  console.log(`[${pass ? 'PASS' : 'FAIL'}] ${id}: ${detail}`)
}

const databaseUrl = process.env.DATABASE_URL?.trim()
if (!databaseUrl) {
  console.error('DATABASE_URL required')
  process.exit(1)
}

const pool = createPool(databaseUrl)
const reset = process.argv.includes('--reset')

async function probeConfirmFiles(iwWkorders: Set<string>) {
  console.log('\n--- Probe Confirm candidates ---')
  for (const p of CONFIRM_CANDIDATES) {
    const name = path.basename(p)
    try {
      const buf = await readFile(p)
      const parsed = parseConfirmFileWithMeta(buf, name)
      const ok = parsed.results.filter((r) => r.kind === 'ok')
      const match = ok.filter((r) => r.kind === 'ok' && iwWkorders.has(r.row.wkorder)).length
      console.log(
        `  ${name}: layout=${parsed.layout} confirmRows=${ok.length} matchIW37N=${match}/${iwWkorders.size}`,
      )
      if (ok[0]?.kind === 'ok') {
        console.log(`    sample wkorder=${ok[0].row.wkorder} wkctr=${ok[0].row.wkctr}`)
      }
    } catch (err) {
      console.log(`  ${name}: ERROR ${err instanceof Error ? err.message : err}`)
    }
  }
}

try {
  if (reset) {
    console.log('Resetting tbiw37n + tbcofirm + batches…')
    await pool.query('DELETE FROM app.tbcofirm')
    await pool.query('DELETE FROM app.tbiw37n_import_row')
    await pool.query('DELETE FROM app.tbiw37n_import_batch')
    await pool.query('DELETE FROM app.tbiw37n')
  }

  const iwBuf = await readFile(IW37N_ZB02ALL)
  const iwResult = await importIw37nFile(pool, 'ZB02All-uat.xlsx', iwBuf, { source: 'manual' })
  const iwActs = await pool.query<{ action: string; n: number }>(
    `SELECT action, COUNT(*)::int AS n FROM app.tbiw37n_import_row WHERE batch_id = $1 GROUP BY action`,
    [iwResult.batch.id],
  )
  const inserted = iwActs.rows.find((r) => r.action === 'inserted')?.n ?? 0
  const updated = iwActs.rows.find((r) => r.action === 'updated')?.n ?? 0
  record(
    'iw37n-zb02all',
    !iwResult.batch.isDuplicate && inserted + updated > 0,
    `batch #${iwResult.batch.id} ins=${inserted} upd=${updated} dup=${iwResult.batch.isDuplicate}`,
  )

  const woR = await pool.query<{ wkorder: string }>(`SELECT wkorder FROM app.tbiw37n`)
  const iwWkorders = new Set(woR.rows.map((r) => r.wkorder.trim()))
  await probeConfirmFiles(iwWkorders)

  let confirmImported = false
  let confirmDetail = 'no matching confirm file'
  for (const p of CONFIRM_CANDIDATES) {
    const name = path.basename(p)
    const buf = await readFile(p)
    const parsed = parseConfirmFileWithMeta(buf, name)
    const ok = parsed.results.filter((r) => r.kind === 'ok')
    const match = ok.filter((r) => r.kind === 'ok' && iwWkorders.has(r.row.wkorder)).length
    if (ok.length === 0 || match === 0) continue

    const summary = await importConfirmFile(pool, name, buf)
    const cofirmCount = await pool.query<{ n: number }>(`SELECT COUNT(*)::int AS n FROM app.tbcofirm`)
    confirmImported = summary.inserted + summary.updated > 0 && cofirmCount.rows[0]!.n > 0
    confirmDetail = `${name} ins=${summary.inserted} upd=${summary.updated} total=${cofirmCount.rows[0]!.n} match=${match}`
    if (confirmImported) break
  }

  record('confirm-in-paired', confirmImported, confirmDetail)

  const range = await pool.query<{ min_bsc: string; max_bsc: string }>(
    `SELECT MIN(bscstart)::text AS min_bsc, MAX(bscstart)::text AS max_bsc FROM app.tbiw37n WHERE bscstart > 0`,
  )
  const minSec = Number(range.rows[0]?.min_bsc ?? 0)
  const mid = new Date(minSec * 1000)
  const cal = await listCalendarEvents(pool, mid.getUTCFullYear(), mid.getUTCMonth() + 1)
  record(
    'calendar-after-zb02all',
    cal.length > 0,
    `events=${cal.length} month=${mid.getUTCFullYear()}-${mid.getUTCMonth() + 1}`,
  )

  console.log('\n=== Summary ===')
  for (const c of checks) console.log(`  ${c.pass ? '✓' : '✗'} ${c.id}`)
  if (checks.some((c) => !c.pass)) process.exit(1)
} catch (err) {
  console.error(err)
  process.exit(1)
} finally {
  await pool.end().catch(() => {})
}
