import type { Pool } from 'pg'

import { answerCallbackQuery, sendTelegramMessage } from '../lib/telegram-bot.js'

import { consumeTelegramLinkToken } from './telegram-link.js'

import { acknowledgePlanningAssignment } from './planning-ack.js'

import {
  notifyPlannerAssignmentAcknowledged,
  parseAckCallbackData,
  sendTechAckConfirmation,
} from './telegram-assignment-notify.js'

import { handleTelegramMiniCloseCallback, parseCloseCallbackData } from './telegram-close.js'
import {
  handleTelegramCommentText,
  handleTelegramConfirmCallback,
  handleTelegramPhotoMessage,
  isConfirmCallbackData,
} from './telegram-confirm.js'

type TelegramUser = {
  id: number
  username?: string
  first_name?: string
}

type TelegramChat = {
  id: number
  type: string
}

type TelegramPhotoSize = {
  file_id: string
  width?: number
  height?: number
}

type TelegramMessage = {
  message_id: number
  from?: TelegramUser
  chat: TelegramChat
  text?: string
  caption?: string
  photo?: TelegramPhotoSize[]
}

type TelegramCallbackQuery = {
  id: string
  from: TelegramUser
  message?: TelegramMessage
  data?: string
}

export type TelegramUpdate = {
  update_id: number
  message?: TelegramMessage
  callback_query?: TelegramCallbackQuery
}

function parseStartToken(text: string): string | null {
  const trimmed = text.trim()
  if (!trimmed.startsWith('/start')) return null
  const parts = trimmed.split(/\s+/)
  if (parts.length < 2) return null
  return parts[1]?.trim() || null
}

async function handleStartLink(
  pool: Pool,
  text: string,
  chatId: number,
  username: string | null,
): Promise<void> {
  const token = parseStartToken(text)
  if (!token) return

  const result = await consumeTelegramLinkToken(pool, token, chatId, username)
  if (!result.ok) {
    const messages: Record<typeof result.reason, string> = {
      invalid: 'รหัสเชิญไม่ถูกต้อง — ขอลิงก์ใหม่จาก Admin',
      expired: 'รหัสเชิญหมดอายุแล้ว — ขอลิงก์ใหม่',
      used: 'รหัสเชิญถูกใช้แล้ว — ขอลิงก์ใหม่',
      chat_taken: 'บัญชี Telegram นี้ผูกกับรหัสช่างอื่นแล้ว',
    }
    await sendTelegramMessage(chatId, `❌ ${messages[result.reason]}`)
    return
  }

  await sendTelegramMessage(
    chatId,
    `✅ ผูกบัญชีสำเร็จ\nรหัสช่าง: ${result.wkctr}\nคุณจะได้รับแจ้งเตือนงานจ่ายทาง Telegram`,
  )
}

async function handleAckCallback(pool: Pool, query: TelegramCallbackQuery): Promise<void> {
  const data = query.data?.trim() ?? ''

  if (parseCloseCallbackData(data)) {
    await handleTelegramMiniCloseCallback(pool, query, data)
    return
  }

  if (isConfirmCallbackData(data)) {
    await handleTelegramConfirmCallback(pool, query, data)
    return
  }

  const idplanw = parseAckCallbackData(data)
  if (!idplanw) {
    await answerCallbackQuery(query.id, 'ไม่รู้จักคำสั่ง')
    return
  }

  const chatId = query.message?.chat?.id ?? query.from.id
  const ack = await acknowledgePlanningAssignment(pool, idplanw, 'telegram', {
    expectedChatId: chatId,
  })

  if (!ack.ok) {
    const msg =
      ack.reason === 'chat_mismatch'
        ? 'บัญชี Telegram ไม่ตรงกับรหัสช่าง'
        : 'ไม่พบงานมอบหมาย'
    await answerCallbackQuery(query.id, msg)
    return
  }

  const woR = await pool.query<{ wkorder: string }>(
    `SELECT wkorder FROM app.tbiw37n WHERE idiw37 = $1`,
    [ack.idiw37],
  )
  const wkorder = woR.rows[0]?.wkorder ?? String(ack.idiw37)

  await answerCallbackQuery(query.id, ack.alreadyAcked ? 'รับทราบไว้แล้ว' : 'รับทราบแล้ว')
  await sendTechAckConfirmation(chatId, {
    wkctr: ack.wkctr,
    wkorder,
    ackAt: ack.ackAt,
    alreadyAcked: ack.alreadyAcked,
    idplanw: ack.idplanw,
    idiw37: ack.idiw37,
  })

  if (!ack.alreadyAcked) {
    void notifyPlannerAssignmentAcknowledged(pool, ack.idiw37, ack.wkctr, ack.ackAt).catch(
      (err) => console.error('[telegram/ack-planner]', err),
    )
  }
}

export async function handleTelegramUpdate(pool: Pool, update: TelegramUpdate): Promise<void> {
  if (update.callback_query) {
    try {
      await handleAckCallback(pool, update.callback_query)
    } catch (err) {
      console.error('[telegram/callback]', err)
      await answerCallbackQuery(update.callback_query.id, 'เกิดข้อผิดพลาด')
    }
    return
  }

  const msg = update.message
  if (!msg?.chat) return

  const chatId = msg.chat.id

  if (msg.photo?.length) {
    try {
      await handleTelegramPhotoMessage(pool, chatId, msg.photo, msg.caption)
    } catch (err) {
      console.error('[telegram/photo]', err)
      await sendTelegramMessage(chatId, '❌ เกิดข้อผิดพลาดขณะบันทึกรูป')
    }
    return
  }

  if (!msg.text) return

  const text = msg.text.trim()
  const username = msg.from?.username ?? null

  if (text === '/start' || text.startsWith('/start@')) {
    await sendTelegramMessage(
      chatId,
      'สวัสดีครับ — PM App Bot\n\nเปิดลิงก์เชิญจาก Admin หรือ Settings แล้วกด Start\nหรือส่ง: /start <รหัสเชิญ>',
    )
    return
  }

  if (text.startsWith('/start')) {
    await handleStartLink(pool, text, chatId, username)
    return
  }

  try {
    await handleTelegramCommentText(pool, chatId, text)
  } catch (err) {
    console.error('[telegram/comment]', err)
  }
}
