import { describe, expect, it } from 'vitest'
import { adminBrandingResponseSchema, hexColorSchema, patchAdminBrandingBodySchema } from './admin-branding.js'

describe('admin branding schemas', () => {
  it('parses admin branding response', () => {
    const parsed = adminBrandingResponseSchema.parse({
      appName: 'PM Pepsi',
      footerText: '© Test',
      primaryColor: '#003366',
      accentColor: '#F7941D',
      successColor: '#7AC943',
      warningColor: '#F7941D',
      dangerColor: '#FF3B30',
      infoColor: '#4DA6FF',
      themeMode: 'dark',
      logoMime: 'image/webp',
      hasLogo: true,
      hasFavicon: false,
      hasLoginBackground: false,
      fontFamily: 'sarabun',
      fontSizePreset: 'comfortable',
      fontSizeBasePx: null,
      fontColor: null,
      fontHeadingColor: null,
      fontMutedColor: null,
      logoNavHeightPx: 32,
      logoLoginHeightPx: 56,
      faviconSizePx: 32,
    })
    expect(parsed.themeMode).toBe('dark')
  })

  it('validates hex colors', () => {
    expect(hexColorSchema.safeParse('#FF3B30').success).toBe(true)
    expect(hexColorSchema.safeParse('red').success).toBe(false)
  })

  it('requires at least one patch field', () => {
    expect(patchAdminBrandingBodySchema.safeParse({}).success).toBe(false)
    expect(patchAdminBrandingBodySchema.safeParse({ appName: 'X' }).success).toBe(true)
  })
})
