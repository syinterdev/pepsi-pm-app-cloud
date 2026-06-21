/**
 * แก้แถวที่นำเข้าก่อน parser ใส่ prefix 7151- (ให้ปฏิทินเห็นงาน)
 * Usage: npx tsx scripts/fix-functionalloc-7151.ts
 */
import 'dotenv/config'
import { createPool } from '../src/db/pool.js'
import { FACTORY_CODE } from '../src/services/scheduling-shared.js'

const url = process.env.DATABASE_URL?.trim()
if (!url) {
  console.error('DATABASE_URL required')
  process.exit(1)
}

const pool = createPool(url)
try {
  const before = await pool.query<{ n: number }>(
    `SELECT COUNT(*)::int AS n FROM app.tbiw37n WHERE functionalloc ILIKE $1`,
    [`%${FACTORY_CODE}%`],
  )
  const upd = await pool.query(
    `UPDATE app.tbiw37n
     SET functionalloc = ('7151-' || COALESCE(NULLIF(TRIM(funcdescrip), ''), NULLIF(TRIM(equdescrip), ''), NULLIF(TRIM(functionalloc), ''), 'IMPORT'))::varchar(64)
     WHERE functionalloc IS NULL
        OR (TRIM(functionalloc) <> '' AND functionalloc NOT ILIKE $1 AND funcdescrip NOT ILIKE $1)`,
    [`%${FACTORY_CODE}%`],
  )
  const after = await pool.query<{ n: number }>(
    `SELECT COUNT(*)::int AS n FROM app.tbiw37n WHERE functionalloc ILIKE $1`,
    [`%${FACTORY_CODE}%`],
  )
  const view = await pool.query<{ n: number }>(
    `SELECT COUNT(*)::int AS n FROM app.view_order WHERE functionalloc ILIKE $1 AND bscstart > 0`,
    [`%${FACTORY_CODE}%`],
  )
  console.log('ก่อน:', before.rows[0]?.n, 'แถวมี 7151 ใน functionalloc')
  console.log('อัปเดต:', upd.rowCount, 'แถว')
  console.log('หลัง:', after.rows[0]?.n)
  console.log('view_order (ปฏิทิน):', view.rows[0]?.n)
} finally {
  await pool.end()
}
