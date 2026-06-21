/** UI language — English is the product default. */
export type AppLocale = 'en' | 'th'

export const APP_LOCALE_STORAGE_KEY = 'pm-app.locale'

export const DEFAULT_APP_LOCALE: AppLocale = 'en'

/** BCP 47 for Intl / HTTP */
export function appLocaleToBcp47(locale: AppLocale): 'en-US' | 'th-TH' {
  return locale === 'th' ? 'th-TH' : 'en-US'
}

export function readStoredAppLocale(): AppLocale | null {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(APP_LOCALE_STORAGE_KEY)
  if (raw === 'en' || raw === 'th') return raw
  return null
}

export function writeStoredAppLocale(locale: AppLocale): void {
  window.localStorage.setItem(APP_LOCALE_STORAGE_KEY, locale)
}

export function resolveAppLocale(stored: AppLocale | null): AppLocale {
  return stored ?? DEFAULT_APP_LOCALE
}
