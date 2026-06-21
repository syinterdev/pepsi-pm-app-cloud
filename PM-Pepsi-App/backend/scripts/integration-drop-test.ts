/**
 * Phase 2 UAT: สร้างโฟลเดอร์ integration + copy ไฟล์ IW37N ตัวอย่าง + รัน inbound scan
 *
 * Usage (from backend/):
 *   npx tsx scripts/integration-drop-test.ts
 *   npx tsx scripts/integration-drop-test.ts "C:/path/to/IW37N.xlsx"
 */
import 'dotenv/config'
import { copyFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createPool } from '../src/db/pool.js'
import { getIntegrationDirs, ensureIntegrationDirs } from '../src/services/integration-paths.js'
import { runInboundIntegrationScan } from '../src/services/integration-watch.js'

const databaseUrl = process.env.DATABASE_URL?.trim()
if (!databaseUrl) {
  console.error('DATABASE_URL is required in backend/.env')
  process.exit(1)
}

const defaultSample = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../from customer/SAP data/Data/IW37N ล่าสุด.xlsx',
)

const samplePath = process.argv[2]?.trim() || defaultSample
const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
const dropName = `IW37N-drop-test-${stamp}.xlsx`

const dirs = getIntegrationDirs()
await ensureIntegrationDirs(dirs)

console.log('Integration root:', dirs.root)
console.log('Inbound IW37N:', dirs.inboundIw37n)

const dest = path.join(dirs.inboundIw37n, dropName)
await copyFile(samplePath, dest)
console.log('Dropped file:', dest)

const pool = createPool(databaseUrl)
try {
  const job = await runInboundIntegrationScan(pool, {
    trigger: 'manual',
    startedBy: 'integration-drop-test',
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
