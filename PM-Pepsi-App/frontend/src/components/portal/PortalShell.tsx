import { PepsiBrandMark } from '@/components/brand/PepsiBrandMark'
import { PepsiStripe } from '@/components/brand/PepsiStripe'
import { LanguageSwitcher } from '@/components/i18n/LanguageSwitcher'
import { AppNavbarUser } from '@/components/layout/AppNavbarUser'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { LoginBackdrop } from '@/features/auth/LoginBackdrop'
import {
  portalHeroMotion,
  portalTopbarMotion,
} from '@/features/portal/portal-motion'
import { getStoredAuthUser } from '@/features/auth/login-api'
import { logoLoginStyle } from '@/lib/branding-asset-css'
import { resolveRoleDisplayLabel } from '@/lib/role-display'
import { publicLogoUrl } from '@/lib/settings-api'
import { useAppLocale } from '@/providers/I18nProvider'
import { usePublicSettings } from '@/providers/SettingsProvider'
import { motion, useReducedMotion } from 'framer-motion'
import { LayoutGrid } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

export type PortalShellProps = {
  children: ReactNode
}

/** Hub layout — wallpaper glass · hero · ไม่มี sidebar PM */
export function PortalShell({ children }: PortalShellProps) {
  const { t } = useTranslation('portal')
  const { locale } = useAppLocale()
  const reduceMotion = useReducedMotion()
  const { settings, brandingCacheKey } = usePublicSettings()
  const appName = settings?.appName?.trim() || 'PM Pepsi'
  const hasLogo = Boolean(settings?.hasLogo)
  const hasLoginBackground = Boolean(settings?.hasLoginBackground)
  const logoSrc = hasLogo ? publicLogoUrl(brandingCacheKey) : null
  const user = getStoredAuthUser()
  const displayName = user?.fullnameTh?.trim() || user?.username || ''
  const roleLabel = user ? resolveRoleDisplayLabel(user, locale) : ''

  return (
    <div className="portal-page">
      <LoginBackdrop
        hasLoginBackground={hasLoginBackground}
        brandingCacheKey={brandingCacheKey}
      />
      <div className="portal-page__glow portal-page__glow--accent" aria-hidden />
      <div className="portal-page__glow portal-page__glow--primary" aria-hidden />

      <motion.header
        className="portal-page__topbar"
        {...(reduceMotion ? {} : portalTopbarMotion)}
      >
        <div className="portal-page__topbar-inner">
          <Link
            to="/portal"
            className="portal-page__brand focus-app-ring rounded-button"
          >
            <span className="portal-page__brand-icon" aria-hidden>
              <LayoutGrid className="size-4 text-[var(--app-accent)]" />
            </span>
            {hasLogo && logoSrc ? (
              <img src={logoSrc} alt="" className="h-8 w-auto max-w-[7rem] object-contain" />
            ) : (
              <PepsiBrandMark className="size-8 shrink-0" />
            )}
            <span className="truncate text-body-sm font-semibold text-app">{appName}</span>
          </Link>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <LanguageSwitcher />
            <ThemeToggle className="app-topbar-icon-btn size-10 shrink-0 rounded-xl border border-[color-mix(in_srgb,var(--app-border)_80%,transparent)] bg-[color-mix(in_srgb,var(--app-surface)_88%,white)] shadow-sm" />
            <AppNavbarUser />
          </div>
        </div>
      </motion.header>

      <main className="portal-page__main">
        <motion.section
          className="portal-page__hero macos-dialog-glass"
          {...(reduceMotion ? {} : portalHeroMotion)}
        >
          <PepsiStripe className="rounded-t-card" />
          <div className="portal-page__hero-body">
            <div className="portal-page__hero-logo">
              {hasLogo && logoSrc ? (
                <img
                  src={logoSrc}
                  alt=""
                  className="max-h-[4.5rem] w-auto object-contain"
                  style={logoLoginStyle(settings?.logoLoginHeightPx)}
                />
              ) : (
                <PepsiBrandMark size="lg" />
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <h1 className="text-heading-page text-app">{t('title')}</h1>
              <p className="text-body-sm text-app-muted">{t('subtitle')}</p>
              {displayName ? (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="portal-page__welcome-pill">
                    {t('welcome', { name: displayName })}
                  </span>
                  {roleLabel ? (
                    <span className="portal-page__role-pill">{roleLabel}</span>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </motion.section>

        <div className="portal-page__content">{children}</div>
      </main>
    </div>
  )
}
