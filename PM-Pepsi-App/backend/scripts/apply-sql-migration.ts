/**
 * Apply a SQL migration file: npx tsx scripts/apply-sql-migration.ts <path-to.sql>
 */
import 'dotenv/config'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { createPool } from '../src/db/pool.js'

const file = process.argv[2]
const databaseUrl = process.env.DATABASE_URL?.trim()
if (!databaseUrl) {
  console.error('DATABASE_URL required')
  process.exit(1)
}
if (!file) {
  console.error('Usage: npx tsx scripts/apply-sql-migration.ts <path-to.sql>')
  process.exit(1)
}

const pool = createPool(databaseUrl)
try {
  const sql = await readFile(path.resolve(file), 'utf8')
  await pool.query(sql)
  console.log(`Applied: ${file}`)
} catch (err) {
  console.error(err)
  process.exit(1)
} finally {
  await pool.end().catch(() => {})
}
