/**
 * ล้างเฉพาะ IW37N + import batches — เตรียม UAT อัปโหลดซ้ำที่ /integration
 * Usage: npx tsx scripts/uat-reset-iw37n.ts
 */
import 'dotenv/config'
import { createPool } from '../src/db/pool.js'

const databaseUrl = process.env.DATABASE_URL?.trim()
if (!databaseUrl) {
  console.error('DATABASE_URL required')
  process.exit(1)
}

const pool = createPool(databaseUrl)

try {
  console.log('Deleting IW37N import data (keeps tbcofirm / confirm)…')
  await pool.query('DELETE FROM app.tbiw37n_import_row')
  await pool.query('DELETE FROM app.tbiw37n_import_batch')
  await pool.query('DELETE FROM app.tbmoveplan')
  await pool.query('DELETE FROM app.tbiw37n')
  const n = await pool.query<{ c: number }>(`SELECT COUNT(*)::int AS c FROM app.tbiw37n`)
  console.log(`Done. tbiw37n rows=${n.rows[0]?.c ?? 0}`)
  console.log('Next: open http://localhost:5173/integration → IW37N tab → upload fresh file.')
} finally {
  await pool.end()
}
