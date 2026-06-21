import type { Pool } from 'pg'
import { getTelegramWebAppUrl } from '../lib/telegram-web-url.js'
import {
  isTelegramBotConfigured,
  isTelegramNotifyEnabled,
  sendTelegramMessage,
} from '../lib/telegram-bot.js'
import { createAppNotification } from './app-notifications.js'
import {
  buildNotifyContextForWo,
  resolveNotifyGroupChatIds,
} from './telegram-notify-groups.js'

type WoSnapshot = {
  wkorder: string
  wktype: string | null
  operationshorttext: string | null
}

async function loadWoSnapshot(pool: Pool, idiw37: number): Promise<WoSnapshot | null> {
  const { rows } = await pool.query<WoSnapshot>(
    `SELECT wkorder, wktype, operationshorttext FROM app.tbiw37n WHERE idiw37 = $1`,
    [idiw37],
  )
  return rows[0] ?? null
}

async function loadTechDisplayName(pool: Pool, wkctr: string): Promise<string> {
  const { rows } = await pool.query<{
    titlewkctr: string | null
    namewkctr: string | null
    surnamewkctr: string | null
  }>(
    `SELECT titlewkctr, namewkctr, surnamewkctr FROM app.tbworkcenter WHERE wkctr = $1`,
    [wkctr],
  )
  const r = rows[0]
  if (!r) return wkctr
  const name = [r.titlewkctr, r.namewkctr, r.surnamewkctr]
    .map((p) => (p ?? '').trim())
    .filter(Boolean)
    .join(' ')
  return name || wkctr
}

/**
 * แจ้ง Planner หลังช่างปิดงาน supervisor — Telegram + in-app
 */
export async function notifyPlannerWorkClosed(
  pool: Pool,
  idiw37: number,
  closedByWkctr: string,
): Promise<void> {
  const wo = await loadWoSnapshot(pool, idiw37)
  if (!wo) return

  const displayName = await loadTechDisplayName(pool, closedByWkctr.trim())
  const title = wo.operationshorttext?.trim() || wo.wkorder
  const wktype = wo.wktype?.trim() || '—'
  const closedAt = new Date().toLocaleString('th-TH')
  const linkRoute = `/confirmation?idiw37=${idiw37}`

  const bodyLines = [
    `WO: ${wo.wkorder}`,
    `ประเภท: ${wktype}`,
    `ช่าง: ${closedByWkctr} — ${displayName}`,
    `เวลาปิด: ${closedAt}`,
    'สถานะ: รอ Planner Confirm',
  ]

  await createAppNotification(pool, {
    notifyKind: 'close_pending_qc',
    audience: 'planner',
    idiw37,
    title: `ปิดงานรอ Confirm — ${wo.wkorder}`,
    body: bodyLines.join('\n'),
    linkRoute,
  })

  if (!isTelegramBotConfigured() || !isTelegramNotifyEnabled()) return

  const assignR = await pool.query<{ wkctr: string }>(
    `SELECT wkctr FROM app.tbplangingwork WHERE idiw37 = $1`,
    [idiw37],
  )
  const ctx = await buildNotifyContextForWo(
    pool,
    idiw37,
    assignR.rows.map((r) => r.wkctr),
  )

  const text = [
    '📋 ช่างปิดงานแล้ว — รอ Planner Confirm',
    ...bodyLines,
    `\nเปิด: ${getTelegramWebAppUrl()}${linkRoute}`,
  ].join('\n')

  const chatIds = await resolveNotifyGroupChatIds(pool, 'close_to_planner', ctx)
  for (const chatId of chatIds) {
    const result = await sendTelegramMessage(chatId, text)
    if (!result.ok) {
      console.error('[telegram/close-planner]', chatId, result.error)
    }
  }
}
