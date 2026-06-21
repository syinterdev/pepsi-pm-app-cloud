/**
 * Import IW37N from customer Excel (default: ZB02All template).
 * Usage: npm run import:iw37n [path-to.xlsx]
 */
import 'dotenv/config'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createPool } from '../src/db/pool.js'
import { importIw37nFile } from '../src/services/iw37n.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(here, '../../..')
const DEFAULT_FILE = path.join(
  repoRoot,
  'docs from customer/Templete IW37N on PM App - ZB02All.xlsx',
)

const databaseUrl = process.env.DATABASE_URL?.trim()
if (!databaseUrl) {
  console.error('DATABASE_URL required')
  process.exit(1)
}

const filePath = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_FILE
const pool = createPool(databaseUrl)

try {
  const buf = await readFile(filePath)
  const fileName = path.basename(filePath)
  const result = await importIw37nFile(pool, fileName, buf)
  const { batch, rows } = result
  const inserted = rows.filter((r) => r.action === 'inserted').length
  const updated = rows.filter((r) => r.action === 'updated').length
  const errors = rows.filter((r) => r.action === 'error').length
  console.log(
    `[OK] ${fileName}: batch #${batch.id} status=${batch.status} ` +
      `inserted=${inserted} updated=${updated} errors=${errors} total=${rows.length}`,
  )
} finally {
  await pool.end()
}
