/**
 * P5.1 dev seed — mock Telegram chat IDs + ack_to_planner group (no real Bot needed for DB/UAT).
 * Usage: npx tsx scripts/seed-telegram-p51-dev.ts
 */
import 'dotenv/config'
import { createPool } from '../src/db/pool.js'

const databaseUrl = process.env.DATABASE_URL?.trim()
if (!databaseUrl) {
  console.error('DATABASE_URL required')
  process.exit(1)
}

const TECH_CHAT: Array<{ wkctr: string; chatId: number }> = [
  { wkctr: 'WC001', chatId: 9_000_001 },
  { wkctr: 'WC002', chatId: 9_000_002 },
]
const PLANNER_GROUP_CHAT = Number(process.env.TELEGRAM_TEST_PLANNER_CHAT_ID ?? -100_900_001)

const pool = createPool(databaseUrl)

try {
  await pool.query('BEGIN')

  for (const t of TECH_CHAT) {
    await pool.query(
      `INSERT INTO app.tbworkcenter (
         idwkctr, pass, wkctr, plnt, wkctrdate, startwork,
         titlewkctr, namewkctr, surnamewkctr, userst
       ) VALUES (
         $1, 'wc001', $1, '7151', 631152000, 946684800,
         'นาย', $2, 'ทดสอบ', 'W'
       )
       ON CONFLICT (idwkctr) DO UPDATE SET userst = 'W'`,
      [t.wkctr, t.wkctr === 'WC001' ? 'ช่างหนึ่ง' : 'ช่างสอง'],
    )
    await pool.query(
      `UPDATE app.tbworkcenter
       SET telegram_chat_id = $2,
           telegram_username = $3,
           telegram_linked_at = COALESCE(telegram_linked_at, NOW())
       WHERE wkctr = $1`,
      [t.wkctr, t.chatId, `dev_${t.wkctr.toLowerCase()}`],
    )
  }

  await pool.query(
    `INSERT INTO app.tbl_telegram_notify_group (code, name, notify_kind, link_type, link_ref, telegram_chat_id, enabled, note)
     VALUES ('p51_dev_planner', 'P5.1 Dev — Planner ack', 'ack_to_planner', 'none', NULL, $1, true, 'seed-telegram-p51-dev')
     ON CONFLICT (code) DO UPDATE SET
       notify_kind = 'ack_to_planner',
       telegram_chat_id = EXCLUDED.telegram_chat_id,
       enabled = true,
       updated_at = NOW()`,
    [PLANNER_GROUP_CHAT],
  )

  await pool.query('COMMIT')
  console.log('[OK] Linked WC001, WC002 with mock telegram_chat_id')
  console.log(`[OK] ack_to_planner group chat_id=${PLANNER_GROUP_CHAT}`)
} catch (err) {
  await pool.query('ROLLBACK').catch(() => {})
  console.error('[FAIL]', err instanceof Error ? err.message : err)
  process.exit(1)
} finally {
  await pool.end()
}
