import type { Pool } from 'pg'
import { fetchSettings, settingAsNumber } from '../services/setting-store.js'

export const DEFAULT_PASSWORD_MIN_LENGTH = 12
export const DEFAULT_MAX_LOGIN_ATTEMPTS = 5

const CACHE_MS = 60_000

let cachedPasswordMin = DEFAULT_PASSWORD_MIN_LENGTH
let cachedMaxLoginAttempts = DEFAULT_MAX_LOGIN_ATTEMPTS
let cacheExpiresAt = 0

export function clearSecuritySettingsCache(): void {
  cacheExpiresAt = 0
}

async function refresh(pool: Pool): Promise<void> {
  const now = Date.now()
  if (cacheExpiresAt > now) return
  try {
    const map = await fetchSettings(pool, ['app.password_min_length', 'security.max_login_attempts'])
    const minLen = settingAsNumber(map.get('app.password_min_length'), DEFAULT_PASSWORD_MIN_LENGTH)
    cachedPasswordMin = Math.min(Math.max(8, minLen), 128)
    const maxAttempts = settingAsNumber(
      map.get('security.max_login_attempts'),
      DEFAULT_MAX_LOGIN_ATTEMPTS,
    )
    cachedMaxLoginAttempts = Math.min(Math.max(3, maxAttempts), 50)
  } catch {
    cachedPasswordMin = DEFAULT_PASSWORD_MIN_LENGTH
    cachedMaxLoginAttempts = DEFAULT_MAX_LOGIN_ATTEMPTS
  }
  cacheExpiresAt = now + CACHE_MS
}

export async function getPasswordMinLength(pool: Pool): Promise<number> {
  await refresh(pool)
  return cachedPasswordMin
}

export async function getMaxLoginAttempts(pool: Pool): Promise<number> {
  await refresh(pool)
  return cachedMaxLoginAttempts
}
