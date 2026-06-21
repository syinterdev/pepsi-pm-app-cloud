import type { Pool } from 'pg'
import type { ConfirmImagePhase } from '../lib/confirm-image-phase.js'

export type TelegramPendingMode = 'photo' | 'comment'

export type TelegramChatSession = {
  telegramChatId: string
  wkctr: string
  idiw37: number
  idplanw: number | null
  pendingPhase: ConfirmImagePhase | null
  pendingMode: TelegramPendingMode | null
}

export function isTelegramSessionSchemaMissing(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err)
  return message.includes('tbl_telegram_chat_session') || message.includes('does not exist')
}

export async function isTelegramSessionSchemaReady(pool: Pool): Promise<boolean> {
  const r = await pool.query<{ reg: string | null }>(
    `SELECT to_regclass('app.tbl_telegram_chat_session')::text AS reg`,
  )
  return Boolean(r.rows[0]?.reg)
}

export async function getTelegramChatSession(
  pool: Pool,
  chatId: number | string,
): Promise<TelegramChatSession | null> {
  const { rows } = await pool.query<{
    telegram_chat_id: string
    wkctr: string
    idiw37: number
    idplanw: number | null
    pending_phase: string | null
    pending_mode: string | null
  }>(
    `SELECT telegram_chat_id::text, wkctr, idiw37, idplanw, pending_phase, pending_mode
     FROM app.tbl_telegram_chat_session
     WHERE telegram_chat_id = $1`,
    [String(chatId)],
  )
  const row = rows[0]
  if (!row) return null
  const phase =
    row.pending_phase === 'before' || row.pending_phase === 'after' ? row.pending_phase : null
  const mode = row.pending_mode === 'photo' || row.pending_mode === 'comment' ? row.pending_mode : null
  return {
    telegramChatId: row.telegram_chat_id,
    wkctr: row.wkctr,
    idiw37: row.idiw37,
    idplanw: row.idplanw,
    pendingPhase: phase,
    pendingMode: mode,
  }
}

export async function upsertTelegramChatSession(
  pool: Pool,
  opts: {
    chatId: number | string
    wkctr: string
    idiw37: number
    idplanw: number | null
    pendingPhase: ConfirmImagePhase | null
    pendingMode: TelegramPendingMode | null
  },
): Promise<void> {
  await pool.query(
    `INSERT INTO app.tbl_telegram_chat_session
       (telegram_chat_id, wkctr, idiw37, idplanw, pending_phase, pending_mode, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, now())
     ON CONFLICT (telegram_chat_id) DO UPDATE SET
       wkctr = EXCLUDED.wkctr,
       idiw37 = EXCLUDED.idiw37,
       idplanw = EXCLUDED.idplanw,
       pending_phase = EXCLUDED.pending_phase,
       pending_mode = EXCLUDED.pending_mode,
       updated_at = now()`,
    [
      String(opts.chatId),
      opts.wkctr,
      opts.idiw37,
      opts.idplanw,
      opts.pendingPhase,
      opts.pendingMode,
    ],
  )
}

export async function clearTelegramChatPending(pool: Pool, chatId: number | string): Promise<void> {
  await pool.query(
    `UPDATE app.tbl_telegram_chat_session
     SET pending_phase = NULL, pending_mode = NULL, updated_at = now()
     WHERE telegram_chat_id = $1`,
    [String(chatId)],
  )
}
