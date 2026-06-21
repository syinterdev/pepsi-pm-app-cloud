import { AnnouncementBanner } from '@/components/layout/AnnouncementBanner'
import { AppNavShell } from '@/components/layout/AppNavShell'
import { useShowPortalLink } from '@/lib/use-portal-modules'
import { useAppNav } from '@/lib/use-app-nav'
import { usePublicSettings } from '@/providers/SettingsProvider'
import { ImpersonationBanner } from '@/components/layout/ImpersonationBanner'
import {
  AUTH_CHANGED_EVENT,
  getStoredAuthUser,
  isLoggedIn,
} from '@/features/auth/login-api'
import {
  AppCommandPalette,
  useCommandPaletteShortcut,
} from '@/components/command-palette/AppCommandPalette'
import { Button } from '@/components/ui/button'
import { resolveRoleDisplayLabel } from '@/lib/role-display'
import {
  clearRbacPreview,
  getRbacPreviewSnapshot,
  subscribeRbacPreview,
} from '@/lib/rbac-preview'
import { useAppLocale } from '@/providers/I18nProvider'
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Outlet, useNavigate } from 'react-router-dom'

function RbacPreviewBanner({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  const { t } = useTranslation()
  const { locale } = useAppLocale()
  const preview = useSyncExternalStore(subscribeRbacPreview, getRbacPreviewSnapshot, () => null)
  if (!preview) return null
  const roleLabel = resolveRoleDisplayLabel(preview, locale)
  return (
    <div className="app-tone-info flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2 text-body-sm">
      <span>
        <Trans
          i18nKey="shell.rbacPreview"
          values={{
            role: preview.roleCode,
            name: roleLabel,
            count: preview.permissions.length,
          }}
          components={{ strong: <strong /> }}
        />
      </span>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="border-[color-mix(in_srgb,var(--app-accent)_55%,var(--app-border))]"
        onClick={() => {
          clearRbacPreview()
          navigate('/admin/roles')
        }}
      >
        {t('shell.stopPreview')}
      </Button>
    </div>
  )
}

export function AppShell() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [loggedIn, setLoggedIn] = useState(() => isLoggedIn())
  const authUser = loggedIn ? getStoredAuthUser() : null
  const { entries: visibleNav, source: navSource } = useAppNav()
  const showPortalLink = useShowPortalLink()
  const { settings } = usePublicSettings()
  const appTitle = settings?.appName?.trim() || 'PM Pepsi'
  const [commandOpen, setCommandOpen] = useState(false)
  useCommandPaletteShortcut(useCallback(() => setCommandOpen(true), []))

  useEffect(() => {
    const sync = () => setLoggedIn(isLoggedIn())
    window.addEventListener(AUTH_CHANGED_EVENT, sync)
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, sync)
  }, [])

  const goLogout = useCallback(() => {
    navigate('/logout')
  }, [navigate])

  const bannerSlot = (
    <>
      <ImpersonationBanner />
      <RbacPreviewBanner navigate={navigate} />
      {authUser?.passMustChange ? (
        <div className="border-b border-blue-200 bg-blue-50 px-4 py-2 text-body-sm text-blue-900 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-100">
          {t('shell.mustChangePassword')}{' '}
          <a href="/settings" className="font-medium underline">
            {t('shell.goToProfile')}
          </a>
        </div>
      ) : null}
    </>
  )

  return (
    <>
      <AppNavShell
        appTitle={appTitle}
        hasLogo={Boolean(settings?.hasLogo)}
        visibleNav={visibleNav}
        navSource={navSource}
        navShellMode={settings?.navShellMode ?? 'sidebar'}
        authUser={authUser}
        loggedIn={loggedIn}
        onOpenCommand={() => setCommandOpen(true)}
        onLogout={goLogout}
        showPortalLink={showPortalLink}
        bannerSlot={bannerSlot}
        announcementSlot={<AnnouncementBanner />}
      >
        <Outlet />
      </AppNavShell>
      {loggedIn ? (
        <AppCommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
      ) : null}
    </>
  )
}
