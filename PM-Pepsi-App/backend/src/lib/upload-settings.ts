import type { Pool } from 'pg'
import { fetchSettings, settingAsNumber } from '../services/setting-store.js'

const DEFAULT_MB = 15
const CACHE_MS = 60_000

let cachedBytes = DEFAULT_MB * 1024 * 1024
let cacheExpiresAt = 0

export function clearUploadLimitCache(): void {
  cacheExpiresAt = 0
}

export async function getUploadMaxBytes(pool: Pool): Promise<number> {
  const now = Date.now()
  if (cacheExpiresAt > now) return cachedBytes
  try {
    const map = await fetchSettings(pool, ['app.upload_max_mb'])
    const mb = settingAsNumber(map.get('app.upload_max_mb'), DEFAULT_MB)
    const safeMb = Math.min(Math.max(1, mb), 500)
    cachedBytes = safeMb * 1024 * 1024
  } catch {
    cachedBytes = DEFAULT_MB * 1024 * 1024
  }
  cacheExpiresAt = now + CACHE_MS
  return cachedBytes
}

/** Sync limit for multer (refreshed from DB periodically). */
export function getMulterFileSizeLimit(): number {
  return cachedBytes
}

export async function refreshUploadLimitFromDb(pool: Pool): Promise<number> {
  clearUploadLimitCache()
  const bytes = await getUploadMaxBytes(pool)
  return bytes
}
