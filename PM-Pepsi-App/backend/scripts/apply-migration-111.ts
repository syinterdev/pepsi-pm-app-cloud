/**
 * Apply migration 111 via pg (when psql not in PATH).
 * Usage: npx tsx scripts/apply-migration-111.ts
 */
import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createPool } from '../src/db/pool.js'

const databaseUrl = process.env.DATABASE_URL?.trim()
if (!databaseUrl) {
  console.error('DATABASE_URL required')
  process.exit(1)
}

const here = path.dirname(fileURLToPath(import.meta.url))
const sqlPath = path.resolve(here, '../../../database/migrations/111_confirmation_menu_planner_rbac.sql')
const sql = fs.readFileSync(sqlPath, 'utf8')

const pool = createPool(databaseUrl)
try {
  await pool.query(sql)
  console.log('[OK] Applied 111_confirmation_menu_planner_rbac.sql')
} catch (err) {
  console.error('[FAIL]', err instanceof Error ? err.message : err)
  process.exit(1)
} finally {
  await pool.end()
}
