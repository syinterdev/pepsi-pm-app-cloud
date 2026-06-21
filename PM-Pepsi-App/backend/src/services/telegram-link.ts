import { createHash, randomBytes } from 'node:crypto'
import type { Pool } from 'pg'
import { getTelegramBotUsername, isTelegramBotConfigured } from '../lib/telegram-bot.js'
import type { TelegramLinkStatus, TelegramLinkTokenResponse } from '../schemas/telegram-link.js'

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000

export function isTelegramLinkSchemaMissing(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err)
  return (
    message.includes('tbl_telegram_link_token') ||
    message.includes('telegram_chat_id') ||
    message.includes('does not exist') ||
    message.includes('relation')
  )
}

function hashToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex')
}

function buildDeepLink(botUsername: string | null, token: string): string {
  if (botUsername) return `https://t.me/${botUsername}?start=${token}`
  return `tg://resolve?start=${token}`
}

export async function resolveWorkcenterByIdwkctr(
  pool: Pool,
  idwkctr: string,
): Promise<{ idwkctr: string; wkctr: string } | null> {
  const { rows } = await pool.query<{ idwkctr: string; wkctr: string }>(
    `SELECT idwkctr, wkctr FROM app.tbworkcenter WHERE idwkctr = $1`,
    [idwkctr],
  )
  return rows[0] ?? null
}

export async function getTelegramLinkStatusForIdwkctr(
  pool: Pool,
  idwkctr: string,
): Promise<TelegramLinkStatus | null> {
  const { rows } = await pool.query<{
    idwkctr: string
    wkctr: string
    telegram_chat_id: string | null
    telegram_username: string | null
    telegram_linked_at: Date | null
  }>(
    `SELECT idwkctr, wkctr, telegram_chat_id::text, telegram_username, telegram_linked_at
     FROM app.tbworkcenter WHERE idwkctr = $1`,
    [idwkctr],
  )
  const row = rows[0]
  if (!row) return null
  const botUsername = await getTelegramBotUsername()
  return {
    linked: !!row.telegram_chat_id,
    wkctr: row.wkctr,
    idwkctr: row.idwkctr,
    telegramChatId: row.telegram_chat_id,
    telegramUsername: row.telegram_username,
    telegramLinkedAt: row.telegram_linked_at?.toISOString() ?? null,
    botConfigured: isTelegramBotConfigured(),
    botUsername,
  }
}

export async function createTelegramLinkToken(
  pool: Pool,
  idwkctr: string,
  createdBy: string,
  ttlMs: number = DEFAULT_TTL_MS,
): Promise<TelegramLinkTokenResponse> {
  const wc = await resolveWorkcenterByIdwkctr(pool, idwkctr)
  if (!wc) throw new Error('NOT_FOUND')

  const token = randomBytes(18).toString('base64url')
  const tokenHash = hashToken(token)
  const expiresAt = new Date(Date.now() + ttlMs)
  const botUsername = await getTelegramBotUsername()

  await pool.query(
    `INSERT INTO app.tbl_telegram_link_token (token_hash, idwkctr, created_by, expires_at)
     VALUES ($1, $2, $3, $4)`,
    [tokenHash, idwkctr, createdBy, expiresAt],
  )

  return {
    token,
    deepLink: buildDeepLink(botUsername, token),
    expiresAt: expiresAt.toISOString(),
    botUsername,
    wkctr: wc.wkctr,
    idwkctr,
  }
}

export type ConsumeLinkResult =
  | { ok: true; wkctr: string; idwkctr: string }
  | { ok: false; reason: 'invalid' | 'expired' | 'used' | 'chat_taken' }

export async function consumeTelegramLinkToken(
  pool: Pool,
  token: string,
  chatId: number | bigint,
  username: string | null,
): Promise<ConsumeLinkResult> {
  const tokenHash = hashToken(token.trim())
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const { rows } = await client.query<{
      id: string
      idwkctr: string
      expires_at: Date
      used_at: Date | null
    }>(
      `SELECT id, idwkctr, expires_at, used_at
       FROM app.tbl_telegram_link_token
       WHERE token_hash = $1
       FOR UPDATE`,
      [tokenHash],
    )
    const row = rows[0]
    if (!row) {
      await client.query('ROLLBACK')
      return { ok: false, reason: 'invalid' }
    }
    if (row.used_at) {
      await client.query('ROLLBACK')
      return { ok: false, reason: 'used' }
    }
    if (row.expires_at.getTime() < Date.now()) {
      await client.query('ROLLBACK')
      return { ok: false, reason: 'expired' }
    }

    const chatStr = String(chatId)
    const taken = await client.query(
      `SELECT idwkctr FROM app.tbworkcenter
       WHERE telegram_chat_id = $1::bigint AND idwkctr <> $2`,
      [chatStr, row.idwkctr],
    )
    if ((taken.rowCount ?? 0) > 0) {
      await client.query('ROLLBACK')
      return { ok: false, reason: 'chat_taken' }
    }

    const wc = await client.query<{ wkctr: string }>(
      `UPDATE app.tbworkcenter
       SET telegram_chat_id = $1::bigint,
           telegram_username = $2,
           telegram_linked_at = now(),
           updated_at = now()
       WHERE idwkctr = $3
       RETURNING wkctr`,
      [chatStr, username?.replace(/^@/, '') ?? null, row.idwkctr],
    )
    if (!wc.rows[0]) {
      await client.query('ROLLBACK')
      return { ok: false, reason: 'invalid' }
    }

    await client.query(
      `UPDATE app.tbl_telegram_link_token
       SET used_at = now(), used_chat_id = $1::bigint
       WHERE id = $2`,
      [chatStr, row.id],
    )
    await client.query('COMMIT')
    return { ok: true, wkctr: wc.rows[0].wkctr, idwkctr: row.idwkctr }
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

export async function unlinkTelegramForIdwkctr(pool: Pool, idwkctr: string): Promise<boolean> {
  const { rowCount } = await pool.query(
    `UPDATE app.tbworkcenter
     SET telegram_chat_id = NULL,
         telegram_username = NULL,
         telegram_linked_at = NULL,
         updated_at = now()
     WHERE idwkctr = $1`,
    [idwkctr],
  )
  return (rowCount ?? 0) > 0
}
