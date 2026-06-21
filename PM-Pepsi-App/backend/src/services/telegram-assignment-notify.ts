import type { Pool } from 'pg'
import { getTelegramWebAppUrl } from '../lib/telegram-web-url.js'
import {
  isTelegramBotConfigured,
  isTelegramNotifyEnabled,
  sendTelegramMessage,
  sendTelegramMessageWithKeyboard,
  type InlineKeyboardButton,
} from '../lib/telegram-bot.js'
import { getAssignmentIdplanw } from './planning-ack.js'
import {
  buildNotifyContextForWo,
  resolveNotifyGroupChatIds,
} from './telegram-notify-groups.js'
import { buildTelegramConfirmKeyboard } from './telegram-confirm.js'

type WoSnapshot = {
  wkorder: string
  wktype: string | null
  operationshorttext: string | null
  bscstart: string | number | null
}

function unixToDisplayDate(sec: string | number | null): string {
  if (sec == null || sec === '') return '—'
  const n = Number(sec)
  if (!Number.isFinite(n) || n <= 0) return '—'
  return new Date(n * 1000).toLocaleDateString('th-TH')
}

async function loadWoSnapshot(pool: Pool, idiw37: number): Promise<WoSnapshot | null> {
  const { rows } = await pool.query<WoSnapshot>(
    `SELECT wkorder, wktype, operationshorttext, bscstart
     FROM app.tbiw37n WHERE idiw37 = $1`,
    [idiw37],
  )
  return rows[0] ?? null
}

function buildAssignmentMessage(
  wo: WoSnapshot,
  actorWkctr: string,
): string {
  const title = wo.operationshorttext?.trim() || wo.wkorder
  const wktype = wo.wktype?.trim() || '—'
  const planDate = unixToDisplayDate(wo.bscstart)
  return [
    '🔧 งานใหม่มอบหมายให้คุณ',
    `WO: ${wo.wkorder}`,
    `ประเภท: ${wktype} · ${title}`,
    `วันที่แผน: ${planDate}`,
    `มอบหมายโดย: ${actorWkctr || '—'}`,
  ].join('\n')
}

function ackCallbackData(idplanw: number): string {
  return `a:${idplanw}`
}

export function parseAckCallbackData(data: string): number | null {
  const m = /^a:(\d+)$/.exec(data.trim())
  if (!m) return null
  const id = Number(m[1])
  return Number.isFinite(id) && id > 0 ? id : null
}

/**
 * แจ้ง DM ช่างที่เพิ่งถูกจ่ายงาน (เฉพาะ assigned[] — ไม่ส่งซ้ำถ้า skipped)
 */
export async function notifyNewPlanningAssignments(
  pool: Pool,
  idiw37: number,
  assignedWkctrs: string[],
  actorWkctr: string,
): Promise<void> {
  if (!isTelegramBotConfigured() || !isTelegramNotifyEnabled()) return
  const codes = [...new Set(assignedWkctrs.map((c) => c.trim()).filter(Boolean))]
  if (codes.length === 0) return

  const wo = await loadWoSnapshot(pool, idiw37)
  if (!wo) return

  const text = buildAssignmentMessage(wo, actorWkctr)
  const webBase = getTelegramWebAppUrl()
  const webUrl = `${webBase}/work-orders/${idiw37}`

  const techR = await pool.query<{ wkctr: string; telegram_chat_id: string | null }>(
    `SELECT wkctr, telegram_chat_id::text
     FROM app.tbworkcenter
     WHERE wkctr = ANY($1::text[]) AND telegram_chat_id IS NOT NULL`,
    [codes],
  )

  for (const tech of techR.rows) {
    if (!tech.telegram_chat_id) continue
    const idplanw = await getAssignmentIdplanw(pool, idiw37, tech.wkctr)
    if (!idplanw) continue

    const keyboard: InlineKeyboardButton[][] = [
      [{ text: '✅ รับทราบงาน', callback_data: ackCallbackData(idplanw) }],
      ...buildTelegramConfirmKeyboard(idplanw, idiw37).slice(0, 2),
      [{ text: '📋 เปิดปิดงานเต็ม', url: webUrl }],
    ]

    const result = await sendTelegramMessageWithKeyboard(
      tech.telegram_chat_id,
      text,
      keyboard,
    )
    if (!result.ok) {
      console.error('[telegram/assign-notify]', tech.wkctr, result.error)
    }
  }
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
 * แจ้งกลุ่ม ack_to_planner หลังช่างกดรับทราบ
 */
export async function notifyPlannerAssignmentAcknowledged(
  pool: Pool,
  idiw37: number,
  ackedWkctr: string,
  ackAtIso: string,
): Promise<void> {
  if (!isTelegramBotConfigured() || !isTelegramNotifyEnabled()) return

  const wo = await loadWoSnapshot(pool, idiw37)
  if (!wo) return

  const assignments = await pool.query<{ wkctr: string; ack_status: string }>(
    `SELECT wkctr, ack_status FROM app.tbplangingwork WHERE idiw37 = $1`,
    [idiw37],
  )
  const total = assignments.rows.length
  const acked = assignments.rows.filter((r) => r.ack_status === 'acknowledged').length
  const pending = assignments.rows
    .filter((r) => r.ack_status !== 'acknowledged')
    .map((r) => r.wkctr)

  const displayName = await loadTechDisplayName(pool, ackedWkctr)
  const ackTime = new Date(ackAtIso).toLocaleString('th-TH')
  const pendingLine =
    pending.length > 0 ? `\nรับทราบแล้ว ${acked}/${total} คน (ค้าง: ${pending.join(', ')})` : `\nรับทราบครบ ${acked}/${total} คน`

  const text = [
    '✅ ช่างรับทราบงานแล้ว',
    `WO: ${wo.wkorder}`,
    `ช่าง: ${ackedWkctr} — ${displayName}`,
    `เวลา: ${ackTime}`,
    pendingLine.trim(),
  ].join('\n')

  const ctx = await buildNotifyContextForWo(
    pool,
    idiw37,
    assignments.rows.map((r) => r.wkctr),
  )
  const chatIds = await resolveNotifyGroupChatIds(pool, 'ack_to_planner', ctx)

  for (const chatId of chatIds) {
    const result = await sendTelegramMessage(chatId, text)
    if (!result.ok) {
      console.error('[telegram/ack-planner]', chatId, result.error)
    }
  }
}

export type TechAckConfirmationOpts = {
  wkctr: string
  wkorder: string
  ackAt: string
  alreadyAcked: boolean
  idplanw: number
  idiw37: number
}

/** ตอบกลับช่างหลังกดรับทราบใน Telegram */
export async function sendTechAckConfirmation(
  chatId: number | string,
  opts: TechAckConfirmationOpts,
): Promise<void> {
  const time = new Date(opts.ackAt).toLocaleString('th-TH')
  const text = opts.alreadyAcked
    ? `ℹ️ รับทราบงาน ${opts.wkorder} (${opts.wkctr}) ไว้แล้วเมื่อ ${time}`
    : `✅ รับทราบงาน ${opts.wkorder} (${opts.wkctr}) แล้ว\nเวลา: ${time}\n\nอัปรูปหลังทำ PM หรือใส่ Comment ได้จากปุ่มด้านล่าง`

  await sendTelegramMessageWithKeyboard(
    chatId,
    text,
    buildTelegramConfirmKeyboard(opts.idplanw, opts.idiw37),
  )
}
