import type { Pool } from 'pg'
import { normalizeConfirmImageCaption } from '../lib/confirm-image-phase.js'
import {
  answerCallbackQuery,
  downloadTelegramFile,
  sendTelegramMessage,
  type InlineKeyboardButton,
} from '../lib/telegram-bot.js'
import { getTelegramWebAppUrl } from '../lib/telegram-web-url.js'
import { convertConfirmImageToWebp } from './confirm-image.js'
import { touchConfirmQcPending } from './confirm-qc.js'
import { createConfirmationComment, createConfirmationImageRecord } from './confirmation.js'
import { getPlanningAssignment } from './planning-ack.js'
import {
  clearTelegramChatPending,
  isTelegramSessionSchemaMissing,
  isTelegramSessionSchemaReady,
  upsertTelegramChatSession,
  getTelegramChatSession,
} from './telegram-chat-session.js'

/** @deprecated ลูกค้าไม่ใช้รูปก่อนทำ PM แล้ว — คง parse เพื่อตอบกลับข้อความ */
export function parseBeforePhotoCallback(data: string): number | null {
  const m = /^ib:(\d+)$/.exec(data.trim())
  if (!m) return null
  const id = Number(m[1])
  return Number.isFinite(id) && id > 0 ? id : null
}

export function parseAfterPhotoCallback(data: string): number | null {
  const m = /^ia:(\d+)$/.exec(data.trim())
  if (!m) return null
  const id = Number(m[1])
  return Number.isFinite(id) && id > 0 ? id : null
}

export function parseCommentModeCallback(data: string): number | null {
  const m = /^ic:(\d+)$/.exec(data.trim())
  if (!m) return null
  const id = Number(m[1])
  return Number.isFinite(id) && id > 0 ? id : null
}

export function isConfirmCallbackData(data: string): boolean {
  const d = data.trim()
  return /^ia:\d+$/.test(d) || /^ic:\d+$/.test(d) || /^ib:\d+$/.test(d)
}

export function afterPhotoCallbackData(idplanw: number): string {
  return `ia:${idplanw}`
}

export function commentModeCallbackData(idplanw: number): string {
  return `ic:${idplanw}`
}

export function buildTelegramConfirmKeyboard(
  idplanw: number,
  idiw37: number,
): InlineKeyboardButton[][] {
  const webUrl = `${getTelegramWebAppUrl()}/work-orders/${idiw37}`
  return [
    [{ text: '📷 รูปหลังทำ PM', callback_data: afterPhotoCallbackData(idplanw) }],
    [{ text: '💬 ใส่ Comment', callback_data: commentModeCallbackData(idplanw) }],
    [
      { text: '⏱️ ปิดงานย่อ', callback_data: `c:${idplanw}` },
      { text: '📋 เปิดเว็บ', url: webUrl },
    ],
  ]
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

type VerifyAssignmentResult =
  | { ok: true; idiw37: number; wkctr: string; wkorder: string }
  | { ok: false; message: string }

async function verifyAssignmentForConfirm(
  pool: Pool,
  idplanw: number,
  chatId: number | string,
): Promise<VerifyAssignmentResult> {
  const row = await getPlanningAssignment(pool, idplanw)
  if (!row) {
    return { ok: false, message: 'ไม่พบงานมอบหมาย' }
  }

  const chatOk = await verifyTelegramChatForWkctr(pool, row.wkctr, chatId)
  if (!chatOk) {
    return { ok: false, message: 'บัญชี Telegram ไม่ตรงกับรหัสช่าง' }
  }

  if (row.ack_status !== 'acknowledged') {
    return { ok: false, message: 'กรุณากดรับทราบงานก่อนอัปรูปหรือใส่ความคิดเห็น' }
  }

  const woR = await pool.query<{ wkorder: string }>(
    `SELECT wkorder FROM app.tbiw37n WHERE idiw37 = $1`,
    [row.idiw37],
  )
  const wkorder = woR.rows[0]?.wkorder ?? String(row.idiw37)

  return { ok: true, idiw37: row.idiw37, wkctr: row.wkctr, wkorder }
}

async function ensureSessionSchema(pool: Pool, chatId: number | string): Promise<boolean> {
  const ready = await isTelegramSessionSchemaReady(pool)
  if (!ready) {
    await sendTelegramMessage(
      chatId,
      '⚠️ ระบบยังไม่พร้อม — รัน migration 101_telegram_chat_session.sql',
    )
    return false
  }
  return true
}

export async function handleTelegramConfirmCallback(
  pool: Pool,
  query: { id: string; message?: { chat?: { id: number } }; from: { id: number } },
  data: string,
): Promise<void> {
  const chatId = query.message?.chat?.id ?? query.from.id

  if (parseBeforePhotoCallback(data)) {
    await answerCallbackQuery(query.id, 'ไม่รองรับรูปก่อนทำ PM')
    await sendTelegramMessage(
      chatId,
      'ℹ️ ลูกค้ากำหนดให้ส่งรูปเฉพาะหลังทำ PM เสร็จแล้ว\nกดปุ่ม 📷 รูปหลังทำ PM',
    )
    return
  }

  const idplanwAfter = parseAfterPhotoCallback(data)
  const idplanwComment = parseCommentModeCallback(data)
  const idplanw = idplanwAfter ?? idplanwComment
  if (!idplanw) {
    await answerCallbackQuery(query.id, 'ไม่รู้จักคำสั่ง')
    return
  }

  if (!(await ensureSessionSchema(pool, chatId))) {
    await answerCallbackQuery(query.id, 'ระบบยังไม่พร้อม')
    return
  }

  const verified = await verifyAssignmentForConfirm(pool, idplanw, chatId)
  if (!verified.ok) {
    await answerCallbackQuery(query.id, verified.message)
    return
  }

  if (idplanwComment != null) {
    await upsertTelegramChatSession(pool, {
      chatId,
      wkctr: verified.wkctr,
      idiw37: verified.idiw37,
      idplanw,
      pendingPhase: null,
      pendingMode: 'comment',
    })
    await answerCallbackQuery(query.id, 'พิมพ์ความคิดเห็นได้เลย')
    await sendTelegramMessage(
      chatId,
      [
        `💬 WO ${verified.wkorder} (${verified.wkctr})`,
        'พิมพ์ข้อความในแชทนี้เพื่อบันทึก Comment',
      ].join('\n'),
    )
    return
  }

  await upsertTelegramChatSession(pool, {
    chatId,
    wkctr: verified.wkctr,
    idiw37: verified.idiw37,
    idplanw,
    pendingPhase: 'after',
    pendingMode: 'photo',
  })

  await answerCallbackQuery(query.id, 'รอรูปหลังทำ PM')
  await sendTelegramMessage(
    chatId,
    [
      `📷 WO ${verified.wkorder} (${verified.wkctr})`,
      'ส่งรูปหลังทำ PM เสร็จในแชทนี้ (ใส่ caption ได้)',
    ].join('\n'),
  )
}

type TelegramPhotoSize = { file_id: string; width?: number; height?: number }

export async function handleTelegramPhotoMessage(
  pool: Pool,
  chatId: number,
  photo: TelegramPhotoSize[],
  caption?: string,
): Promise<void> {
  if (!photo?.length) return

  if (!(await ensureSessionSchema(pool, chatId))) return

  const session = await getTelegramChatSession(pool, chatId)
  if (!session?.pendingMode || session.pendingMode !== 'photo' || session.pendingPhase !== 'after') {
    await sendTelegramMessage(
      chatId,
      'กดปุ่ม 📷 รูปหลังทำ PM ก่อนส่งรูป\n(หรือกดรับทราบงานแล้วเลือกจากปุ่มในแชท)',
    )
    return
  }

  const largest = photo.reduce((best, cur) =>
    (cur.width ?? 0) * (cur.height ?? 0) > (best.width ?? 0) * (best.height ?? 0) ? cur : best,
  )

  const raw = await downloadTelegramFile(largest.file_id)
  if (!raw?.length) {
    await sendTelegramMessage(chatId, '❌ ดาวน์โหลดรูปไม่สำเร็จ — ลองส่งใหม่')
    return
  }

  let webp
  try {
    webp = await convertConfirmImageToWebp(raw, session.idiw37)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'รูปไม่ถูกต้อง'
    await sendTelegramMessage(chatId, `❌ ${msg}`)
    return
  }

  const imgComment = normalizeConfirmImageCaption(caption)

  try {
    await createConfirmationImageRecord(pool, {
      idiw37: session.idiw37,
      fileName: webp.fileName,
      originalName: `telegram_${largest.file_id}`,
      mime: webp.mime,
      bytes: webp.bytes,
      imageData: webp.data,
      wkctr: session.wkctr,
      phase: 'after',
      comment: imgComment,
    })
  } catch (err) {
    if (isTelegramSessionSchemaMissing(err)) {
      await sendTelegramMessage(chatId, '⚠️ ตาราง confirm ยังไม่พร้อม — ติดต่อ Admin')
      return
    }
    console.error('[telegram/photo]', err)
    await sendTelegramMessage(chatId, '❌ บันทึกรูปไม่สำเร็จ')
    return
  }

  await clearTelegramChatPending(pool, chatId)

  const captionLine = imgComment ? `\nCaption: ${imgComment}` : ''
  await sendTelegramMessage(
    chatId,
    `✅ บันทึกรูปหลังทำ PM แล้ว (${webp.bytes} bytes)${captionLine}`,
  )
}

export async function handleTelegramCommentText(
  pool: Pool,
  chatId: number,
  text: string,
): Promise<void> {
  const trimmed = text.trim()
  if (!trimmed) return

  if (!(await ensureSessionSchema(pool, chatId))) return

  const session = await getTelegramChatSession(pool, chatId)
  if (!session?.pendingMode || session.pendingMode !== 'comment') {
    return
  }

  const comdetail = trimmed.slice(0, 8000)
  if (!comdetail) {
    await sendTelegramMessage(chatId, '❌ ความคิดเห็นว่างเปล่า')
    return
  }

  try {
    await createConfirmationComment(pool, {
      idiw37: session.idiw37,
      comdetail,
      wkctr: session.wkctr,
    })
    await touchConfirmQcPending(pool, session.idiw37)
  } catch (err) {
    console.error('[telegram/comment]', err)
    await sendTelegramMessage(chatId, '❌ บันทึกความคิดเห็นไม่สำเร็จ')
    return
  }

  await clearTelegramChatPending(pool, chatId)

  const preview = comdetail.length > 120 ? `${comdetail.slice(0, 120)}…` : comdetail
  await sendTelegramMessage(chatId, `✅ บันทึก Comment แล้ว\n${preview}`)
}
