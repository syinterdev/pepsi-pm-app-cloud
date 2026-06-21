import 'dotenv/config'
import { createPool } from '../src/db/pool.js'

const pool = createPool(process.env.DATABASE_URL!)
const r = await pool.query<{
  n: number
  minwo: string
  maxwo: string
  u: number
}>(
  `SELECT COUNT(*)::int AS n, MIN(wkorder) AS minwo, MAX(wkorder) AS maxwo,
          COUNT(DISTINCT wkorder)::int AS u FROM app.tbiw37n`,
)
console.log(JSON.stringify(r.rows[0]))
await pool.end()
