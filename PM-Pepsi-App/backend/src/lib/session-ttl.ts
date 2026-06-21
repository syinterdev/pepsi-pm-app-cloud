import type { Pool } from 'pg'
import { fetchSettings, settingAsNumber } from '../services/setting-store.js'

const DEFAULT_MIN = 480
const CACHE_MS = 60_000

let cachedMs = DEFAULT_MIN * 60 * 1000
let cacheExpiresAt = 0

export function clearSessionTtlCache(): void {
  cacheExpiresAt = 0
}

export async function getSessionTtlMs(pool: Pool): Promise<number> {
  const now = Date.now()
  if (cacheExpiresAt > now) return cachedMs
  try {
    const map = await fetchSettings(pool, ['app.session_ttl_min'])
    const min = settingAsNumber(map.get('app.session_ttl_min'), DEFAULT_MIN)
    const safeMin = Math.min(Math.max(15, min), 1440)
    cachedMs = safeMin * 60 * 1000
  } catch {
    cachedMs = DEFAULT_MIN * 60 * 1000
  }
  cacheExpiresAt = now + CACHE_MS
  return cachedMs
}

export function sessionTtlMaxAgeSec(ttlMs: number): number {
  return Math.max(60, Math.ceil(ttlMs / 1000))
}
