import type { Pool } from 'pg'
import {
  fetchSettings,
  settingAsBoolean,
  settingAsNumber,
} from './setting-store.js'

const KEYS = [
  'integration.watch_enabled',
  'integration.watch_interval_minutes',
] as const

export type IntegrationWatchSettings = {
  enabled: boolean
  intervalMinutes: number
}

export async function getIntegrationWatchSettings(
  pool: Pool,
): Promise<IntegrationWatchSettings> {
  const map = await fetchSettings(pool, KEYS)
  return {
    enabled: settingAsBoolean(map.get('integration.watch_enabled'), true),
    intervalMinutes: Math.max(
      1,
      Math.min(60, settingAsNumber(map.get('integration.watch_interval_minutes'), 10)),
    ),
  }
}
