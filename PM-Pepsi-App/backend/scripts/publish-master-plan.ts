/**
 * Publish Master Plan workbooks (EE / ME / PK) to tbtasklist.
 * Usage: npm run publish:master-plan
 */
import 'dotenv/config'
import type { Request } from 'express'
import { createPool } from '../src/db/pool.js'
import type { MasterPlanDiscipline } from '../src/lib/master-plan-parse.js'
import { publishMasterPlanToTasklist } from '../src/services/master-plan.js'

const databaseUrl = process.env.DATABASE_URL?.trim()
if (!databaseUrl) {
  console.error('DATABASE_URL required')
  process.exit(1)
}

const pool = createPool(databaseUrl)
const disciplines: MasterPlanDiscipline[] = ['EE', 'ME', 'PK']

/** Minimal Express request for audit logging from CLI. */
const cliReq = {
  headers: {},
  ip: '127.0.0.1',
  socket: { remoteAddress: '127.0.0.1' },
} as Request

let failed = false

try {
  for (const discipline of disciplines) {
    try {
      const result = await publishMasterPlanToTasklist(pool, discipline, 'publish-script', cliReq)
      if (!result.ok) {
        console.error(`[FAIL] ${discipline}: ${result.code} — ${result.message}`)
        failed = true
        continue
      }
      const { tasklist, publishableRows, skippedRows, versionNo } = result
      console.log(
        `[OK] ${discipline} v${versionNo}: ${publishableRows} publishable rows (${skippedRows} skipped) → ` +
          `inserted ${tasklist.inserted}, updated ${tasklist.updated}, skipped ${tasklist.skipped}, failed ${tasklist.failed}`,
      )
    } catch (err) {
      console.error(`[FAIL] ${discipline}:`, err instanceof Error ? err.message : err)
      failed = true
    }
  }
} finally {
  await pool.end()
}

if (failed) process.exit(1)
