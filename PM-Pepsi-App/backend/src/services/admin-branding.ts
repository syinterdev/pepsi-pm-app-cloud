import type { Pool } from 'pg'
import {
  adminBrandingResponseSchema,
  type AdminBrandingResponse,
  patchAdminBrandingBodySchema,
} from '../schemas/admin-branding.js'
import { themeModeSchema } from '../schemas/settings.js'
import {
  convertBrandingFavicon,
  convertBrandingLoginBackground,
  convertBrandingLogo,
} from './branding-image.js'
import {
  BRANDING_ASSET_SIZE_DEFAULTS,
  parseBrandingAssetSizes,
  parseFaviconSizePx,
} from '../lib/branding-asset-sizes.js'
import {
  fontFamilyKeySchema,
  fontSizePresetSchema,
  TYPOGRAPHY_DEFAULTS,
} from '../lib/typography.js'
import {
  fetchSettings,
  isSettingTableMissing,
  settingAsNullableNumber,
  settingAsString,
  settingHasBinary,
  settingToBuffer,
  upsertSetting,
} from './setting-store.js'

const BRANDING_CATEGORY = 'branding'

const BRANDING_KEYS = [
  'app.name',
  'app.footer_text',
  'app.primary_color',
  'app.accent_color',
  'app.theme_mode',
  'app.logo_bytes',
  'app.logo_mime',
  'app.favicon_bytes',
  'app.success_color',
  'app.warning_color',
  'app.danger_color',
  'app.info_color',
  'app.login_bg_bytes',
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

export const BRANDING_DEFAULTS = {
  appName: 'PM Pepsi',
  footerText: '© S.Y. Interactive Development Limited',
  primaryColor: '#003366',
  accentColor: '#F7941D',
  successColor: '#7AC943',
  warningColor: '#F7941D',
  dangerColor: '#FF3B30',
  infoColor: '#4DA6FF',
  themeMode: 'system' as const,
  ...TYPOGRAPHY_DEFAULTS,
  ...BRANDING_ASSET_SIZE_DEFAULTS,
}

function parseFontFamily(raw: string | undefined): (typeof TYPOGRAPHY_DEFAULTS)['fontFamily'] {
  const p = fontFamilyKeySchema.safeParse(raw)
  return p.success ? p.data : TYPOGRAPHY_DEFAULTS.fontFamily
}

function parseFontSizePreset(raw: string | undefined): (typeof TYPOGRAPHY_DEFAULTS)['fontSizePreset'] {
  const p = fontSizePresetSchema.safeParse(raw)
  return p.success ? p.data : TYPOGRAPHY_DEFAULTS.fontSizePreset
}

function mapBrandingRows(map: Map<string, unknown>): AdminBrandingResponse {
  const themeRaw = settingAsString(map.get('app.theme_mode')) ?? BRANDING_DEFAULTS.themeMode
  const themeMode = themeModeSchema.safeParse(themeRaw).success
    ? themeModeSchema.parse(themeRaw)
    : BRANDING_DEFAULTS.themeMode

  return adminBrandingResponseSchema.parse({
    appName: settingAsString(map.get('app.name')) ?? BRANDING_DEFAULTS.appName,
    footerText: settingAsString(map.get('app.footer_text')) ?? BRANDING_DEFAULTS.footerText,
    primaryColor: settingAsString(map.get('app.primary_color')) ?? BRANDING_DEFAULTS.primaryColor,
    accentColor: settingAsString(map.get('app.accent_color')) ?? BRANDING_DEFAULTS.accentColor,
    successColor: settingAsString(map.get('app.success_color')) ?? BRANDING_DEFAULTS.successColor,
    warningColor: settingAsString(map.get('app.warning_color')) ?? BRANDING_DEFAULTS.warningColor,
    dangerColor: settingAsString(map.get('app.danger_color')) ?? BRANDING_DEFAULTS.dangerColor,
    infoColor: settingAsString(map.get('app.info_color')) ?? BRANDING_DEFAULTS.infoColor,
    themeMode,
    logoMime: settingAsString(map.get('app.logo_mime')),
    hasLogo: settingHasBinary(map.get('app.logo_bytes')),
    hasFavicon: settingHasBinary(map.get('app.favicon_bytes')),
    hasLoginBackground: settingHasBinary(map.get('app.login_bg_bytes')),
    fontFamily: parseFontFamily(settingAsString(map.get('app.font_family')) ?? undefined),
    fontSizePreset: parseFontSizePreset(settingAsString(map.get('app.font_size_preset')) ?? undefined),
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

export async function getAdminBranding(pool: Pool): Promise<AdminBrandingResponse> {
  try {
    const map = await fetchSettings(pool, BRANDING_KEYS, { omitBinaryPayloads: true })
    if (!map.size) return mapBrandingRows(new Map())
    return mapBrandingRows(map)
  } catch (err) {
    if (isSettingTableMissing(err)) return mapBrandingRows(new Map())
    throw err
  }
}

export async function patchAdminBranding(
  pool: Pool,
  body: unknown,
  updatedBy: string,
): Promise<AdminBrandingResponse> {
  const parsed = patchAdminBrandingBodySchema.parse(body)
  if (parsed.appName !== undefined) {
    await upsertSetting(pool, 'app.name', parsed.appName, BRANDING_CATEGORY, updatedBy)
  }
  if (parsed.footerText !== undefined) {
    await upsertSetting(pool, 'app.footer_text', parsed.footerText, BRANDING_CATEGORY, updatedBy)
  }
  if (parsed.primaryColor !== undefined) {
    await upsertSetting(pool, 'app.primary_color', parsed.primaryColor, BRANDING_CATEGORY, updatedBy)
  }
  if (parsed.accentColor !== undefined) {
    await upsertSetting(pool, 'app.accent_color', parsed.accentColor, BRANDING_CATEGORY, updatedBy)
  }
  if (parsed.successColor !== undefined) {
    await upsertSetting(pool, 'app.success_color', parsed.successColor, BRANDING_CATEGORY, updatedBy)
  }
  if (parsed.warningColor !== undefined) {
    await upsertSetting(pool, 'app.warning_color', parsed.warningColor, BRANDING_CATEGORY, updatedBy)
  }
  if (parsed.dangerColor !== undefined) {
    await upsertSetting(pool, 'app.danger_color', parsed.dangerColor, BRANDING_CATEGORY, updatedBy)
  }
  if (parsed.infoColor !== undefined) {
    await upsertSetting(pool, 'app.info_color', parsed.infoColor, BRANDING_CATEGORY, updatedBy)
  }
  if (parsed.themeMode !== undefined) {
    await upsertSetting(pool, 'app.theme_mode', parsed.themeMode, BRANDING_CATEGORY, updatedBy)
  }
  if (parsed.fontFamily !== undefined) {
    await upsertSetting(pool, 'app.font_family', parsed.fontFamily, BRANDING_CATEGORY, updatedBy)
  }
  if (parsed.fontSizePreset !== undefined) {
    await upsertSetting(pool, 'app.font_size_preset', parsed.fontSizePreset, BRANDING_CATEGORY, updatedBy)
  }
  if (parsed.fontSizeBasePx !== undefined) {
    await upsertSetting(pool, 'app.font_size_base_px', parsed.fontSizeBasePx, BRANDING_CATEGORY, updatedBy)
  }
  if (parsed.fontColor !== undefined) {
    await upsertSetting(pool, 'app.font_color', parsed.fontColor, BRANDING_CATEGORY, updatedBy)
  }
  if (parsed.fontHeadingColor !== undefined) {
    await upsertSetting(pool, 'app.font_heading_color', parsed.fontHeadingColor, BRANDING_CATEGORY, updatedBy)
  }
  if (parsed.fontMutedColor !== undefined) {
    await upsertSetting(pool, 'app.font_muted_color', parsed.fontMutedColor, BRANDING_CATEGORY, updatedBy)
  }
  if (parsed.logoNavHeightPx !== undefined) {
    await upsertSetting(pool, 'app.logo_nav_height_px', parsed.logoNavHeightPx, BRANDING_CATEGORY, updatedBy)
  }
  if (parsed.logoLoginHeightPx !== undefined) {
    await upsertSetting(pool, 'app.logo_login_height_px', parsed.logoLoginHeightPx, BRANDING_CATEGORY, updatedBy)
  }
  if (parsed.faviconSizePx !== undefined) {
    await upsertSetting(pool, 'app.favicon_size_px', parsed.faviconSizePx, BRANDING_CATEGORY, updatedBy)
    await resizeStoredFaviconIfPresent(pool, parsed.faviconSizePx, updatedBy)
  }
  return getAdminBranding(pool)
}

async function resizeStoredFaviconIfPresent(
  pool: Pool,
  sizePx: number,
  updatedBy: string,
): Promise<void> {
  const existing = await getBrandingFavicon(pool)
  if (!existing?.length) return
  const out = await convertBrandingFavicon(existing, 'image/png', sizePx)
  await upsertSetting(
    pool,
    'app.favicon_bytes',
    out.data.toString('base64'),
    BRANDING_CATEGORY,
    updatedBy,
  )
}

export async function setBrandingLogo(
  pool: Pool,
  input: Buffer,
  updatedBy: string,
  mimetype?: string,
  options?: { removeBackground?: boolean },
): Promise<{ hasLogo: true; logoMime: string; bytes: number; width: number; height: number }> {
  const out = await convertBrandingLogo(input, mimetype, options)
  const base64 = out.data.toString('base64')
  await upsertSetting(pool, 'app.logo_bytes', base64, BRANDING_CATEGORY, updatedBy)
  await upsertSetting(pool, 'app.logo_mime', out.mime, BRANDING_CATEGORY, updatedBy)
  return {
    hasLogo: true,
    logoMime: out.mime,
    bytes: out.bytes,
    width: out.width,
    height: out.height,
  }
}

export async function clearBrandingLogo(pool: Pool, updatedBy: string): Promise<void> {
  await upsertSetting(pool, 'app.logo_bytes', null, BRANDING_CATEGORY, updatedBy)
  await upsertSetting(pool, 'app.logo_mime', null, BRANDING_CATEGORY, updatedBy)
}

export async function setBrandingFavicon(
  pool: Pool,
  input: Buffer,
  updatedBy: string,
  mimetype?: string,
  options?: { removeBackground?: boolean },
): Promise<{ hasFavicon: true; mime: string; bytes: number }> {
  const map = await fetchSettings(pool, ['app.favicon_size_px'])
  const sizePx = parseFaviconSizePx(map.get('app.favicon_size_px'))
  const out = await convertBrandingFavicon(input, mimetype, sizePx, options)
  await upsertSetting(
    pool,
    'app.favicon_bytes',
    out.data.toString('base64'),
    BRANDING_CATEGORY,
    updatedBy,
  )
  return { hasFavicon: true, mime: out.mime, bytes: out.bytes }
}

export async function clearBrandingFavicon(pool: Pool, updatedBy: string): Promise<void> {
  await upsertSetting(pool, 'app.favicon_bytes', null, BRANDING_CATEGORY, updatedBy)
}

export async function clearBrandingLoginBackground(pool: Pool, updatedBy: string): Promise<void> {
  await upsertSetting(pool, 'app.login_bg_bytes', null, BRANDING_CATEGORY, updatedBy)
}

export async function setBrandingLoginBackground(
  pool: Pool,
  input: Buffer,
  updatedBy: string,
  mimetype?: string,
): Promise<{ hasLoginBackground: true; bytes: number; width: number; height: number }> {
  const out = await convertBrandingLoginBackground(input, mimetype)
  await upsertSetting(
    pool,
    'app.login_bg_bytes',
    out.data.toString('base64'),
    BRANDING_CATEGORY,
    updatedBy,
  )
  return {
    hasLoginBackground: true,
    bytes: out.bytes,
    width: out.width,
    height: out.height,
  }
}

export async function getBrandingLoginBackground(pool: Pool): Promise<Buffer | null> {
  try {
    const map = await fetchSettings(pool, ['app.login_bg_bytes'])
    return settingToBuffer(map.get('app.login_bg_bytes'))
  } catch {
    return null
  }
}

export async function resetBrandingDefaults(pool: Pool, updatedBy: string): Promise<AdminBrandingResponse> {
  await clearBrandingLogo(pool, updatedBy)
  await clearBrandingFavicon(pool, updatedBy)
  await clearBrandingLoginBackground(pool, updatedBy)
  await upsertSetting(pool, 'app.name', BRANDING_DEFAULTS.appName, BRANDING_CATEGORY, updatedBy)
  await upsertSetting(pool, 'app.footer_text', BRANDING_DEFAULTS.footerText, BRANDING_CATEGORY, updatedBy)
  await upsertSetting(pool, 'app.primary_color', BRANDING_DEFAULTS.primaryColor, BRANDING_CATEGORY, updatedBy)
  await upsertSetting(pool, 'app.accent_color', BRANDING_DEFAULTS.accentColor, BRANDING_CATEGORY, updatedBy)
  await upsertSetting(pool, 'app.success_color', BRANDING_DEFAULTS.successColor, BRANDING_CATEGORY, updatedBy)
  await upsertSetting(pool, 'app.warning_color', BRANDING_DEFAULTS.warningColor, BRANDING_CATEGORY, updatedBy)
  await upsertSetting(pool, 'app.danger_color', BRANDING_DEFAULTS.dangerColor, BRANDING_CATEGORY, updatedBy)
  await upsertSetting(pool, 'app.info_color', BRANDING_DEFAULTS.infoColor, BRANDING_CATEGORY, updatedBy)
  await upsertSetting(pool, 'app.theme_mode', BRANDING_DEFAULTS.themeMode, BRANDING_CATEGORY, updatedBy)
  await upsertSetting(pool, 'app.font_family', BRANDING_DEFAULTS.fontFamily, BRANDING_CATEGORY, updatedBy)
  await upsertSetting(pool, 'app.font_size_preset', BRANDING_DEFAULTS.fontSizePreset, BRANDING_CATEGORY, updatedBy)
  await upsertSetting(pool, 'app.font_size_base_px', BRANDING_DEFAULTS.fontSizeBasePx, BRANDING_CATEGORY, updatedBy)
  await upsertSetting(pool, 'app.font_color', BRANDING_DEFAULTS.fontColor, BRANDING_CATEGORY, updatedBy)
  await upsertSetting(pool, 'app.font_heading_color', BRANDING_DEFAULTS.fontHeadingColor, BRANDING_CATEGORY, updatedBy)
  await upsertSetting(pool, 'app.font_muted_color', BRANDING_DEFAULTS.fontMutedColor, BRANDING_CATEGORY, updatedBy)
  await upsertSetting(
    pool,
    'app.logo_nav_height_px',
    BRANDING_DEFAULTS.logoNavHeightPx,
    BRANDING_CATEGORY,
    updatedBy,
  )
  await upsertSetting(
    pool,
    'app.logo_login_height_px',
    BRANDING_DEFAULTS.logoLoginHeightPx,
    BRANDING_CATEGORY,
    updatedBy,
  )
  await upsertSetting(
    pool,
    'app.favicon_size_px',
    BRANDING_DEFAULTS.faviconSizePx,
    BRANDING_CATEGORY,
    updatedBy,
  )
  return getAdminBranding(pool)
}

export async function getBrandingLogo(pool: Pool): Promise<{ buffer: Buffer; mime: string } | null> {
  try {
    const map = await fetchSettings(pool, ['app.logo_bytes', 'app.logo_mime'])
    const buffer = settingToBuffer(map.get('app.logo_bytes'))
    if (!buffer) return null
    const mime = settingAsString(map.get('app.logo_mime')) ?? 'image/webp'
    return { buffer, mime }
  } catch {
    return null
  }
}

export async function getBrandingFavicon(pool: Pool): Promise<Buffer | null> {
  try {
    const map = await fetchSettings(pool, ['app.favicon_bytes'])
    return settingToBuffer(map.get('app.favicon_bytes'))
  } catch {
    return null
  }
}
