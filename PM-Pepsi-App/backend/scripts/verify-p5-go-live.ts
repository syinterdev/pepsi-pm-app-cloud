/**
 * P5 — go-live readiness (DB migrations, menu, RBAC, backup settings, Telegram env).
 * Usage: npx tsx scripts/verify-p5-go-live.ts
 */
import 'dotenv/config'
import { createPool } from '../src/db/pool.js'
import { getBackupSettings } from '../src/services/admin-backup.js'
import { getMigrationHealth } from '../src/services/admin-health.js'
import { isTelegramBotConfigured } from '../src/lib/telegram-bot.js'

const databaseUrl = process.env.DATABASE_URL?.trim()
if (!databaseUrl) {
  console.error('DATABASE_URL required')
  process.exit(1)
}

const pool = createPool(databaseUrl)
let failed = 0
let warned = 0

function fail(msg: string) {
  console.error(`[FAIL] ${msg}`)
  failed += 1
}

function warn(msg: string) {
  console.warn(`[WARN] ${msg}`)
  warned += 1
}

function ok(msg: string) {
  console.log(`[OK] ${msg}`)
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

async function roleHasPerm(role: string, perm: string): Promise<boolean> {
  const r = await pool.query<{ ok: boolean }>(
    `SELECT EXISTS (
       SELECT 1 FROM app.tbl_role_permission
       WHERE role_code = $1 AND perm_code = $2 AND granted = true
     ) AS ok`,
    [role, perm],
  )
  return r.rows[0]?.ok === true
}

try {
  // P5.1 Telegram schema
  if (!(await tableExists('tbl_telegram_notify_group'))) {
    fail('099: tbl_telegram_notify_group missing — run npm run migrate:telegram')
  } else ok('099: tbl_telegram_notify_group')

  if (!(await tableExists('tbl_telegram_link_token'))) {
    fail('100: tbl_telegram_link_token missing — run npm run migrate:telegram')
  } else ok('100: tbl_telegram_link_token')

  if (isTelegramBotConfigured()) ok('TELEGRAM_BOT_TOKEN set')
  else warn('TELEGRAM_BOT_TOKEN not set — BotFather + .env before production UAT')

  if (process.env.TELEGRAM_WEBHOOK_SECRET?.trim()) ok('TELEGRAM_WEBHOOK_SECRET set')
  else warn('TELEGRAM_WEBHOOK_SECRET empty — recommended for production webhook')

  if (process.env.APP_PUBLIC_URL?.trim()) ok(`APP_PUBLIC_URL=${process.env.APP_PUBLIC_URL.trim()}`)
  else warn('APP_PUBLIC_URL empty — required for setWebhook script')

  // P5.2 Backup
  const backup = await getBackupSettings(pool)
  ok(`backup target: ${backup.targetDir} (default D:/PM-Pepsi-App/backup)`)
  ok(`backup schedule cron: ${backup.scheduleCron}`)
  ok(`backup retention days: ${backup.retentionDays}`)

  // P5.3 Menu + Planner RBAC (migration 111)
  const personnelMenu = await pool.query<{ n: string }>(
    `SELECT COUNT(*)::text AS n FROM app.tbmenu
     WHERE react_route = '/personnel/confirm'
        OR menulink ILIKE '%M_personel_confirm%'`,
  )
  if (Number(personnelMenu.rows[0]?.n ?? 0) > 0) {
    fail('tbmenu still has /personnel/confirm — run migration 111_confirmation_menu_planner_rbac.sql')
  } else ok('tbmenu: /personnel/confirm removed')

  const confirmMenu = await pool.query<{ menutitle: string; menuright: string }>(
    `SELECT menutitle, menuright FROM app.tbmenu WHERE react_route = '/confirmation' LIMIT 1`,
  )
  const cm = confirmMenu.rows[0]
  if (!cm) warn('tbmenu: no /confirmation row (fallback nav-config still applies)')
  else {
    if (cm.menuright === 'A:U') ok('tbmenu /confirmation menuright A:U (Planner+, not Technician sidebar)')
    else warn(`tbmenu /confirmation menuright=${cm.menuright} (expected A:U)`)
  }

  for (const perm of ['confirmation.read', 'confirmation.import', 'confirmation.export'] as const) {
    if (await roleHasPerm('U', perm)) ok(`Planner U: ${perm}`)
    else fail(`Planner U missing ${perm} — run migration 111`)
  }

  const health = await getMigrationHealth(pool)
  console.log(
    `\n[INFO] migrations: status=${health.status} applied=${health.appliedCount} pending=${health.pendingCount}`,
  )
  if (health.pendingCount > 0) {
    for (const p of health.probes.filter((x) => x.status === 'pending')) {
      console.log(`  pending: ${p.file}`)
    }
    fail(`${health.pendingCount} tracked migration(s) pending — /admin/health → Run migrate`)
  } else ok('admin/health: no tracked pending migrations')
} finally {
  await pool.end()
}

console.log(`\nSummary: ${failed} fail, ${warned} warn`)
if (failed > 0) process.exit(1)
