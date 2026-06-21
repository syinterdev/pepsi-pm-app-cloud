import { z } from 'zod'
import { fontFamilyKeySchema, fontSizePresetSchema } from '../lib/typography.js'

export const themeModeSchema = z.enum(['light', 'dark', 'system'])

/** รูปแบบเมนูหลัก — admin ตั้งใน Menu Builder */
export const navShellModeSchema = z.enum(['sidebar', 'navbar', 'hamburger'])

export type NavShellMode = z.infer<typeof navShellModeSchema>

export const publicSettingsResponseSchema = z.object({
  appName: z.string(),
  footerText: z.string(),
  primaryColor: z.string(),
  accentColor: z.string(),
  themeMode: themeModeSchema,
  navShellMode: navShellModeSchema,
  successColor: z.string(),
  warningColor: z.string(),
  dangerColor: z.string(),
  infoColor: z.string(),
  logoMime: z.string().nullable(),
  hasLogo: z.boolean(),
  hasFavicon: z.boolean(),
  hasLoginBackground: z.boolean(),
  maintenance: z.object({
    enabled: z.boolean(),
    message: z.string(),
  }),
  featureIndexeddbOffline: z.boolean(),
  featureDashboardCharts: z.boolean(),
  fontFamily: fontFamilyKeySchema,
  fontSizePreset: fontSizePresetSchema,
  fontSizeBasePx: z.number().int().min(12).max(22).nullable(),
  fontColor: z.string().nullable(),
  fontHeadingColor: z.string().nullable(),
  fontMutedColor: z.string().nullable(),
  logoNavHeightPx: z.number().int(),
  logoLoginHeightPx: z.number().int(),
  faviconSizePx: z.number().int(),
})

export type PublicSettingsResponse = z.infer<typeof publicSettingsResponseSchema>
