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

export const FONT_SIZE_PRESET_PX: Record<FontSizePreset, number> = {
  compact: 13,
  comfortable: 15,
  large: 17,
}

export const FONT_FAMILY_STACK: Record<FontFamilyKey, string> = {
  system:
    '"Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif',
  /** San Francisco (SF Pro) — บน Mac ใช้ -apple-system; Windows จะ fallback */
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

export const TYPOGRAPHY_DEFAULTS = {
  fontFamily: 'sarabun' as FontFamilyKey,
  fontSizePreset: 'comfortable' as FontSizePreset,
  fontSizeBasePx: null as number | null,
  fontColor: null as string | null,
  fontHeadingColor: null as string | null,
  fontMutedColor: null as string | null,
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

export function typographyCssVars(input: {
  fontFamily: FontFamilyKey
  fontSizePreset: FontSizePreset
  fontSizeBasePx?: number | null
  fontColor?: string | null
  fontHeadingColor?: string | null
  fontMutedColor?: string | null
}): Record<string, string> {
  const base = resolveBaseFontSizePx(input.fontSizePreset, input.fontSizeBasePx)
  const vars: Record<string, string> = {
    '--app-font-family': FONT_FAMILY_STACK[input.fontFamily],
    '--app-font-size-base': `${base}px`,
    '--app-font-size-sm': `${Math.max(11, base - 2)}px`,
    '--app-font-size-lg': `${Math.round(base * 1.15)}px`,
    '--app-font-size-xl': `${Math.round(base * 1.35)}px`,
    '--app-font-size-page-title': `${Math.round(base * 1.6)}px`,
    '--app-nav-heading-size': `${Math.round(base * 0.95)}px`,
    '--app-nav-link-size': `${base}px`,
  }
  if (input.fontColor?.trim()) vars['--app-text'] = input.fontColor.trim()
  if (input.fontHeadingColor?.trim()) vars['--app-heading-color'] = input.fontHeadingColor.trim()
  if (input.fontMutedColor?.trim()) vars['--app-text-muted'] = input.fontMutedColor.trim()
  return vars
}
