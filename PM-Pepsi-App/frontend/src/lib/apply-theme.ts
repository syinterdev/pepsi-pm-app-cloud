import type { PublicSettings } from '@/api/schemas'
import type { ThemePreference } from '@/lib/theme-preference'
import {
  applyBrandLogoTokens,
  BRAND_DEFAULTS,
  BRAND_LOGO,
  hexToRgbTriplet,
} from '@/lib/brand-palette'
import { applyTypographyToDocument, typographyFromPublicSettings } from '@/lib/typography-tokens'

export type ResolvedTheme = 'light' | 'dark'
export type ServerThemeMode = 'light' | 'dark' | 'system'

export function resolveTheme(
  serverMode: ServerThemeMode | undefined,
  preference: ThemePreference,
): ResolvedTheme {
  if (preference === 'light' || preference === 'dark') return preference
  const mode = serverMode ?? 'system'
  if (mode === 'light') return 'light'
  if (mode === 'dark') return 'dark'
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }
  return 'light'
}

/** Apply Pepsi / admin branding colors + light/dark surface tokens to `document.documentElement`. */
export function applyThemeToDocument(
  settings: PublicSettings | undefined,
  resolved: ResolvedTheme,
): void {
  const root = document.documentElement
  const primary = settings?.primaryColor?.trim() || BRAND_DEFAULTS.primaryColor
  const accent = settings?.accentColor?.trim() || BRAND_DEFAULTS.accentColor
  const success = settings?.successColor?.trim() || BRAND_DEFAULTS.successColor
  const warning = settings?.warningColor?.trim() || BRAND_DEFAULTS.warningColor
  const danger = settings?.dangerColor?.trim() || BRAND_DEFAULTS.dangerColor
  const info = settings?.infoColor?.trim() || BRAND_DEFAULTS.infoColor

  applyBrandLogoTokens(root, {
    primaryColor: primary,
    accentColor: accent,
    successColor: success,
    infoColor: info,
  })

  root.style.setProperty('--app-primary', accent)
  root.style.setProperty('--app-accent', primary)
  root.style.setProperty('--app-primary-rgb', hexToRgbTriplet(accent))
  root.style.setProperty('--app-accent-rgb', hexToRgbTriplet(primary))
  root.style.setProperty('--app-heading-color', primary)
  root.style.setProperty('--admin-success', success)
  root.style.setProperty('--admin-warning', warning)
  root.style.setProperty('--admin-danger', danger)
  root.style.setProperty('--admin-info', info)
  root.style.setProperty('--status-success', success)
  root.style.setProperty('--status-warning', warning)
  root.style.setProperty('--status-danger', danger)
  root.style.setProperty('--status-info', primary)
  root.style.setProperty('--phase-before', warning)
  root.style.setProperty('--phase-after', success)

  /* Sidebar — Light: พื้นเทา #EAEAEA + ตัวอักษรเข้ม · Dark: โทน slate + ข้อความขาว */
  if (resolved === 'dark') {
    root.style.setProperty('--app-sidebar-fg', 'rgba(255, 255, 255, 0.94)')
    root.style.setProperty('--app-sidebar-fg-muted', 'rgba(255, 255, 255, 0.76)')
    root.style.setProperty('--app-sidebar-border', 'rgba(255, 255, 255, 0.06)')
    root.style.setProperty('--app-sidebar-hover', 'rgba(255, 255, 255, 0.1)')
    root.style.setProperty('--app-sidebar-active', 'rgba(255, 255, 255, 0.18)')
  } else {
    root.style.setProperty('--app-sidebar-fg', '#1f2937')
    root.style.setProperty('--app-sidebar-fg-muted', '#5b6470')
    root.style.setProperty('--app-sidebar-border', '#d4d4d8')
    root.style.setProperty('--app-sidebar-hover', `color-mix(in srgb, ${primary} 10%, #eaeaea)`)
    root.style.setProperty('--app-sidebar-active', `color-mix(in srgb, ${primary} 16%, #eaeaea)`)
  }

  root.classList.toggle('dark', resolved === 'dark')
  root.dataset.theme = resolved

  if (resolved === 'dark') {
    root.style.setProperty('--app-bg', '#0f172a')
    root.style.setProperty('--app-surface', '#1e293b')
    root.style.setProperty('--app-surface-muted', '#334155')
    root.style.setProperty('--app-text', '#f8fafc')
    root.style.setProperty('--app-text-muted', '#cbd5e1')
    root.style.setProperty('--app-border', '#475569')
    root.style.setProperty('--app-sidebar', '#1e293b')
    root.style.setProperty('--app-accent', BRAND_LOGO.sky)
    root.style.setProperty('--app-glass-bg', 'rgba(30, 41, 59, 0.78)')
    root.style.setProperty('--app-glass-border', 'rgba(255, 255, 255, 0.14)')
  } else {
    root.style.setProperty('--app-bg', '#eef2f7')
    root.style.setProperty('--app-surface', '#ffffff')
    root.style.setProperty('--app-surface-muted', '#f4f4f5')
    root.style.setProperty('--app-text', '#18181b')
    root.style.setProperty('--app-text-muted', '#71717a')
    root.style.setProperty('--app-border', '#e4e4e7')
    root.style.setProperty('--app-sidebar', '#eaeaea')
    root.style.setProperty('--app-glass-bg', 'rgba(255, 255, 255, 0.7)')
    root.style.setProperty('--app-glass-border', 'rgba(255, 255, 255, 0.18)')
  }

  applyTypographyToDocument(typographyFromPublicSettings(settings))
}

export function clearThemeFromDocument(): void {
  const root = document.documentElement
  root.classList.remove('dark')
  delete root.dataset.theme
  const keys = [
    '--brand-logo-blue-dark',
    '--brand-logo-orange',
    '--brand-logo-green-dark',
    '--brand-logo-green-light',
    '--brand-logo-sky',
    '--brand-logo-white',
    '--brand-pepsi-blue',
    '--brand-pepsi-red',
    '--brand-pepsi-white',
    '--brand-pepsi-orange',
    '--brand-pepsi-green',
    '--app-primary',
    '--app-accent',
    '--app-primary-rgb',
    '--app-accent-rgb',
    '--app-heading-color',
    '--app-bg',
    '--app-surface',
    '--app-surface-muted',
    '--app-text',
    '--app-text-muted',
    '--app-border',
    '--app-sidebar',
    '--app-sidebar-fg',
    '--app-sidebar-fg-muted',
    '--app-sidebar-border',
    '--app-sidebar-hover',
    '--app-sidebar-active',
    '--app-glass-bg',
    '--app-glass-border',
    '--admin-success',
    '--admin-warning',
    '--admin-danger',
    '--admin-info',
    '--status-success',
    '--status-warning',
    '--status-danger',
    '--status-info',
    '--phase-before',
    '--phase-after',
  ]
  for (const key of keys) root.style.removeProperty(key)
  applyTypographyToDocument(typographyFromPublicSettings(undefined))
}
