/**
 * Verify DB master plan matches customer Excel (sheet names, order, row counts).
 * Usage: npm run verify:master-plan
 */
import 'dotenv/config'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createPool } from '../src/db/pool.js'
import {
  MASTER_PLAN_FILES,
  parseMasterPlanWorkbook,
  type MasterPlanDiscipline,
} from '../src/lib/master-plan-parse.js'
import { getPublishedWorkbook } from '../src/services/master-plan.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(here, '../../..')
const customerDir = path.join(repoRoot, 'docs from customer')

const databaseUrl = process.env.DATABASE_URL?.trim()
if (!databaseUrl) {
  console.error('DATABASE_URL required')
  process.exit(1)
}

const pool = createPool(databaseUrl)
const disciplines: MasterPlanDiscipline[] = ['EE', 'ME', 'PK']
let failed = false

try {
  for (const discipline of disciplines) {
    const filename = MASTER_PLAN_FILES[discipline]
    const buf = await readFile(path.join(customerDir, filename))
    const parsed = parseMasterPlanWorkbook(buf, discipline, filename)
    const db = await getPublishedWorkbook(pool, discipline)

    if (!db) {
      console.error(`[FAIL] ${discipline}: no published workbook in DB`)
      failed = true
      continue
    }

    const parsedNames = parsed.sheets.map((s) => s.sheetName)
    const dbNames = db.sheets.sort((a, b) => a.sortOrder - b.sortOrder).map((s) => s.sheetName)

    if (JSON.stringify(parsedNames) !== JSON.stringify(dbNames)) {
      console.error(`[FAIL] ${discipline}: sheet names/order mismatch`)
      console.error('  xlsx:', parsedNames.join(' | '))
      console.error('  db:  ', dbNames.join(' | '))
      failed = true
      continue
    }

    let rowMismatch = false
    for (const ps of parsed.sheets) {
      const ds = db.sheets.find((s) => s.sheetName === ps.sheetName)
      if (!ds || ds.rowCount !== ps.rows.length) {
        console.error(
          `[FAIL] ${discipline}/${ps.sheetName}: rows xlsx=${ps.rows.length} db=${ds?.rowCount ?? 0}`,
        )
        rowMismatch = true
        failed = true
      }
    }

    if (!rowMismatch) {
      console.log(`[OK] ${discipline}: ${parsed.sheets.length} sheets, row counts match`)
    }
  }
} finally {
  await pool.end()
}

process.exit(failed ? 1 : 0)
