/**
 * Seed Master Plan workbooks (EE / ME / PK) from customer Excel files.
 * Usage: npm run seed:master-plan
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
import { seedMasterPlanWorkbook } from '../src/services/master-plan.js'

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

try {
  for (const discipline of disciplines) {
    const filename = MASTER_PLAN_FILES[discipline]
    const filePath = path.join(customerDir, filename)
    const buf = await readFile(filePath)
    const parsed = parseMasterPlanWorkbook(buf, discipline, filename)
    const result = await seedMasterPlanWorkbook(pool, parsed, 'seed-script')
    console.log(
      `[OK] ${discipline}: ${parsed.sheets.length} sheets, ${result.rowCount} rows (workbook #${result.workbookId})`,
    )
  }
} finally {
  await pool.end()
}
