import { describe, expect, it } from 'vitest'
import { DEFAULT_APP_LOCALE, resolveAppLocale } from '@/lib/app-locale'

describe('app-locale', () => {
  it('defaults to English', () => {
    expect(DEFAULT_APP_LOCALE).toBe('en')
    expect(resolveAppLocale(null)).toBe('en')
  })

  it('respects stored preference', () => {
    expect(resolveAppLocale('th')).toBe('th')
    expect(resolveAppLocale('en')).toBe('en')
  })
})
