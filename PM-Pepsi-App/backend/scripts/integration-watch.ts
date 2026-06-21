/**
 * One-shot SAP inbound folder scan (inbound/iw37n + inbound/confirm).
 *
 * Usage:
 *   DATABASE_URL=... npm run integration:watch
 *
 * Disable in-process scheduler on API: INTEGRATION_WATCH_SCHEDULER=0
 */
import 'dotenv/config'
import { createPool } from '../src/db/pool.js'
import { runInboundIntegrationScan } from '../src/services/integration-watch.js'

const databaseUrl = process.env.DATABASE_URL?.trim()
if (!databaseUrl) {
  console.error('DATABASE_URL is required')
  process.exit(1)
}

const pool = createPool(databaseUrl)

try {
  const job = await runInboundIntegrationScan(pool, {
    trigger: 'manual',
    startedBy: 'cli',
  })
  console.log(
    JSON.stringify(
      {
        jobId: job.id,
        status: job.status,
        summary: job.summary,
      },
      null,
      2,
    ),
  )
  process.exit(job.status === 'failed' ? 1 : 0)
} catch (err) {
  console.error(err)
  process.exit(1)
} finally {
  await pool.end().catch(() => {})
}
