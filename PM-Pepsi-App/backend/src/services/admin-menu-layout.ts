import type { Pool } from 'pg'
import { navShellModeSchema, type NavShellMode } from '../schemas/settings.js'
import { fetchSettings, settingAsString, upsertSetting } from './setting-store.js'

const KEY = 'nav.shell_mode'
const DEFAULT_MODE: NavShellMode = 'sidebar'

function parseMode(value: unknown): NavShellMode {
  const raw = settingAsString(value) ?? DEFAULT_MODE
  const parsed = navShellModeSchema.safeParse(raw)
  return parsed.success ? parsed.data : DEFAULT_MODE
}

export async function getNavShellMode(pool: Pool): Promise<NavShellMode> {
  try {
    const map = await fetchSettings(pool, [KEY])
    return parseMode(map.get(KEY))
  } catch {
    return DEFAULT_MODE
  }
}

export async function setNavShellMode(
  pool: Pool,
  mode: NavShellMode,
  updatedBy?: string | null,
): Promise<NavShellMode> {
  const parsed = navShellModeSchema.parse(mode)
  await upsertSetting(pool, KEY, parsed, 'system', updatedBy)
  return parsed
}
