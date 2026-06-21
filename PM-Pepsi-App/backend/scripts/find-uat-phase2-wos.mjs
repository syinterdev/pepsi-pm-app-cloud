import 'dotenv/config'
import { createPool } from '../src/db/pool.ts'

const pool = createPool(process.env.DATABASE_URL)
try {
  const readings = await pool.query(`
    SELECT i.wkorder, i.mntplan, COUNT(r.*)::int AS readings
    FROM app.tbiw37n i
    INNER JOIN app.tbwo_pm_reading r ON r.idiw37 = i.idiw37
    GROUP BY i.wkorder, i.mntplan
    ORDER BY readings DESC
    LIMIT 5
  `)
  const noMntplan = await pool.query(`
    SELECT wkorder, mntplan
    FROM app.tbiw37n
    WHERE mntplan IS NULL OR TRIM(mntplan) = '' OR TRIM(mntplan) = '-'
    LIMIT 5
  `)
  console.log(JSON.stringify({ readings: readings.rows, noMntplan: noMntplan.rows }, null, 2))
} finally {
  await pool.end()
}
