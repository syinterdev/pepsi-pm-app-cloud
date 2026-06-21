/** Telegram Bot API helpers — token จาก env เท่านั้น (ไม่เก็บใน DB) */

let cachedBotUsername: string | null | undefined

export function getTelegramBotToken(): string | null {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim()
  return token || null
}

export function getTelegramWebhookSecret(): string | null {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim()
  return secret || null
}

export function getAppPublicUrl(): string | null {
  const url = process.env.APP_PUBLIC_URL?.trim()
  return url || null
}

export function getConfiguredBotUsername(): string | null {
  const u = process.env.TELEGRAM_BOT_USERNAME?.trim().replace(/^@/, '')
  return u || null
}

export async function getTelegramBotUsername(): Promise<string | null> {
  const fromEnv = getConfiguredBotUsername()
  if (fromEnv) return fromEnv
  if (cachedBotUsername !== undefined) return cachedBotUsername

  const token = getTelegramBotToken()
  if (!token) {
    cachedBotUsername = null
    return null
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getMe`)
    const data = (await res.json()) as { ok?: boolean; result?: { username?: string } }
    cachedBotUsername = data.ok && data.result?.username ? data.result.username : null
  } catch {
    cachedBotUsername = null
  }
  return cachedBotUsername
}

export function isTelegramNotifyEnabled(): boolean {
  const raw = process.env.TELEGRAM_NOTIFY_ENABLED?.trim().toLowerCase()
  if (raw === '0' || raw === 'false' || raw === 'no') return false
  return true
}

export function isTelegramBotConfigured(): boolean {
  return !!getTelegramBotToken()
}

type TelegramApiResult = {
  ok: boolean
  description?: string
}

export type InlineKeyboardButton = {
  text: string
  url?: string
  callback_data?: string
}

async function callTelegramApi(
  method: string,
  body: Record<string, unknown>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const token = getTelegramBotToken()
  if (!token) {
    return { ok: false, error: 'TELEGRAM_BOT_TOKEN not configured' }
  }

  const url = `https://api.telegram.org/bot${token}/${method}`
  let res: Response
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { ok: false, error: `Network error: ${msg}` }
  }

  let data: TelegramApiResult
  try {
    data = (await res.json()) as TelegramApiResult
  } catch {
    return { ok: false, error: `Telegram HTTP ${res.status}` }
  }

  if (!data.ok) {
    return { ok: false, error: data.description || `Telegram HTTP ${res.status}` }
  }
  return { ok: true }
}

export async function sendTelegramMessage(
  chatId: string | number | bigint,
  text: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const token = getTelegramBotToken()
  if (!token) {
    return { ok: false, error: 'TELEGRAM_BOT_TOKEN not configured' }
  }
  if (!isTelegramNotifyEnabled()) {
    return { ok: false, error: 'TELEGRAM_NOTIFY_ENABLED is off' }
  }

  return callTelegramApi('sendMessage', {
    chat_id: String(chatId),
    text,
    disable_web_page_preview: true,
  })
}

export async function sendTelegramMessageWithKeyboard(
  chatId: string | number | bigint,
  text: string,
  keyboard: InlineKeyboardButton[][],
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!getTelegramBotToken()) {
    return { ok: false, error: 'TELEGRAM_BOT_TOKEN not configured' }
  }
  if (!isTelegramNotifyEnabled()) {
    return { ok: false, error: 'TELEGRAM_NOTIFY_ENABLED is off' }
  }

  return callTelegramApi('sendMessage', {
    chat_id: String(chatId),
    text,
    disable_web_page_preview: true,
    reply_markup: { inline_keyboard: keyboard },
  })
}

export async function answerCallbackQuery(
  callbackQueryId: string,
  text?: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!getTelegramBotToken()) {
    return { ok: false, error: 'TELEGRAM_BOT_TOKEN not configured' }
  }
  return callTelegramApi('answerCallbackQuery', {
    callback_query_id: callbackQueryId,
    text: text?.slice(0, 200),
    show_alert: false,
  })
}

type TelegramGetFileResult = {
  ok?: boolean
  result?: { file_path?: string }
}

/** ดาวน์โหลดไฟล์จาก Telegram Bot API (รูปที่ user ส่งในแชท) */
export async function downloadTelegramFile(fileId: string): Promise<Buffer | null> {
  const token = getTelegramBotToken()
  if (!token || !fileId.trim()) return null

  let getFileData: TelegramGetFileResult
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${token}/getFile?file_id=${encodeURIComponent(fileId)}`,
    )
    getFileData = (await res.json()) as TelegramGetFileResult
  } catch {
    return null
  }

  const filePath = getFileData.ok ? getFileData.result?.file_path : undefined
  if (!filePath) return null

  try {
    const fileRes = await fetch(`https://api.telegram.org/file/bot${token}/${filePath}`)
    if (!fileRes.ok) return null
    return Buffer.from(await fileRes.arrayBuffer())
  } catch {
    return null
  }
}
