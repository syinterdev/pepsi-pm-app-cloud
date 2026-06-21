import { describe, expect, it } from 'vitest'
import { publicSettingsResponseSchema } from '@/api/schemas'

describe('public settings schema', () => {
  it('parses branding payload from API', () => {
    const parsed = publicSettingsResponseSchema.parse({
      appName: 'PM Pepsi',
      footerText: '© Test',
      primaryColor: '#003366',
      accentColor: '#F7941D',
      successColor: '#7AC943',
      warningColor: '#F7941D',
      dangerColor: '#FF3B30',
      infoColor: '#4DA6FF',
      themeMode: 'system',
      logoMime: null,
      hasLogo: false,
      hasFavicon: false,
      hasLoginBackground: false,
      maintenance: { enabled: false, message: '' },
      navShellMode: 'sidebar',
      featureIndexeddbOffline: false,
      featureDashboardCharts: false,
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
    expect(parsed.themeMode).toBe('system')
  })
})
