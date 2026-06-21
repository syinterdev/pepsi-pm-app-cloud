import pg from 'pg'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const here = path.dirname(fileURLToPath(import.meta.url))
const env = readFileSync(path.join(here, '../.env'), 'utf8')
const m = env.match(/^DATABASE_URL=(.+)$/m)
if (!m) {
  console.log(JSON.stringify({ error: 'NO_DATABASE_URL' }))
  process.exit(1)
}

const pool = new pg.Pool({ connectionString: m[1].trim() })

try {
  const iw = await pool.query('SELECT COUNT(*)::int AS n FROM app.tbiw37n')
  const batches = await pool.query(
    'SELECT id, file_name, row_count, imported_at FROM app.tbiw37n_import_batch ORDER BY id DESC LIMIT 3',
  )
  const mp = await pool.query(`
    SELECT discipline, status, source_filename, version_no, imported_at
    FROM app.tb_master_plan_workbook
    WHERE plan_year = 2026
    ORDER BY discipline, status
  `)
  const tasklist = await pool.query('SELECT COUNT(*)::int AS n FROM app.tbtasklist')
  const taskSample = await pool.query(`
    SELECT COUNT(*)::int AS with_pmman
    FROM app.tbtasklist
    WHERE pmman IS NOT NULL AND TRIM(pmman::text) <> ''
  `)
  const ms = await pool.query(`
    SELECT COUNT(*)::int AS with_ms FROM app.tbtasklist WHERE machinestatus IS NOT NULL
  `)
  const wo = await pool.query(
    `SELECT wkorder, mntplan FROM app.tbiw37n WHERE wkorder = '4001565681' LIMIT 1`,
  )
  const woAny = await pool.query(`
    SELECT wkorder, mntplan FROM app.tbiw37n
    WHERE mntplan IS NOT NULL AND TRIM(mntplan) <> ''
    LIMIT 5
  `)
  const woTasklistMatches = await pool.query(`
    SELECT COUNT(DISTINCT w.wkorder)::int AS wo_with_tasks
    FROM app.tbiw37n w
    INNER JOIN app.tbtasklist t ON TRIM(t.mntplan) = TRIM(w.mntplan)
  `)
  const sampleJoin = await pool.query(`
    SELECT w.wkorder, w.mntplan, COUNT(t.*)::int AS tasks
    FROM app.tbiw37n w
    LEFT JOIN app.tbtasklist t ON TRIM(t.mntplan) = TRIM(w.mntplan)
    WHERE w.wkorder = '4000126314'
    GROUP BY w.wkorder, w.mntplan
  `)
  const sampleTasks = await pool.query(`
    SELECT machine, pmlist, pmman, machinestatus
    FROM app.tbtasklist WHERE TRIM(mntplan) = '346012' LIMIT 3
  `)
  const published = mp.rows.filter((r) => r.status === 'published')
  const draft = mp.rows.filter((r) => r.status === 'draft')
  console.log(
    JSON.stringify(
      {
        iw37n: iw.rows[0],
        batches: batches.rows,
        masterPlan: mp.rows,
        publishedDisciplines: published.map((r) => r.discipline),
        draftDisciplines: draft.map((r) => r.discipline),
        tasklistTotal: tasklist.rows[0].n,
        tasklistWithPmman: taskSample.rows[0].with_pmman,
        tasklistWithMachineStatus: ms.rows[0].with_ms,
        wo4001565681: wo.rows[0] ?? null,
        sampleWo: woAny.rows,
        sampleJoin: sampleJoin.rows[0] ?? null,
        sampleTasks: sampleTasks.rows,
        woWithMatchingTasklist: woTasklistMatches.rows[0]?.wo_with_tasks ?? 0,
      },
      null,
      2,
    ),
  )
} catch (e) {
  console.log(JSON.stringify({ error: e.message }))
} finally {
  await pool.end()
}
