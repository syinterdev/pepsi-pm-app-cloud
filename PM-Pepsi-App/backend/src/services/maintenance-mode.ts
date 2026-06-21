import type { Pool } from 'pg'
import { fetchSettings, settingAsBoolean, settingAsString } from './setting-store.js'

const MAINTENANCE_KEYS = ['maintenance.enabled', 'maintenance.message'] as const

let cache: { enabled: boolean; message: string; expiresAt: number } | null = null
const CACHE_MS = 5_000

export function clearMaintenanceCache(): void {
  cache = null
}

export async function getMaintenanceState(pool: Pool): Promise<{
  enabled: boolean
  message: string
}> {
  const now = Date.now()
  if (cache && cache.expiresAt > now) {
    return { enabled: cache.enabled, message: cache.message }
  }
  try {
    const map = await fetchSettings(pool, MAINTENANCE_KEYS)
    const enabled = settingAsBoolean(map.get('maintenance.enabled'), false)
    const message =
      settingAsString(map.get('maintenance.message'))?.trim() ||
      'ระบบอยู่ระหว่างบำรุงรักษา — บางฟังก์ชันอาจใช้งานไม่ได้ชั่วคราว'
    cache = { enabled, message, expiresAt: now + CACHE_MS }
    return { enabled, message }
  } catch {
    return {
      enabled: false,
      message: '',
    }
  }
}

/** Permissions that may mutate data while maintenance mode is on */
export const MAINTENANCE_BYPASS_PERMISSIONS = [
  'admin.settings.write',
  'admin.backup.restore',
  'admin.backup.write',
  'admin.health.migrate',
] as const

const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

export function isMutatingMethod(method: string): boolean {
  return MUTATING.has(method.toUpperCase())
}

/** Paths always allowed to mutate even during maintenance */
export function isMaintenanceExemptPath(path: string): boolean {
  const p = path.split('?')[0] ?? path
  if (p === '/api/v1/auth/login') return true
  if (p === '/api/v1/auth/logout') return true
  if (p === '/api/v1/telegram/webhook') return true
  return false
}
