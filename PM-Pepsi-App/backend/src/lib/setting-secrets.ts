import type { Pool } from 'pg'

export const SECRET_MASK = '••••••••'

export function maskSecretValue(isSecret: boolean, value: unknown): unknown {
  if (!isSecret) return value
  if (value === null || value === undefined) return null
  if (typeof value === 'string' && value.trim() === '') return ''
  return SECRET_MASK
}

export type MaskedSecretSetting = {
  settingKey: string
  category: string
  description: string | null
  hasValue: boolean
  maskedValue: string
}

export async function listMaskedSecretSettings(pool: Pool): Promise<MaskedSecretSetting[]> {
  const { rows } = await pool.query<{
    setting_key: string
    setting_value: unknown
    category: string
    description: string | null
  }>(
    `SELECT setting_key, setting_value, category, description
     FROM app.tbl_setting
     WHERE is_secret = true
     ORDER BY setting_key`,
  )
  return rows.map((r) => {
    const hasValue =
      r.setting_value !== null &&
      r.setting_value !== undefined &&
      !(typeof r.setting_value === 'string' && r.setting_value.trim() === '') &&
      r.setting_value !== 'null'
    return {
      settingKey: r.setting_key,
      category: r.category,
      description: r.description,
      hasValue,
      maskedValue: hasValue ? SECRET_MASK : '',
    }
  })
}
