import type { PublicSettings } from '@/api/schemas'
import type { CSSProperties } from 'react'

/** CSS variables สำหรับขนาดโลโก้ / favicon preview */
export function applyBrandingAssetCss(
  settings:
    | Pick<PublicSettings, 'logoNavHeightPx' | 'logoLoginHeightPx' | 'faviconSizePx'>
    | undefined,
): void {
  const root = document.documentElement
  const nav = settings?.logoNavHeightPx ?? 40
  const login = settings?.logoLoginHeightPx ?? 56
  const favicon = settings?.faviconSizePx ?? 32
  root.style.setProperty('--brand-logo-nav-height', `${nav}px`)
  root.style.setProperty('--brand-logo-login-height', `${login}px`)
  root.style.setProperty('--brand-favicon-size', `${favicon}px`)
}

export function logoNavStyle(heightPx?: number): CSSProperties {
  const h = heightPx ?? 40
  return { height: h, width: 'auto', maxWidth: h * 4 }
}

export function logoLoginStyle(heightPx?: number): CSSProperties {
  const h = heightPx ?? 56
  return { height: h, width: 'auto', maxWidth: 'min(100%, 280px)' }
}
