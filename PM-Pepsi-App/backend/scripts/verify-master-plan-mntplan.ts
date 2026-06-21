/**
 * Verify sample mntplan values exist in published master plan and tbtasklist.
 * Usage: npm run verify:master-plan-mntplan
 */
import 'dotenv/config'
import { createPool } from '../src/db/pool.js'

const SAMPLE_MNTPLANS = ['342596', '610000004061']

const databaseUrl = process.env.DATABASE_URL?.trim()
if (!databaseUrl) {
  console.error('DATABASE_URL required')
  process.exit(1)
}

const pool = createPool(databaseUrl)
let failed = false

try {
  for (const mntplan of SAMPLE_MNTPLANS) {
    const planRes = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM app.tb_master_plan_row r
       INNER JOIN app.tb_master_plan_sheet s ON s.id = r.sheet_id
       INNER JOIN app.tb_master_plan_workbook w ON w.id = s.workbook_id
       WHERE w.status = 'published'
         AND EXISTS (
           SELECT 1 FROM jsonb_each_text(r.cells_json) kv
           WHERE kv.value = $1
         )`,
      [mntplan],
    )
    const planCount = Number(planRes.rows[0]?.count ?? 0)

    const taskRes = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM app.tbtasklist WHERE mntplan = $1`,
      [mntplan],
    )
    const taskCount = Number(taskRes.rows[0]?.count ?? 0)

    const ok = planCount > 0
    console.log(
      `${ok ? '[OK]' : '[FAIL]'} mntplan ${mntplan}: master_plan rows=${planCount}, tbtasklist rows=${taskCount}`,
    )
    if (!ok) failed = true
  }

  const totalRes = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM app.tbtasklist`,
  )
  console.log(`[INFO] tbtasklist total rows: ${totalRes.rows[0]?.count ?? 0}`)
} finally {
  await pool.end()
}

if (failed) process.exit(1)
