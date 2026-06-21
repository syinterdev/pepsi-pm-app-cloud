import type { Pool } from 'pg'

import {

  publicSettingsResponseSchema,

  type PublicSettingsResponse,

  themeModeSchema,
  navShellModeSchema,
} from '../schemas/settings.js'

import { BRANDING_ASSET_SIZE_DEFAULTS, parseBrandingAssetSizes } from '../lib/branding-asset-sizes.js'
import {
  BRANDING_DEFAULTS,
  getBrandingFavicon,
  getBrandingLoginBackground,
  getBrandingLogo,
} from './admin-branding.js'

import {
  fontFamilyKeySchema,
  fontSizePresetSchema,
  TYPOGRAPHY_DEFAULTS,
} from '../lib/typography.js'
import {
  fetchSettings,
  isSettingTableMissing,
  settingAsBoolean,
  settingAsNullableNumber,
  settingAsString,
  settingHasBinary,
} from './setting-store.js'



const PUBLIC_KEYS = [

  'app.name',

  'app.logo_bytes',

  'app.logo_mime',

  'app.favicon_bytes',

  'app.footer_text',

  'app.primary_color',

  'app.accent_color',

  'app.success_color',

  'app.warning_color',

  'app.danger_color',

  'app.info_color',

  'app.login_bg_bytes',

  'app.theme_mode',

  'maintenance.enabled',

  'maintenance.message',

  'nav.shell_mode',

  'feature.indexeddb_offline',

  'feature.dashboard_charts',

  'app.font_family',

  'app.font_size_preset',

  'app.font_size_base_px',

  'app.font_color',

  'app.font_heading_color',

  'app.font_muted_color',
  'app.logo_nav_height_px',
  'app.logo_login_height_px',
  'app.favicon_size_px',
] as const



const DEFAULT_PUBLIC: PublicSettingsResponse = {

  appName: 'PM Pepsi',

  footerText: '© S.Y. Interactive Development Limited',

  primaryColor: BRANDING_DEFAULTS.primaryColor,

  accentColor: BRANDING_DEFAULTS.accentColor,

  successColor: BRANDING_DEFAULTS.successColor,

  warningColor: BRANDING_DEFAULTS.warningColor,

  dangerColor: BRANDING_DEFAULTS.dangerColor,

  infoColor: BRANDING_DEFAULTS.infoColor,

  themeMode: 'system',

  logoMime: null,

  hasLogo: false,

  hasFavicon: false,

  hasLoginBackground: false,

  maintenance: { enabled: false, message: '' },

  navShellMode: 'sidebar',

  featureIndexeddbOffline: false,

  featureDashboardCharts: false,

  fontFamily: TYPOGRAPHY_DEFAULTS.fontFamily,

  fontSizePreset: TYPOGRAPHY_DEFAULTS.fontSizePreset,

  fontSizeBasePx: TYPOGRAPHY_DEFAULTS.fontSizeBasePx,

  fontColor: TYPOGRAPHY_DEFAULTS.fontColor,

  fontHeadingColor: TYPOGRAPHY_DEFAULTS.fontHeadingColor,

  fontMutedColor: TYPOGRAPHY_DEFAULTS.fontMutedColor,
  ...BRANDING_ASSET_SIZE_DEFAULTS,
}



function asBoolean(value: unknown, fallback = false): boolean {

  if (typeof value === 'boolean') return value

  if (value === 'true') return true

  if (value === 'false') return false

  return fallback

}



function mapSettingsMap(map: Map<string, unknown>): PublicSettingsResponse {
  const themeRaw = settingAsString(map.get('app.theme_mode')) ?? DEFAULT_PUBLIC.themeMode

  const themeMode = themeModeSchema.safeParse(themeRaw).success

    ? themeModeSchema.parse(themeRaw)

    : DEFAULT_PUBLIC.themeMode



  return publicSettingsResponseSchema.parse({

    appName: settingAsString(map.get('app.name')) ?? DEFAULT_PUBLIC.appName,

    footerText: settingAsString(map.get('app.footer_text')) ?? DEFAULT_PUBLIC.footerText,

    primaryColor: settingAsString(map.get('app.primary_color')) ?? DEFAULT_PUBLIC.primaryColor,

    accentColor: settingAsString(map.get('app.accent_color')) ?? DEFAULT_PUBLIC.accentColor,

    successColor: settingAsString(map.get('app.success_color')) ?? DEFAULT_PUBLIC.successColor,

    warningColor: settingAsString(map.get('app.warning_color')) ?? DEFAULT_PUBLIC.warningColor,

    dangerColor: settingAsString(map.get('app.danger_color')) ?? DEFAULT_PUBLIC.dangerColor,

    infoColor: settingAsString(map.get('app.info_color')) ?? DEFAULT_PUBLIC.infoColor,

    themeMode,

    navShellMode: (() => {
      const raw = settingAsString(map.get('nav.shell_mode')) ?? DEFAULT_PUBLIC.navShellMode
      const parsed = navShellModeSchema.safeParse(raw)
      return parsed.success ? parsed.data : DEFAULT_PUBLIC.navShellMode
    })(),

    logoMime: settingAsString(map.get('app.logo_mime')),

    hasLogo: settingHasBinary(map.get('app.logo_bytes')),

    hasFavicon: settingHasBinary(map.get('app.favicon_bytes')),

    hasLoginBackground: settingHasBinary(map.get('app.login_bg_bytes')),

    maintenance: {

      enabled: asBoolean(map.get('maintenance.enabled'), false),

      message: settingAsString(map.get('maintenance.message')) ?? '',

    },

    featureIndexeddbOffline: settingAsBoolean(
      map.get('feature.indexeddb_offline'),
      DEFAULT_PUBLIC.featureIndexeddbOffline,
    ),

    featureDashboardCharts: settingAsBoolean(
      map.get('feature.dashboard_charts'),
      DEFAULT_PUBLIC.featureDashboardCharts,
    ),

    fontFamily: (() => {
      const raw = settingAsString(map.get('app.font_family')) ?? DEFAULT_PUBLIC.fontFamily
      const p = fontFamilyKeySchema.safeParse(raw)
      return p.success ? p.data : DEFAULT_PUBLIC.fontFamily
    })(),

    fontSizePreset: (() => {
      const raw = settingAsString(map.get('app.font_size_preset')) ?? DEFAULT_PUBLIC.fontSizePreset
      const p = fontSizePresetSchema.safeParse(raw)
      return p.success ? p.data : DEFAULT_PUBLIC.fontSizePreset
    })(),

    fontSizeBasePx: settingAsNullableNumber(map.get('app.font_size_base_px')),

    fontColor: settingAsString(map.get('app.font_color')),

    fontHeadingColor: settingAsString(map.get('app.font_heading_color')),

    fontMutedColor: settingAsString(map.get('app.font_muted_color')),
    ...parseBrandingAssetSizes({
      logoNav: map.get('app.logo_nav_height_px'),
      logoLogin: map.get('app.logo_login_height_px'),
      favicon: map.get('app.favicon_size_px'),
    }),
  })
}



export async function getPublicSettings(pool: Pool): Promise<PublicSettingsResponse> {
  try {
    const map = await fetchSettings(pool, PUBLIC_KEYS, {
      omitBinaryPayloads: true,
      publicOnly: true,
    })
    if (!map.size) return DEFAULT_PUBLIC
    return mapSettingsMap(map)
  } catch (err) {
    if (isSettingTableMissing(err)) return DEFAULT_PUBLIC
    throw err
  }
}



export async function getPublicLogo(

  pool: Pool,

): Promise<{ buffer: Buffer; mime: string } | null> {

  return getBrandingLogo(pool)

}



export async function getPublicFavicon(pool: Pool): Promise<Buffer | null> {

  return getBrandingFavicon(pool)

}



export async function getPublicLoginBackground(pool: Pool): Promise<Buffer | null> {

  return getBrandingLoginBackground(pool)

}


