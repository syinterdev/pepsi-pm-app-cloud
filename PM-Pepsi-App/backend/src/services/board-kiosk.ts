import { randomBytes, timingSafeEqual } from 'node:crypto'
import type { Pool } from 'pg'
import {
  fetchSettings,
  isSettingTableMissing,
  settingAsBoolean,
  settingAsString,
  upsertSetting,
} from './setting-store.js'

const KIOSK_CATEGORY = 'feature'
const KEY_ENABLED = 'board.kiosk_enabled'
const KEY_TOKEN = 'board.kiosk_token'

export type BoardKioskStatus = {
  enabled: boolean
  tokenRequired: boolean
}

export type BoardKioskAdminView = {
  enabled: boolean
  hasToken: boolean
}

function tokensEqual(expected: string, provided: string): boolean {
  const a = Buffer.from(expected, 'utf8')
  const b = Buffer.from(provided, 'utf8')
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export async function getBoardKioskStatus(pool: Pool): Promise<BoardKioskStatus> {
  try {
    const map = await fetchSettings(pool, [KEY_ENABLED, KEY_TOKEN])
    const enabled = settingAsBoolean(map.get(KEY_ENABLED), true)
    const token = settingAsString(map.get(KEY_TOKEN))?.trim() ?? ''
    return { enabled, tokenRequired: enabled && token.length > 0 }
  } catch (err) {
    if (isSettingTableMissing(err)) {
      return { enabled: true, tokenRequired: false }
    }
    throw err
  }
}

export async function getBoardKioskAdmin(pool: Pool): Promise<BoardKioskAdminView> {
  try {
    const map = await fetchSettings(pool, [KEY_ENABLED, KEY_TOKEN])
    const enabled = settingAsBoolean(map.get(KEY_ENABLED), true)
    const token = settingAsString(map.get(KEY_TOKEN))?.trim() ?? ''
    return { enabled, hasToken: token.length > 0 }
  } catch (err) {
    if (isSettingTableMissing(err)) {
      return { enabled: true, hasToken: false }
    }
    throw err
  }
}

export async function setBoardKioskEnabled(
  pool: Pool,
  enabled: boolean,
  updatedBy: string,
): Promise<BoardKioskAdminView> {
  await upsertSetting(pool, KEY_ENABLED, enabled, KIOSK_CATEGORY, updatedBy)
  return getBoardKioskAdmin(pool)
}

export async function rotateBoardKioskToken(
  pool: Pool,
  updatedBy: string,
): Promise<{ token: string; enabled: boolean }> {
  const token = randomBytes(24).toString('base64url')
  await upsertSetting(pool, KEY_TOKEN, token, KIOSK_CATEGORY, updatedBy)
  await upsertSetting(pool, KEY_ENABLED, true, KIOSK_CATEGORY, updatedBy)
  return { token, enabled: true }
}

export async function clearBoardKioskToken(pool: Pool, updatedBy: string): Promise<BoardKioskAdminView> {
  await upsertSetting(pool, KEY_TOKEN, null, KIOSK_CATEGORY, updatedBy)
  return getBoardKioskAdmin(pool)
}

export function extractBoardKioskTokenFromRequest(req: {
  headers: Record<string, string | string[] | undefined>
  query: Record<string, unknown>
}): string | null {
  const header = req.headers['x-board-kiosk-token']
  if (typeof header === 'string' && header.trim()) return header.trim()
  const q = req.query.kiosk_token ?? req.query.token
  if (typeof q === 'string' && q.trim()) return q.trim()
  return null
}

/** อนุญาตอ่าน board API: session+perm หรือ kiosk token ตามการตั้งค่า */
export async function isBoardKioskRequestAllowed(
  pool: Pool,
  providedToken: string | null,
): Promise<boolean> {
  const status = await getBoardKioskStatus(pool)
  if (!status.enabled) return true
  if (!status.tokenRequired) return true
  if (!providedToken) return false
  try {
    const map = await fetchSettings(pool, [KEY_TOKEN])
    const expected = settingAsString(map.get(KEY_TOKEN))?.trim() ?? ''
    if (!expected) return false
    return tokensEqual(expected, providedToken)
  } catch (err) {
    if (isSettingTableMissing(err)) return false
    throw err
  }
}
