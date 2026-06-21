import '@/i18n'
import { I18N_STORAGE_EVENT, i18n, setAppLocale } from '@/i18n'
import {
  APP_LOCALE_STORAGE_KEY,
  readStoredAppLocale,
  resolveAppLocale,
  writeStoredAppLocale,
  type AppLocale,
} from '@/lib/app-locale'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

type I18nContextValue = {
  locale: AppLocale
  setLocale: (locale: AppLocale) => void
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale>(() =>
    resolveAppLocale(readStoredAppLocale()),
  )

  const setLocale = useCallback((next: AppLocale) => {
    writeStoredAppLocale(next)
    setLocaleState(next)
    void setAppLocale(next)
  }, [])

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== APP_LOCALE_STORAGE_KEY) return
      const stored = readStoredAppLocale()
      const next = resolveAppLocale(stored)
      setLocaleState(next)
      if (i18n.language !== next) void setAppLocale(next)
    }
    const onCustom = (e: Event) => {
      const detail = (e as CustomEvent<AppLocale>).detail
      if (detail === 'en' || detail === 'th') setLocaleState(detail)
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener(I18N_STORAGE_EVENT, onCustom)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener(I18N_STORAGE_EVENT, onCustom)
    }
  }, [])

  const value = useMemo(() => ({ locale, setLocale }), [locale, setLocale])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useAppLocale(): I18nContextValue {
  const ctx = useContext(I18nContext)
  if (ctx) return ctx
  // Fallback — error boundary / edge mounts outside provider (should be rare)
  const locale = resolveAppLocale(readStoredAppLocale())
  return {
    locale,
    setLocale: (next) => {
      writeStoredAppLocale(next)
      void setAppLocale(next)
    },
  }
}
