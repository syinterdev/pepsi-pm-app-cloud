/** ขนาดแสดงผลโลโก้ / favicon — ตั้งใน Admin → Branding */
export const BRAND_LOGO_NAV_HEIGHT_MIN = 24
export const BRAND_LOGO_NAV_HEIGHT_MAX = 72
export const BRAND_LOGO_NAV_HEIGHT_DEFAULT = 40

export const BRAND_LOGO_LOGIN_HEIGHT_MIN = 40
export const BRAND_LOGO_LOGIN_HEIGHT_MAX = 128
export const BRAND_LOGO_LOGIN_HEIGHT_DEFAULT = 56

export const BRAND_FAVICON_SIZE_MIN = 16
export const BRAND_FAVICON_SIZE_MAX = 48
export const BRAND_FAVICON_SIZE_DEFAULT = 32

export type BrandingAssetSizes = {
  logoNavHeightPx: number
  logoLoginHeightPx: number
  faviconSizePx: number
}

export const BRANDING_ASSET_SIZE_DEFAULTS: BrandingAssetSizes = {
  logoNavHeightPx: BRAND_LOGO_NAV_HEIGHT_DEFAULT,
  logoLoginHeightPx: BRAND_LOGO_LOGIN_HEIGHT_DEFAULT,
  faviconSizePx: BRAND_FAVICON_SIZE_DEFAULT,
}

export function clampPx(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min
  return Math.min(max, Math.max(min, Math.round(value)))
}

export function parseLogoNavHeightPx(raw: unknown): number {
  const n = typeof raw === 'number' ? raw : Number(raw)
  return Number.isFinite(n)
    ? clampPx(n, BRAND_LOGO_NAV_HEIGHT_MIN, BRAND_LOGO_NAV_HEIGHT_MAX)
    : BRAND_LOGO_NAV_HEIGHT_DEFAULT
}

export function parseLogoLoginHeightPx(raw: unknown): number {
  const n = typeof raw === 'number' ? raw : Number(raw)
  return Number.isFinite(n)
    ? clampPx(n, BRAND_LOGO_LOGIN_HEIGHT_MIN, BRAND_LOGO_LOGIN_HEIGHT_MAX)
    : BRAND_LOGO_LOGIN_HEIGHT_DEFAULT
}

export function parseFaviconSizePx(raw: unknown): number {
  const n = typeof raw === 'number' ? raw : Number(raw)
  return Number.isFinite(n)
    ? clampPx(n, BRAND_FAVICON_SIZE_MIN, BRAND_FAVICON_SIZE_MAX)
    : BRAND_FAVICON_SIZE_DEFAULT
}

export function parseBrandingAssetSizes(map: {
  logoNav?: unknown
  logoLogin?: unknown
  favicon?: unknown
}): BrandingAssetSizes {
  return {
    logoNavHeightPx: parseLogoNavHeightPx(map.logoNav),
    logoLoginHeightPx: parseLogoLoginHeightPx(map.logoLogin),
    faviconSizePx: parseFaviconSizePx(map.favicon),
  }
}
