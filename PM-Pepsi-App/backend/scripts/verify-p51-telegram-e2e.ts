/**
 * P5.1 — Telegram flow verify (assign → webhook ack → DB + planner group resolve).
 * Without TELEGRAM_BOT_TOKEN: tests DB/webhook handler only (no real DM).
 * With token: also checks getMe + getWebhookInfo.
 *
 * Usage:
 *   npx tsx scripts/seed-telegram-p51-dev.ts
 *   npx tsx scripts/verify-p51-telegram-e2e.ts
 */
import 'dotenv/config'
import { createPool } from '../src/db/pool.js'
import { isTelegramBotConfigured, getTelegramBotToken } from '../src/lib/telegram-bot.js'
import { assignWorkOrderPlanningBatch } from '../src/services/work-orders.js'
import { getPlanningAssignmentByKey } from '../src/services/planning-ack.js'
import { handleTelegramUpdate } from '../src/services/telegram-webhook.js'
import {
  buildNotifyContextForWo,
  resolveNotifyGroupChatIds,
} from '../src/services/telegram-notify-groups.js'

const databaseUrl = process.env.DATABASE_URL?.trim()
if (!databaseUrl) {
  console.error('DATABASE_URL required')
  process.exit(1)
}

const pool = createPool(databaseUrl)
const results: Array<{ step: string; ok: boolean; detail?: string }> = []

function log(step: string, ok: boolean, detail = '') {
  console.log(`[${ok ? 'PASS' : 'FAIL'}] ${step}${detail ? ` — ${detail}` : ''}`)
  results.push({ step, ok, detail })
}

async function pickAssignableWo(): Promise<number> {
  const r = await pool.query<{ idiw37: number }>(
    `SELECT i.idiw37
     FROM app.tbiw37n i
     WHERE i.syst IN ('CRTD', 'REL')
       AND NOT EXISTS (SELECT 1 FROM app.tbplangingwork p WHERE p.idiw37 = i.idiw37 AND p.wkctr = 'WC001')
     ORDER BY i.idiw37 DESC
     LIMIT 1`,
  )
  const id = r.rows[0]?.idiw37
  if (!id) throw new Error('no WO available for assign test')
  return id
}

try {
  // Env / Bot
  if (isTelegramBotConfigured()) {
    log('TELEGRAM_BOT_TOKEN configured', true)
    const token = getTelegramBotToken()!
    const me = await fetch(`https://api.telegram.org/bot${token}/getMe`).then((r) => r.json()) as {
      ok?: boolean
      result?: { username?: string }
    }
    log('Bot getMe', me.ok === true, me.result?.username ? `@${me.result.username}` : '')
    const wh = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`).then((r) => r.json()) as {
      ok?: boolean
      result?: { url?: string }
    }
    const url = wh.result?.url ?? ''
    log(
      'Webhook registered',
      url.includes('/api/v1/telegram/webhook'),
      url || '(empty — run npm run telegram:set-webhook)',
    )
  } else {
    log('TELEGRAM_BOT_TOKEN configured', false, 'set in .env for production DM (dev DB test continues)')
  }

  // Linked technicians
  const linked = await pool.query<{ wkctr: string; telegram_chat_id: string }>(
    `SELECT wkctr, telegram_chat_id::text
     FROM app.tbworkcenter
     WHERE wkctr IN ('WC001', 'WC002') AND telegram_chat_id IS NOT NULL`,
  )
  log(
    'Technicians linked (≥2)',
    linked.rows.length >= 2,
    linked.rows.map((r) => `${r.wkctr}=${r.telegram_chat_id}`).join(', ') || 'run seed-telegram-p51-dev.ts',
  )

  // ack_to_planner group
  const grp = await pool.query<{ code: string; telegram_chat_id: string }>(
    `SELECT code, telegram_chat_id::text
     FROM app.tbl_telegram_notify_group
     WHERE notify_kind = 'ack_to_planner' AND enabled AND telegram_chat_id IS NOT NULL
     LIMIT 1`,
  )
  log(
    'ack_to_planner group in Admin DB',
    grp.rows.length > 0,
    grp.rows[0] ? `${grp.rows[0].code} chat=${grp.rows[0].telegram_chat_id}` : 'create at /admin/telegram or run seed',
  )

  // Assign + ack via webhook
  const idiw37 = await pickAssignableWo()
  const assign = await assignWorkOrderPlanningBatch(pool, String(idiw37), ['WC001'], 'P5.1 verify', 'ADMIN01')
  if (!assign) throw new Error(`assign failed for idiw37=${idiw37}`)
  log('Planner assign WC001', true, `idiw37=${idiw37}`)

  const row = await getPlanningAssignmentByKey(pool, idiw37, 'WC001')
  if (!row) throw new Error('assignment row missing')
  const chatId = Number(linked.rows.find((r) => r.wkctr === 'WC001')?.telegram_chat_id ?? 9_000_001)

  await handleTelegramUpdate(pool, {
    update_id: Date.now(),
    callback_query: {
      id: `cq-${Date.now()}`,
      from: { id: chatId, username: 'dev_wc001' },
      message: { message_id: 1, chat: { id: chatId, type: 'private' } },
      data: `a:${row.idplanw}`,
    },
  })

  const after = await getPlanningAssignmentByKey(pool, idiw37, 'WC001')
  log(
    'Technician ack via Telegram callback',
    after?.ack_status === 'acknowledged' && after?.ack_channel === 'telegram',
    `status=${after?.ack_status} channel=${after?.ack_channel}`,
  )

  const ctx = await buildNotifyContextForWo(pool, idiw37, ['WC001'])
  const plannerChats = await resolveNotifyGroupChatIds(pool, 'ack_to_planner', ctx)
  log(
    'Planner notify groups resolved',
    plannerChats.length > 0,
    `chatIds=${plannerChats.join(',')}`,
  )

  // Webhook HTTP (if API up)
  const apiBase = process.env.APP_PUBLIC_URL?.trim() || 'http://127.0.0.1:4000'
  try {
    const res = await fetch(`${apiBase}/api/v1/telegram/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.TELEGRAM_WEBHOOK_SECRET
          ? { 'X-Telegram-Bot-Api-Secret-Token': process.env.TELEGRAM_WEBHOOK_SECRET }
          : {}),
      },
      body: JSON.stringify({ update_id: Date.now() + 1 }),
    })
    log('POST /api/v1/telegram/webhook', res.ok, `status=${res.status}`)
  } catch (err) {
    log('POST /api/v1/telegram/webhook', false, err instanceof Error ? err.message : String(err))
  }
} catch (err) {
  log('P5.1 E2E', false, err instanceof Error ? err.message : String(err))
} finally {
  await pool.end()
}

const failed = results.filter((r) => !r.ok)
const critical = failed.filter(
  (r) =>
    !r.step.includes('TELEGRAM_BOT_TOKEN') &&
    !r.step.includes('Webhook registered') &&
    !r.step.includes('POST /api/v1/telegram/webhook'),
)
console.log(`\nSummary: ${results.length - failed.length}/${results.length} passed (${critical.length} critical fail)`)
if (critical.length > 0) process.exit(1)
