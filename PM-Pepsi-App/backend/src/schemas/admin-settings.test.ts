import { describe, expect, it } from 'vitest'
import { adminSettingsResponseSchema, patchAdminSettingsBodySchema } from './admin-settings.js'

describe('admin settings schemas', () => {
  it('parses admin settings response', () => {
    const parsed = adminSettingsResponseSchema.parse({
      locale: 'th-TH',
      timezone: 'Asia/Bangkok',
      yearFormat: 'BE',
      dateFormat: 'dd/MM/yyyy',
      uploadMaxMb: 15,
      sessionTtlMin: 480,
      passwordMinLength: 12,
      maxLoginAttempts: 5,
      featureIndexeddbOffline: false,
      featureDashboardCharts: true,
      maintenanceEnabled: false,
      maintenanceMessage: '',
    })
    expect(parsed.yearFormat).toBe('BE')
  })

  it('requires at least one patch field', () => {
    expect(patchAdminSettingsBodySchema.safeParse({}).success).toBe(false)
    expect(patchAdminSettingsBodySchema.safeParse({ uploadMaxMb: 20 }).success).toBe(true)
  })
})
