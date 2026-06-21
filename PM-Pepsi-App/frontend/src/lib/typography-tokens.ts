import { z } from 'zod'

export const fontFamilyKeySchema = z.enum([
  'system',
  'macos',
  'sarabun',
  'noto-sans-thai',
  'inter',
  'ibm-plex-sans-thai',
])

export type FontFamilyKey = z.infer<typeof fontFamilyKeySchema>

export const fontSizePresetSchema = z.enum(['compact', 'comfortable', 'large'])

export type FontSizePreset = z.infer<typeof fontSizePresetSchema>

export const FONT_FAMILY_OPTIONS: { value: FontFamilyKey; label: string }[] = [
  { value: 'macos', label: 'macOS / MacBook (SF Pro)' },
  { value: 'system', label: 'System — Windows (Segoe UI)' },
  { value: 'sarabun', label: 'Sarabun — อ่านไทยสบายตา' },
  { value: 'noto-sans-thai', label: 'Noto Sans Thai' },
  { value: 'inter', label: 'Inter (Latin)' },
  { value: 'ibm-plex-sans-thai', label: 'IBM Plex Sans Thai' },
]

export const FONT_SIZE_PRESET_OPTIONS: { value: FontSizePreset; label: string; px: number }[] = [
  { value: 'compact', label: 'กะทัดรัด', px: 13 },
  { value: 'comfortable', label: 'สบายตา (แนะนำ)', px: 15 },
  { value: 'large', label: 'ใหญ่', px: 17 },
]

export const FONT_SIZE_PRESET_PX: Record<FontSizePreset, number> = {
  compact: 13,
  comfortable: 15,
  large: 17,
}

export const FONT_FAMILY_STACK: Record<FontFamilyKey, string> = {
  system:
    '"Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif',
  macos:
    '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "SF Pro", "Helvetica Neue", system-ui, sans-serif',
  sarabun: '"Sarabun", "Segoe UI", system-ui, sans-serif',
  'noto-sans-thai': '"Noto Sans Thai", "Segoe UI", system-ui, sans-serif',
  inter: '"Inter", "Segoe UI", system-ui, sans-serif',
  'ibm-plex-sans-thai': '"IBM Plex Sans Thai", "Segoe UI", system-ui, sans-serif',
}

export const GOOGLE_FONT_URL: Partial<Record<FontFamilyKey, string>> = {
  sarabun:
    'https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&display=swap',
  'noto-sans-thai':
    'https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;500;600;700&display=swap',
  inter:
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
  'ibm-plex-sans-thai':
    'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@400;500;600;700&display=swap',
}

export type TypographySettings = {
  fontFamily: FontFamilyKey
  fontSizePreset: FontSizePreset
  fontSizeBasePx: number | null
  fontColor: string | null
  fontHeadingColor: string | null
  fontMutedColor: string | null
}

export const TYPOGRAPHY_DEFAULTS: TypographySettings = {
  fontFamily: 'sarabun',
  fontSizePreset: 'comfortable',
  fontSizeBasePx: null,
  fontColor: null,
  fontHeadingColor: null,
  fontMutedColor: null,
}

export function resolveBaseFontSizePx(
  preset: FontSizePreset,
  overridePx: number | null | undefined,
): number {
  if (overridePx != null && Number.isFinite(overridePx)) {
    return Math.min(22, Math.max(12, Math.round(overridePx)))
  }
  return FONT_SIZE_PRESET_PX[preset]
}

export function ensureGoogleFontLoaded(family: FontFamilyKey): void {
  const url = GOOGLE_FONT_URL[family]
  if (!url || typeof document === 'undefined') return
  const id = `pm-font-${family}`
  if (document.getElementById(id)) return
  const link = document.createElement('link')
  link.id = id
  link.rel = 'stylesheet'
  link.href = url
  document.head.appendChild(link)
}

/** Type scale derived from body size (comfortable = 15px). */
export type TypographyScale = {
  caption: number
  sm: number
  base: number
  lg: number
  xl: number
  pageTitle: number
  navHeading: number
  navLink: number
}

export function deriveTypographyScale(basePx: number): TypographyScale {
  const base = Math.round(basePx)
  return {
    caption: Math.max(11, base - 2),
    sm: Math.max(11, base - 2),
    base,
    lg: Math.round(base * 1.15),
    xl: Math.round(base * 1.35),
    pageTitle: Math.round(base * 1.6),
    navHeading: Math.round(base * 0.95),
    navLink: base,
  }
}

const TYPOGRAPHY_VAR_KEYS = [
  '--app-font-family',
  '--app-font-size-caption',
  '--app-font-size-base',
  '--app-font-size-sm',
  '--app-font-size-lg',
  '--app-font-size-xl',
  '--app-font-size-page-title',
  '--app-nav-heading-size',
  '--app-nav-link-size',
  '--app-line-height-tight',
  '--app-line-height-body',
  '--app-line-height-relaxed',
  '--app-heading-color',
] as const

export function applyTypographyToDocument(typography: TypographySettings): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  ensureGoogleFontLoaded(typography.fontFamily)

  const base = resolveBaseFontSizePx(typography.fontSizePreset, typography.fontSizeBasePx)
  const scale = deriveTypographyScale(base)
  root.style.setProperty('--app-font-family', FONT_FAMILY_STACK[typography.fontFamily])
  root.style.setProperty('--app-font-size-caption', `${scale.caption}px`)
  root.style.setProperty('--app-font-size-base', `${scale.base}px`)
  root.style.setProperty('--app-font-size-sm', `${scale.sm}px`)
  root.style.setProperty('--app-font-size-lg', `${scale.lg}px`)
  root.style.setProperty('--app-font-size-xl', `${scale.xl}px`)
  root.style.setProperty('--app-font-size-page-title', `${scale.pageTitle}px`)
  root.style.setProperty('--app-nav-heading-size', `${scale.navHeading}px`)
  root.style.setProperty('--app-nav-link-size', `${scale.navLink}px`)
  root.style.setProperty('--app-line-height-tight', '1.25')
  root.style.setProperty('--app-line-height-body', '1.5')
  root.style.setProperty('--app-line-height-relaxed', '1.6')

  if (typography.fontColor?.trim()) {
    root.style.setProperty('--app-text', typography.fontColor.trim())
    root.style.setProperty('--admin-text', typography.fontColor.trim())
  } else {
    root.style.removeProperty('--app-text')
    root.style.removeProperty('--admin-text')
  }

  if (typography.fontHeadingColor?.trim()) {
    root.style.setProperty('--app-heading-color', typography.fontHeadingColor.trim())
  } else {
    root.style.removeProperty('--app-heading-color')
  }

  if (typography.fontMutedColor?.trim()) {
    root.style.setProperty('--app-text-muted', typography.fontMutedColor.trim())
    root.style.setProperty('--admin-text-muted', typography.fontMutedColor.trim())
  } else {
    root.style.removeProperty('--app-text-muted')
    root.style.removeProperty('--admin-text-muted')
  }
}

export function clearTypographyFromDocument(): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  for (const key of TYPOGRAPHY_VAR_KEYS) root.style.removeProperty(key)
  root.style.removeProperty('--app-text')
  root.style.removeProperty('--admin-text')
  root.style.removeProperty('--app-text-muted')
  root.style.removeProperty('--admin-text-muted')
}

export function typographyFromPublicSettings(
  settings:
    | {
        fontFamily?: string
        fontSizePreset?: string
        fontSizeBasePx?: number | null
        fontColor?: string | null
        fontHeadingColor?: string | null
        fontMutedColor?: string | null
      }
    | undefined,
): TypographySettings {
  if (!settings) return { ...TYPOGRAPHY_DEFAULTS }
  const fam = fontFamilyKeySchema.safeParse(settings.fontFamily)
  const preset = fontSizePresetSchema.safeParse(settings.fontSizePreset)
  return {
    fontFamily: fam.success ? fam.data : TYPOGRAPHY_DEFAULTS.fontFamily,
    fontSizePreset: preset.success ? preset.data : TYPOGRAPHY_DEFAULTS.fontSizePreset,
    fontSizeBasePx: settings.fontSizeBasePx ?? null,
    fontColor: settings.fontColor ?? null,
    fontHeadingColor: settings.fontHeadingColor ?? null,
    fontMutedColor: settings.fontMutedColor ?? null,
  }
}
