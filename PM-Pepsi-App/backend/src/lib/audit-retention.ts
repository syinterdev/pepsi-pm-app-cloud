import type { Pool } from 'pg'
import { fetchSettings, settingAsNumber } from '../services/setting-store.js'

export const AUDIT_RETENTION_SETTING_KEY = 'audit.retention_days'
export const DEFAULT_AUDIT_RETENTION_DAYS = 365

export async function getAuditRetentionDays(pool: Pool): Promise<number> {
  const map = await fetchSettings(pool, [AUDIT_RETENTION_SETTING_KEY])
  const n = settingAsNumber(map.get(AUDIT_RETENTION_SETTING_KEY), DEFAULT_AUDIT_RETENTION_DAYS)
  return Math.max(30, Math.min(3650, Math.round(n)))
}

/** วันที่ลบได้ (YYYY-MM-DD) — ลบรายการที่ created_at ก่อนวันนี้ */
export function auditRetentionCutoffDate(retentionDays: number, now = new Date()): string {
  const d = new Date(now)
  d.setUTCDate(d.getUTCDate() - retentionDays)
  return d.toISOString().slice(0, 10)
}
