/**
 * P0.3 — check migration 099/100 + admin health pending probes.
 * Usage: npx tsx scripts/verify-migrations-p03.ts
 */
import 'dotenv/config'
import { createPool } from '../src/db/pool.js'
import { getMigrationHealth } from '../src/services/admin-health.js'

const databaseUrl = process.env.DATABASE_URL?.trim()
if (!databaseUrl) {
  console.error('DATABASE_URL required')
  process.exit(1)
}

const pool = createPool(databaseUrl)
let failed = false

function fail(msg: string) {
  console.error(`[FAIL] ${msg}`)
  failed = true
}

function ok(msg: string) {
  console.log(`[OK] ${msg}`)
}

async function columnExists(table: string, column: string): Promise<boolean> {
  const r = await pool.query<{ ok: boolean }>(
    `SELECT EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'app' AND table_name = $1 AND column_name = $2
     ) AS ok`,
    [table, column],
  )
  return r.rows[0]?.ok === true
}

async function tableExists(table: string): Promise<boolean> {
  const r = await pool.query<{ ok: boolean }>(
    `SELECT EXISTS (
       SELECT 1 FROM information_schema.tables
       WHERE table_schema = 'app' AND table_name = $1
     ) AS ok`,
    [table],
  )
  return r.rows[0]?.ok === true
}

try {
  const ackStatus = await columnExists('tbplangingwork', 'ack_status')
  const ackChannel = await columnExists('tbplangingwork', 'ack_channel')
  const ackAt = await columnExists('tbplangingwork', 'ack_at')
  const notifyGroup = await tableExists('tbl_telegram_notify_group')
  const linkToken = await tableExists('tbl_telegram_link_token')
  const tgChat = await columnExists('tbworkcenter', 'telegram_chat_id')

  if (!ackStatus || !ackChannel || !ackAt) {
    fail(`099 incomplete: ack_status=${ackStatus} ack_channel=${ackChannel} ack_at=${ackAt}`)
  } else ok('099: tbplangingwork ack_status / ack_at / ack_channel')

  if (!notifyGroup) fail('099 incomplete: tbl_telegram_notify_group missing')
  else ok('099: tbl_telegram_notify_group')

  if (!tgChat) fail('099 incomplete: tbworkcenter.telegram_chat_id missing')
  else ok('099: tbworkcenter telegram link columns')

  if (!linkToken) fail('100 incomplete: tbl_telegram_link_token missing')
  else ok('100: tbl_telegram_link_token')

  const health = await getMigrationHealth(pool)
  console.log(
    `\n[INFO] admin/health migration: status=${health.status} applied=${health.appliedCount} pending=${health.pendingCount} unverified=${health.unverifiedCount}`,
  )
  if (health.pendingCount > 0) {
    for (const p of health.probes.filter((x) => x.status === 'pending')) {
      console.log(`  pending: ${p.id} ${p.file} — ${p.label}`)
    }
    fail(`${health.pendingCount} tracked migration(s) still pending`)
  } else ok(`admin/health: no tracked pending migrations (${health.pendingCount})`)
} finally {
  await pool.end()
}

if (failed) process.exit(1)
