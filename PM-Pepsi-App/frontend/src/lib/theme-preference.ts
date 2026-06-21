/** User override stored in session (per-tab); null = follow admin `themeMode` from public settings. */
export type ThemePreference = 'light' | 'dark' | null

const STORAGE_KEY = 'pm_theme_preference'

export function readThemePreference(): ThemePreference {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (raw === 'light' || raw === 'dark') return raw
    return null
  } catch {
    return null
  }
}

export function writeThemePreference(value: ThemePreference): void {
  try {
    if (value === null) sessionStorage.removeItem(STORAGE_KEY)
    else sessionStorage.setItem(STORAGE_KEY, value)
    window.dispatchEvent(new Event('pm-theme-preference'))
  } catch {
    /* ignore */
  }
}

export const THEME_PREFERENCE_EVENT = 'pm-theme-preference'

export function subscribeThemePreference(onChange: () => void): () => void {
  const handler = () => onChange()
  window.addEventListener(THEME_PREFERENCE_EVENT, handler)
  return () => window.removeEventListener(THEME_PREFERENCE_EVENT, handler)
}
