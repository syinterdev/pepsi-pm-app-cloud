import type { Pool } from 'pg'
import { getTelegramWebAppUrl } from '../lib/telegram-web-url.js'
import { answerCallbackQuery, sendTelegramMessage } from '../lib/telegram-bot.js'
import { getPlanningAssignment } from './planning-ack.js'
import { addPersonnelCloseTelegramMini } from './personnel-close.js'

export function parseCloseCallbackData(data: string): number | null {
  const m = /^c:(\d+)$/.exec(data.trim())
  if (!m) return null
  const id = Number(m[1])
  return Number.isFinite(id) && id > 0 ? id : null
}

export function closeCallbackData(idplanw: number): string {
  return `c:${idplanw}`
}

export type TelegramMiniCloseResult =
  | {
      ok: true
      idiw37: number
      wkorder: string
      wkctr: string
      wktimewk: number
      startLabel: string
      endLabel: string
      alreadyClosed: boolean
    }
  | {
      ok: false
      reason:
        | 'not_found'
        | 'chat_mismatch'
        | 'not_acknowledged'
        | 'before_work_hours'
        | 'duplicate'
        | 'error'
      message: string
    }

async function verifyTelegramChatForWkctr(
  pool: Pool,
  wkctr: string,
  chatId: number | string,
): Promise<boolean> {
  const chatR = await pool.query<{ telegram_chat_id: string | null }>(
    `SELECT telegram_chat_id::text FROM app.tbworkcenter WHERE wkctr = $1`,
    [wkctr],
  )
  const linked = chatR.rows[0]?.telegram_chat_id
  return Boolean(linked && String(linked) === String(chatId))
}

export async function performTelegramMiniClose(
  pool: Pool,
  idplanw: number,
  chatId: number | string,
): Promise<TelegramMiniCloseResult> {
  const row = await getPlanningAssignment(pool, idplanw)
  if (!row) {
    return { ok: false, reason: 'not_found', message: 'ไม่พบงานมอบหมาย' }
  }

  const chatOk = await verifyTelegramChatForWkctr(pool, row.wkctr, chatId)
  if (!chatOk) {
    return { ok: false, reason: 'chat_mismatch', message: 'บัญชี Telegram ไม่ตรงกับรหัสช่าง' }
  }

  if (row.ack_status !== 'acknowledged') {
    return {
      ok: false,
      reason: 'not_acknowledged',
      message: 'กรุณากดรับทราบงานก่อนบันทึกปิดงานย่อ',
    }
  }

  const woR = await pool.query<{ wkorder: string }>(
    `SELECT wkorder FROM app.tbiw37n WHERE idiw37 = $1`,
    [row.idiw37],
  )
  const wkorder = woR.rows[0]?.wkorder ?? String(row.idiw37)

  const dup = await pool.query<{ n: string }>(
    `SELECT COUNT(*)::text AS n FROM app.tbwrkclose WHERE idiw37 = $1 AND wkctr = $2`,
    [row.idiw37, row.wkctr],
  )
  if (Number(dup.rows[0]?.n ?? 0) > 0) {
    return {
      ok: true,
      idiw37: row.idiw37,
      wkorder,
      wkctr: row.wkctr,
      wktimewk: 0,
      startLabel: '',
      endLabel: '',
      alreadyClosed: true,
    }
  }

  try {
    const saved = await addPersonnelCloseTelegramMini(pool, {
      idiw37: row.idiw37,
      wkctr: row.wkctr,
    })
    return {
      ok: true,
      idiw37: row.idiw37,
      wkorder,
      wkctr: row.wkctr,
      alreadyClosed: false,
      ...saved,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (message.includes('End time must be after') || message.includes('ไม่สามารถบันทึก')) {
      return { ok: false, reason: 'before_work_hours', message }
    }
    if (message.includes('ปิดงานไปแล้ว')) {
      return {
        ok: true,
        idiw37: row.idiw37,
        wkorder,
        wkctr: row.wkctr,
        wktimewk: 0,
        startLabel: '',
        endLabel: '',
        alreadyClosed: true,
      }
    }
    return { ok: false, reason: 'error', message }
  }
}

export async function handleTelegramMiniCloseCallback(
  pool: Pool,
  query: { id: string; message?: { chat?: { id: number } }; from: { id: number } },
  data: string,
): Promise<void> {
  const idplanw = parseCloseCallbackData(data)
  if (!idplanw) {
    await answerCallbackQuery(query.id, 'ไม่รู้จักคำสั่ง')
    return
  }

  const chatId = query.message?.chat?.id ?? query.from.id
  const result = await performTelegramMiniClose(pool, idplanw, chatId)

  if (!result.ok) {
    await answerCallbackQuery(query.id, result.message)
    return
  }

  const webBase = getTelegramWebAppUrl()
  const confirmUrl = `${webBase}/work-orders/${result.idiw37}`

  if (result.alreadyClosed) {
    await answerCallbackQuery(query.id, 'บันทึกเวลาไว้แล้ว')
    await sendTelegramMessage(
      chatId,
      [
        `ℹ️ WO ${result.wkorder} (${result.wkctr})`,
        'บันทึกเวลาปิดงานย่อไว้แล้ว',
        `อัปรูป/Comment ในแชทได้ หรือเปิดเว็บ: ${confirmUrl}`,
      ].join('\n'),
    )
    return
  }

  await answerCallbackQuery(query.id, `บันทึกเวลา ${result.wktimewk} นาที`)
  await sendTelegramMessage(
    chatId,
    [
      `⏱️ บันทึกปิดงานย่อแล้ว`,
      `WO: ${result.wkorder}`,
      `ช่าง: ${result.wkctr}`,
      `เวลา: ${result.startLabel} → ${result.endLabel} (${result.wktimewk} นาที)`,
      '',
      '📷 ขั้นต่อไป: กดปุ่ม รูปหลังทำ PM หรือ Comment ในแชท (หรือเปิดเว็บ)',
      confirmUrl,
    ].join('\n'),
  )
}
