import {
  applyThemeToDocument,
  resolveTheme,
  type ResolvedTheme,
  type ServerThemeMode,
} from '@/lib/apply-theme'
import {
  readThemePreference,
  subscribeThemePreference,
  writeThemePreference,
  type ThemePreference,
} from '@/lib/theme-preference'
import { usePublicSettings } from '@/lib/settings-context'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react'

export type ThemeContextValue = {
  resolvedTheme: ResolvedTheme
  serverThemeMode: ServerThemeMode
  preference: ThemePreference
  /** User chose light/dark locally; null = follow admin setting */
  setPreference: (value: ThemePreference) => void
  toggleTheme: () => void
  resetToServerDefault: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function readPreferenceSnapshot(): ThemePreference {
  return readThemePreference()
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { settings } = usePublicSettings()
  const preference = useSyncExternalStore(
    subscribeThemePreference,
    readPreferenceSnapshot,
    () => null as ThemePreference,
  )

  const serverThemeMode: ServerThemeMode = settings?.themeMode ?? 'system'

  const resolvedTheme = useMemo(
    () => resolveTheme(serverThemeMode, preference),
    [serverThemeMode, preference],
  )

  useEffect(() => {
    applyThemeToDocument(settings, resolvedTheme)
  }, [settings, resolvedTheme])

  useEffect(() => {
    if (serverThemeMode !== 'system' || preference !== null) return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      if (settings) applyThemeToDocument(settings, resolveTheme('system', null))
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [serverThemeMode, preference, settings])

  const setPreference = useCallback((value: ThemePreference) => {
    writeThemePreference(value)
  }, [])

  const toggleTheme = useCallback(() => {
    const next: ThemePreference = resolvedTheme === 'dark' ? 'light' : 'dark'
    writeThemePreference(next)
  }, [resolvedTheme])

  const resetToServerDefault = useCallback(() => {
    writeThemePreference(null)
  }, [])

  const value = useMemo<ThemeContextValue>(
    () => ({
      resolvedTheme,
      serverThemeMode,
      preference,
      setPreference,
      toggleTheme,
      resetToServerDefault,
    }),
    [
      resolvedTheme,
      serverThemeMode,
      preference,
      setPreference,
      toggleTheme,
      resetToServerDefault,
    ],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return ctx
}

