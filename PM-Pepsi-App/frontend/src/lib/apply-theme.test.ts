import { describe, expect, it } from 'vitest'
import { resolveTheme } from '@/lib/apply-theme'

describe('resolveTheme', () => {
  it('prefers user preference over server mode', () => {
    expect(resolveTheme('dark', 'light')).toBe('light')
    expect(resolveTheme('light', 'dark')).toBe('dark')
  })

  it('uses server light/dark when no preference', () => {
    expect(resolveTheme('dark', null)).toBe('dark')
    expect(resolveTheme('light', null)).toBe('light')
  })
})
