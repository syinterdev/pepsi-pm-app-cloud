/**
 * Apply migration 099 + 100 via psql (idempotent SQL).
 * Usage: npm run migrate:telegram
 */
import 'dotenv/config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { isPsqlAvailable, runPsqlSqlFile } from '../src/services/pg-dump-backup.js'

const databaseUrl = process.env.DATABASE_URL?.trim()
if (!databaseUrl) {
  console.error('DATABASE_URL required')
  process.exit(1)
}

const here = path.dirname(fileURLToPath(import.meta.url))
const migrationsDir = path.resolve(here, '../../../database/migrations')
const files = ['099_telegram_notify.sql', '100_telegram_link_token.sql']

if (!(await isPsqlAvailable())) {
  console.error('psql not found in PATH — set PSQL_PATH or install PostgreSQL client')
  process.exit(1)
}

for (const file of files) {
  const filePath = path.join(migrationsDir, file)
  console.log(`Applying ${file}…`)
  await runPsqlSqlFile(databaseUrl, filePath)
  console.log(`[OK] ${file}`)
}
