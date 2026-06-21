import 'dotenv/config'
import pg from 'pg'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })

async function main() {
  const batches = await pool.query(`
    SELECT id, file_name, status, row_count, inserted_count, updated_count, skipped_count,
           imported_at, LEFT(sha256, 12) AS sha
    FROM app.tbiw37n_import_batch
    ORDER BY id DESC
    LIMIT 10
  `)
  console.log('=== IW37N batches (latest 10) ===')
  console.table(batches.rows)

  const dup = await pool.query(
    `SELECT sha256, COUNT(*)::int AS batches, MIN(id) AS first_id
     FROM app.tbiw37n_import_batch GROUP BY sha256 HAVING COUNT(*) > 1`,
  )
  if (dup.rows.length) {
    console.log('\nDuplicate SHA256 (same file re-uploaded):')
    console.table(dup.rows)
  }

  for (const b of batches.rows.slice(0, 3)) {
    const acts = await pool.query(
      `SELECT action, COUNT(*)::int AS n
       FROM app.tbiw37n_import_row
       WHERE batch_id = $1
       GROUP BY action
       ORDER BY action`,
      [b.id],
    )
    console.log(`Batch #${b.id} ${b.file_name}:`, acts.rows)
  }

  try {
    const jobs = await pool.query(`
      SELECT id, job_type, status, file_name, batch_id::text, error_text, finished_at
      FROM app.integration_job
      ORDER BY id DESC
      LIMIT 8
    `)
    console.log('\n=== integration_job ===')
    console.table(jobs.rows)
  } catch (e) {
    console.log('integration_job:', (e as Error).message)
  }

  const cofirm = await pool.query(`SELECT COUNT(*)::int AS n FROM app.tbcofirm`)
  const iw37n = await pool.query(`SELECT COUNT(*)::int AS n FROM app.tbiw37n`)
  console.log('\nCounts: tbiw37n =', iw37n.rows[0].n, '| tbcofirm =', cofirm.rows[0].n)

  try {
    const audit = await pool.query(`
      SELECT id, action, resource, created_at,
             payload->>'fileName' AS file_name,
             payload->>'inserted' AS inserted,
             payload->>'updated' AS updated
      FROM app.audit_log
      WHERE action IN ('iw37n.import', 'confirmation.import')
      ORDER BY created_at DESC
      LIMIT 6
    `)
    console.log('\n=== audit (recent imports) ===')
    console.table(audit.rows)
  } catch {
    /* audit schema optional */
  }
}

main()
  .finally(() => pool.end())
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
