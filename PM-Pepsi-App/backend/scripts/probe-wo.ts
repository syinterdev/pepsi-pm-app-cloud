/**
 * Probe a WO in DB — usage: npx tsx scripts/probe-wo.ts 4001560529
 */
import 'dotenv/config'
import { createPool } from '../src/db/pool.js'

const wo = process.argv[2]?.trim() || '4001560529'
const databaseUrl = process.env.DATABASE_URL?.trim()
if (!databaseUrl) {
  console.error('DATABASE_URL not set')
  process.exit(1)
}

const pool = createPool(databaseUrl)

async function q<T>(label: string, sql: string, params: unknown[] = []) {
  try {
    const r = await pool.query<T>(sql, params)
    console.log(`\n--- ${label} (${r.rows.length}) ---`)
    console.log(JSON.stringify(r.rows, null, 2))
  } catch (e) {
    console.log(`\n--- ${label} ERR ---`, e instanceof Error ? e.message : e)
  }
}

await q(
  'tbiw37n',
  `SELECT idiw37, wkorder, wktype, syst, mntplan, wkctr, team, bscstart, actfinish,
    to_timestamp(NULLIF(bscstart,0)) AT TIME ZONE 'Asia/Bangkok' AS bscstart_dt,
    to_timestamp(NULLIF(actfinish,0)) AT TIME ZONE 'Asia/Bangkok' AS actfinish_dt
   FROM app.tbiw37n WHERE wkorder = $1`,
  [wo],
)

await q(
  'tbplangingwork',
  `SELECT mp.* FROM app.tbplangingwork mp
   JOIN app.tbiw37n i ON i.idiw37 = mp.idiw37 WHERE i.wkorder = $1`,
  [wo],
)

await q(
  'view_planwork',
  `SELECT idiw37, wkorder, syst, wkctr, idwkctr, bscstart, cday,
    to_timestamp(NULLIF(bscstart,0)) AT TIME ZONE 'Asia/Bangkok' AS bscstart_dt,
    to_timestamp(NULLIF(cday,0)) AT TIME ZONE 'Asia/Bangkok' AS cday_dt
   FROM app.view_planwork WHERE wkorder = $1`,
  [wo],
)

await q(
  'tbmoveplan',
  `SELECT mp.* FROM app.tbmoveplan mp
   JOIN app.tbiw37n i ON i.idiw37 = mp.idiw37 WHERE i.wkorder = $1`,
  [wo],
)

await q(
  'pipeline',
  `SELECT i.idiw37,
    (SELECT COUNT(*)::int FROM app.tbplangingwork p WHERE p.idiw37 = i.idiw37) AS assign_count,
    (SELECT COUNT(*)::int FROM app.tbwrkclose w WHERE w.idiw37 = i.idiw37) AS worktime_count,
    (SELECT COUNT(*)::int FROM app.tbplangingwork p WHERE p.idiw37 = i.idiw37 AND p.ack_status = 'pending') AS ack_pending
   FROM app.tbiw37n i WHERE i.wkorder = $1`,
  [wo],
)

await q(
  'plan-calendar visibility (June 2026)',
  `SELECT pw.wkorder, pw.idwkctr, pw.wkctr, pw.syst,
    to_timestamp(COALESCE(NULLIF(pw.cday,0), pw.bscstart)) AT TIME ZONE 'Asia/Bangkok' AS display_dt
   FROM app.view_planwork pw
   WHERE pw.wkorder = $1
     AND pw.bscstart IS NOT NULL AND pw.bscstart > 0
     AND COALESCE(NULLIF(pw.cday, 0), pw.bscstart) >= extract(epoch from timestamptz '2026-06-01 00:00:00+07')::bigint
     AND COALESCE(NULLIF(pw.cday, 0), pw.bscstart) < extract(epoch from timestamptz '2026-07-01 00:00:00+07')::bigint`,
  [wo],
)

await q(
  'workcenters',
  `SELECT idwkctr, wkctr, namewkctr, surnamewkctr
   FROM app.tbworkcenter
   WHERE wkctr = ANY($1::text[]) OR idwkctr = ANY($1::text[])
   ORDER BY wkctr`,
  [['WC001', 'WC002', 'PRO001']],
)

await pool.end()
