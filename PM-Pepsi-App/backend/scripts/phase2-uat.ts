/**
 * Phase 2 UAT runner (WORK-PHASES.md §64–68)
 * Usage: npx tsx scripts/phase2-uat.ts
 */
import 'dotenv/config'
import { copyFile, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createPool } from '../src/db/pool.js'
import { buildConfirmationExportSapCsv } from '../src/services/confirmation-export-csv.js'
import { listConfirmationExportRows } from '../src/services/confirmation.js'
import {
  ensureIntegrationDirs,
  getIntegrationDirs,
} from '../src/services/integration-paths.js'
import { runInboundIntegrationScan } from '../src/services/integration-watch.js'
import { importIw37nFile } from '../src/services/iw37n.js'
import { listCalendarEvents } from '../src/services/calendar.js'
import { searchWorkOrders } from '../src/services/work-orders.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(here, '../../..')
const IW37N_SAMPLE = path.join(repoRoot, 'from customer/SAP data/Data/IW37N ล่าสุด.xlsx')
const CONFIRM_SAMPLE = path.join(repoRoot, 'from customer/AcZB02,ZB05-Done.xlsx')

type Check = { id: string; pass: boolean; detail: string }

const checks: Check[] = []

function record(id: string, pass: boolean, detail: string) {
  checks.push({ id, pass, detail })
  const mark = pass ? 'PASS' : 'FAIL'
  console.log(`[${mark}] ${id}: ${detail}`)
}

const databaseUrl = process.env.DATABASE_URL?.trim()
if (!databaseUrl) {
  console.error('DATABASE_URL required')
  process.exit(1)
}

const pool = createPool(databaseUrl)
const reset = process.argv.includes('--reset')

try {
  if (reset) {
    console.log('Resetting dev import data (tbiw37n + batches + tbcofirm)…')
    await pool.query('DELETE FROM app.tbcofirm')
    await pool.query('DELETE FROM app.tbiw37n_import_row')
    await pool.query('DELETE FROM app.tbiw37n_import_batch')
    await pool.query('DELETE FROM app.tbiw37n')
  }

  // --- 1) Manual IW37N import (same API as /integration & /iw37n) ---
  const iwBuf = await readFile(IW37N_SAMPLE)
  const iwResult = await importIw37nFile(pool, 'IW37N-latest-uat.xlsx', iwBuf, {
    source: 'manual',
  })
  const iwActs = await pool.query<{ action: string; n: number }>(
    `SELECT action, COUNT(*)::int AS n FROM app.tbiw37n_import_row WHERE batch_id = $1 GROUP BY action`,
    [iwResult.batch.id],
  )
  const inserted = iwActs.rows.find((r) => r.action === 'inserted')?.n ?? 0
  const updated = iwActs.rows.find((r) => r.action === 'updated')?.n ?? 0
  const skipped = iwActs.rows.find((r) => r.action === 'skipped')?.n ?? 0
  record(
    'integration-iw37n-batch-log',
    !iwResult.batch.isDuplicate && inserted + updated > 0,
    `batch #${iwResult.batch.id} inserted=${inserted} updated=${updated} skipped=${skipped} dup=${iwResult.batch.isDuplicate}`,
  )

  // --- 2) inbound/confirm drop + scan ---
  const dirs = getIntegrationDirs()
  await ensureIntegrationDirs(dirs)
  const confirmDrop = path.join(
    dirs.inboundConfirm,
    `AcZB02-uat-${Date.now()}.xlsx`,
  )
  await copyFile(CONFIRM_SAMPLE, confirmDrop)
  const scanJob = await runInboundIntegrationScan(pool, {
    trigger: 'manual',
    startedBy: 'phase2-uat',
    scanIw37n: false,
    scanConfirm: true,
  })
  const confirmFiles =
    (scanJob.summary as { confirm?: { files?: { fileName: string; ok: boolean; inserted?: number; updated?: number; message?: string }[] } })
      ?.confirm?.files ?? []
  const confirmOk = confirmFiles.find((f) => f.ok)
  const cofirmCount = await pool.query<{ n: number }>(`SELECT COUNT(*)::int AS n FROM app.tbcofirm`)
  record(
    'inbound-confirm-watch',
    Boolean(confirmOk) && cofirmCount.rows[0]!.n > 0,
    `job #${scanJob.id} status=${scanJob.status} confirmRows=${cofirmCount.rows[0]!.n} file=${confirmOk?.fileName ?? 'none'} ins=${confirmOk?.inserted ?? 0} upd=${confirmOk?.updated ?? 0} (ต้องเป็น IW37N+Confirm ชุดเดียวกัน)`,
  )

  // --- 3) Calendar events ---
  const range = await pool.query<{ min_bsc: string; max_bsc: string }>(
    `SELECT MIN(bscstart)::text AS min_bsc, MAX(bscstart)::text AS max_bsc FROM app.tbiw37n`,
  )
  const minSec = Number(range.rows[0]?.min_bsc ?? 0)
  const maxSec = Number(range.rows[0]?.max_bsc ?? 0)
  const mid = new Date(((minSec + maxSec) / 2) * 1000)
  const year = mid.getUTCFullYear()
  const month = mid.getUTCMonth() + 1
  const fromDate = new Date(minSec * 1000).toISOString().slice(0, 10)
  const toDate = new Date(maxSec * 1000).toISOString().slice(0, 10)
  const cal = await listCalendarEvents(pool, year, month)
  const iwCount = await pool.query<{ n: number }>(`SELECT COUNT(*)::int AS n FROM app.tbiw37n`)
  record(
    'calendar-has-events',
    cal.length > 0 && iwCount.rows[0]!.n > 100,
    `calendar events=${cal.length} tbiw37n=${iwCount.rows[0]!.n} (${year}-${month} · ข้อมูล ${fromDate}…${toDate})`,
  )

  // --- 4) Work orders + ZB02 filter ---
  const woAll = await searchWorkOrders(pool, {
    wktype: [],
    activity: [],
    status: [],
    wkctr: [],
    team: [],
    functionalloc: [],
    equipment: [],
    fromDate,
    toDate,
  })
  const woZb02 = await searchWorkOrders(pool, {
    wktype: ['ZB02'],
    activity: [],
    status: [],
    wkctr: [],
    team: [],
    functionalloc: [],
    equipment: [],
    fromDate,
    toDate,
  })
  const fac7151 = await pool.query<{ n: number }>(
    `SELECT COUNT(*)::int AS n FROM app.tbiw37n WHERE functionalloc ILIKE '%7151%'`,
  )
  record(
    'work-orders-filter',
    woAll.length > 0 && woZb02.length > 0,
    `all=${woAll.length} ZB02=${woZb02.length} · functionalloc มี 7151=${fac7151.rows[0]!.n} แถว`,
  )

  // --- 5) Export Confirm CSV ---
  const exportRows = await listConfirmationExportRows(pool, '', undefined, 'ALL')
  const csv = buildConfirmationExportSapCsv(exportRows)
  const headerLine = csv.replace(/^\ufeff/, '').split('\r\n')[0] ?? ''
  const hasSapHeaders =
    headerLine.includes('Comfirmation') &&
    headerLine.includes('Start date Exe.') &&
    headerLine.includes('Wrk Ctr')
  record(
    'confirm-export-csv',
    hasSapHeaders,
    `exportRows=${exportRows.length} headersOK=${hasSapHeaders} (ต้องมี WO syst=CRTD|REL ใน view_exportconfirm)`,
  )

  console.log('\n=== Summary ===')
  const failed = checks.filter((c) => !c.pass)
  for (const c of checks) {
    console.log(`  ${c.pass ? '✓' : '✗'} ${c.id}`)
  }
  if (failed.length) {
    console.log(`\n${failed.length} check(s) failed.`)
    process.exit(1)
  }
  console.log('\nAll Phase 2 UAT checks passed.')
} catch (err) {
  console.error(err)
  process.exit(1)
} finally {
  await pool.end().catch(() => {})
}
