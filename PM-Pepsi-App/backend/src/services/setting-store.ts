import type { Pool } from 'pg'

export function isSettingTableMissing(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err)
  return (
    message.includes('tbl_setting') ||
    message.includes('does not exist') ||
    message.includes('relation')
  )
}

export async function upsertSetting(
  pool: Pool,
  key: string,
  value: unknown,
  category: string,
  updatedBy?: string | null,
): Promise<void> {
  await pool.query(
    `INSERT INTO app.tbl_setting (setting_key, setting_value, category, updated_by)
     VALUES ($1, $2::jsonb, $3, $4)
     ON CONFLICT (setting_key) DO UPDATE SET
       setting_value = EXCLUDED.setting_value,
       category = EXCLUDED.category,
       updated_by = EXCLUDED.updated_by,
       updated_at = now()`,
    [key, JSON.stringify(value), category, updatedBy ?? null],
  )
}

/** Keys ที่เก็บ base64 ขนาดใหญ่ — ใช้ omitBinaryPayloads เพื่อไม่ดึงทั้งก้อนใน GET branding/public */
export const BINARY_PAYLOAD_SETTING_KEYS = [
  'app.logo_bytes',
  'app.favicon_bytes',
  'app.login_bg_bytes',
] as const

export type FetchSettingsOptions = {
  /** แทนที่ payload ด้วย marker `"1"` สำหรับ has* flags เท่านั้น */
  omitBinaryPayloads?: boolean
  /** เฉพาะคีย์ที่ is_secret = false (GET /settings/public) */
  publicOnly?: boolean
}

export async function fetchSettings(
  pool: Pool,
  keys: readonly string[],
  options?: FetchSettingsOptions,
): Promise<Map<string, unknown>> {
  if (!keys.length) return new Map()

  const binaryKeys = options?.omitBinaryPayloads
    ? keys.filter((k): k is (typeof BINARY_PAYLOAD_SETTING_KEYS)[number] =>
        (BINARY_PAYLOAD_SETTING_KEYS as readonly string[]).includes(k),
      )
    : []

  const secretFilter = options?.publicOnly ? ' AND is_secret = false' : ''

  if (binaryKeys.length === 0) {
    const { rows } = await pool.query<{ setting_key: string; setting_value: unknown }>(
      `SELECT setting_key, setting_value FROM app.tbl_setting WHERE setting_key = ANY($1::text[])${secretFilter}`,
      [keys],
    )
    const map = new Map<string, unknown>()
    for (const row of rows) {
      map.set(row.setting_key, row.setting_value)
    }
    return map
  }

  const { rows } = await pool.query<{ setting_key: string; setting_value: unknown }>(
    `SELECT setting_key,
       CASE
         WHEN setting_key = ANY($2::text[]) AND (
           setting_value IS NULL
           OR setting_value = 'null'::jsonb
           OR (jsonb_typeof(setting_value) = 'string' AND length(setting_value #>> '{}') = 0)
         ) THEN 'null'::jsonb
         WHEN setting_key = ANY($2::text[]) THEN '"1"'::jsonb
         ELSE setting_value
       END AS setting_value
     FROM app.tbl_setting
     WHERE setting_key = ANY($1::text[])${secretFilter}`,
    [keys, binaryKeys],
  )
  const map = new Map<string, unknown>()
  for (const row of rows) {
    map.set(row.setting_key, row.setting_value)
  }
  return map
}

export function settingAsString(value: unknown): string | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return null
}

export function settingAsBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value
  if (value === 'true') return true
  if (value === 'false') return false
  return fallback
}

export function settingAsNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const n = Number(value)
    if (Number.isFinite(n)) return n
  }
  return fallback
}

export function settingAsNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const t = value.trim()
    if (!t || t === 'null') return null
    const n = Number(t)
    if (Number.isFinite(n)) return n
  }
  return null
}

export function settingHasBinary(value: unknown): boolean {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (typeof value === 'object' && value !== null && 'data' in value) {
    return String((value as { data: string }).data).trim().length > 0
  }
  return false
}

export function settingToBuffer(value: unknown): Buffer | null {
  if (!settingHasBinary(value)) return null
  let base64: string
  if (typeof value === 'string') {
    base64 = value
  } else if (typeof value === 'object' && value !== null && 'data' in value) {
    base64 = String((value as { data: string }).data)
  } else {
    return null
  }
  const trimmed = base64.trim()
  if (!trimmed) return null
  return Buffer.from(trimmed, 'base64')
}
