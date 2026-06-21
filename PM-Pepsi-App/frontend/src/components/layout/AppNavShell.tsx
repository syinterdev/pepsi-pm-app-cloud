import type { AuthUser } from '@/api/schemas'
import { PepsiStripe } from '@/components/brand/PepsiStripe'
import { SidebarBrandZone } from '@/components/layout/SidebarBrandZone'
import { SidebarFooter } from '@/components/layout/SidebarFooter'
import { SidebarMobileDrawer } from '@/components/layout/SidebarMobileDrawer'
import { AppFooter } from '@/components/layout/AppFooter'
import { AppNotificationBell } from '@/components/layout/AppNotificationBell'
import { AppTopbarBrand } from '@/components/layout/AppTopbarBrand'
import { AppNavbarUser } from '@/components/layout/AppNavbarUser'
import type { NavEntry } from '@/components/layout/nav-config'
import { NavMenuList } from '@/components/layout/NavMenuList'
import { LanguageSwitcher } from '@/components/i18n/LanguageSwitcher'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { Button } from '@/components/ui/button'
import { resolveNavShellLayout } from '@/lib/nav-shell-layout'
import {
  readSidebarDensity,
  readSidebarWidth,
  sidebarWidthClasses,
  subscribeSidebarPrefs,
} from '@/lib/sidebar-prefs'
import { useSidebarState } from '@/lib/use-sidebar-state'
import { cn } from '@/lib/utils'
import { useReducedMotion } from 'framer-motion'
import { CommandPaletteShortcutBadge } from '@/components/command-palette/CommandPaletteShortcutBadge'
import { LayoutGrid, Menu, Search } from 'lucide-react'
import type { NavShellMode } from '@/api/schemas'
import type { ReactNode } from 'react'
import { useEffect, useRef, useSyncExternalStore } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'

export type AppNavShellProps = {
  appTitle: string
  hasLogo: boolean
  visibleNav: NavEntry[]
  navSource: 'api' | 'fallback'
  navShellMode?: NavShellMode
  authUser: AuthUser | null
  loggedIn: boolean
  onOpenCommand: () => void
  onLogout: () => void
  /** แถบระบบ (impersonation, RBAC preview, เปลี่ยนรหัส) — คอลัมน์เนื้อหาเท่านั้น */
  bannerSlot?: ReactNode
  /** ประกาศจาก Admin — คอลัมน์เนื้อหาเท่านั้น ไม่ทับ sidebar */
  announcementSlot?: ReactNode
  /** แสดงปุ่มกลับ Portal เมื่อ user มี >1 module */
  showPortalLink?: boolean
  children: ReactNode
}

function TopBarActions({
  loggedIn,
  onOpenCommand,
  showPortalLink = false,
}: {
  loggedIn: boolean
  onOpenCommand: () => void
  showPortalLink?: boolean
}) {
  const { t } = useTranslation(['common', 'portal'])
  return (
    <div className="app-topbar-actions flex items-center gap-1.5 sm:gap-2">
      {loggedIn && showPortalLink ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-11 gap-2 rounded-xl border-[color-mix(in_srgb,var(--app-border)_80%,transparent)] bg-[color-mix(in_srgb,var(--app-surface)_88%,white)] px-3 shadow-sm"
          asChild
        >
          <NavLink to="/portal">
            <LayoutGrid className="size-4 shrink-0" aria-hidden />
            <span className="hidden sm:inline">{t('portal:backToPortal')}</span>
          </NavLink>
        </Button>
      ) : null}
      {loggedIn ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="command-palette-trigger h-11 gap-2 rounded-xl border-[color-mix(in_srgb,var(--app-border)_80%,transparent)] bg-[color-mix(in_srgb,var(--app-surface)_88%,white)] px-3 shadow-sm transition-all hover:border-[color-mix(in_srgb,var(--app-accent)_22%,var(--app-border))] hover:bg-[var(--app-surface)] hover:shadow-md sm:min-w-[11rem] md:min-w-[13rem]"
          data-tour="admin-command-hint"
          onClick={onOpenCommand}
          aria-label={t('commandPalette.aria')}
        >
          <Search className="size-4 shrink-0 text-[var(--app-accent)]" aria-hidden />
          <span className="hidden flex-1 text-left text-body-sm text-app-muted sm:inline">
            {t('actions.search')}
          </span>
          <CommandPaletteShortcutBadge className="hidden text-app-muted md:inline-flex" />
        </Button>
      ) : null}
      {loggedIn ? <AppNotificationBell /> : null}
      <LanguageSwitcher />
      <ThemeToggle className="app-topbar-icon-btn size-11 shrink-0 rounded-xl border border-[color-mix(in_srgb,var(--app-border)_80%,transparent)] bg-[color-mix(in_srgb,var(--app-surface)_88%,white)] shadow-sm hover:bg-[var(--app-surface)] hover:shadow-md" />
      {loggedIn ? (
        <AppNavbarUser />
      ) : (
        <Button size="sm" variant="outline" className="rounded-xl shadow-sm" asChild>
          <NavLink to="/login">{t('actions.login')}</NavLink>
        </Button>
      )}
    </div>
  )
}

function SidebarPanel({
  appTitle,
  hasLogo,
  visibleNav,
  navSource,
  authUser,
  loggedIn,
  expanded,
  pinned,
  onTogglePin,
  onLogout,
  onLogin,
  onNavigate,
  showPin,
  showPortalLink = false,
}: {
  appTitle: string
  hasLogo: boolean
  visibleNav: NavEntry[]
  navSource: 'api' | 'fallback'
  authUser: AuthUser | null
  loggedIn: boolean
  expanded: boolean
  pinned: boolean
  onTogglePin: () => void
  onLogout: () => void
  onLogin: () => void
  onNavigate?: () => void
  showPin?: boolean
  showPortalLink?: boolean
}) {
  const collapsed = !expanded

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col">
      <PepsiStripe variant="sidebar" />
      <SidebarBrandZone
        appTitle={appTitle}
        hasLogo={hasLogo}
        expanded={expanded}
        showPortalLink={showPortalLink}
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden py-2">
        <NavMenuList
          entries={visibleNav}
          variant="sidebar"
          collapsed={collapsed}
          onNavigate={onNavigate}
        />
        {navSource === 'fallback' && expanded ? (
          <p className="px-3 py-2 text-sidebar-muted">
            เมนู fallback (ไม่มี tbmenu)
          </p>
        ) : null}
      </div>

      <SidebarFooter
        authUser={authUser}
        loggedIn={loggedIn}
        expanded={expanded}
        pinned={pinned}
        showPin={showPin}
        showPortalLink={showPortalLink}
        onTogglePin={onTogglePin}
        onLogout={onLogout}
        onLogin={onLogin}
        onNavigate={onNavigate}
      />
    </div>
  )
}

/** Sidebar: ยุบไอคอน · hover ขยาย · ปักหมุด (desktop) · drawer (mobile) */
export function AppNavShell(props: AppNavShellProps) {
  const {
    appTitle,
    hasLogo,
    visibleNav,
    navSource,
    navShellMode = 'sidebar',
    authUser,
    loggedIn,
    onOpenCommand,
    onLogout,
    bannerSlot,
    announcementSlot,
    showPortalLink = false,
    children,
  } = props

  const { t } = useTranslation()
  const location = useLocation()
  const isAdmin = location.pathname.startsWith('/admin')
  const navigate = useNavigate()
  const onLogin = () => navigate('/login')
  const reduceMotion = useReducedMotion() ?? false
  const sidebarDensity = useSyncExternalStore(
    subscribeSidebarPrefs,
    readSidebarDensity,
    () => 'comfortable' as const,
  )
  const sidebarWidth = useSyncExternalStore(
    subscribeSidebarPrefs,
    readSidebarWidth,
    () => 'narrow' as const,
  )
  const widthClasses = sidebarWidthClasses(sidebarWidth)
  const {
    pinned,
    togglePinned,
    setHovered,
    desktopExpanded,
    mobileOpen,
    setMobileOpen,
  } = useSidebarState({ reduceMotion })

  const { showDesktopSidebar, showHeaderNav, mobileDrawerOnly } =
    resolveNavShellLayout(navShellMode)

  const menuTriggerRef = useRef<HTMLButtonElement>(null)
  const closeMobile = () => setMobileOpen(false)
  const drawerResponsiveHide = showDesktopSidebar ? 'lg:hidden' : showHeaderNav ? 'md:hidden' : undefined

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname, setMobileOpen])

  useEffect(() => {
    if (!showDesktopSidebar) return
    const mq = window.matchMedia('(min-width: 1024px)')
    const onChange = () => {
      if (mq.matches) setMobileOpen(false)
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [showDesktopSidebar, setMobileOpen])

  const panelProps = {
    appTitle,
    hasLogo,
    visibleNav,
    navSource,
    authUser,
    loggedIn,
    onLogout,
    onLogin,
    onTogglePin: togglePinned,
    showPortalLink,
  }

  return (
    <div
      className={cn(
        'flex min-h-svh bg-[var(--app-bg)]',
        !isAdmin && 'app-theme-corporate',
        isAdmin && 'macos-admin',
        showHeaderNav && 'flex-col',
      )}
    >
      {/* Desktop sidebar (sidebar mode only) */}
      {showDesktopSidebar ? (
        <aside
          className={cn(
            'app-sidebar macos-sidebar relative z-30 hidden h-full min-h-0 shrink-0 flex-col overflow-hidden lg:flex',
            desktopExpanded ? widthClasses.expanded : widthClasses.collapsed,
            !desktopExpanded && 'app-sidebar--collapsed',
          )}
          aria-label={t('nav.mainMenu')}
          data-collapsed={desktopExpanded ? 'false' : 'true'}
          data-pinned={pinned ? 'true' : 'false'}
          data-sidebar-density={sidebarDensity}
          data-sidebar-width={sidebarWidth}
          data-reduced-motion={reduceMotion ? 'true' : 'false'}
          onMouseEnter={() => !pinned && setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <SidebarPanel
            {...panelProps}
            expanded={desktopExpanded}
            pinned={pinned}
            showPin
          />
        </aside>
      ) : null}

      {(mobileDrawerOnly || showHeaderNav) ? (
        <SidebarMobileDrawer
          open={mobileOpen}
          onOpenChange={setMobileOpen}
          menuTriggerRef={menuTriggerRef}
          responsiveHideClass={drawerResponsiveHide}
          drawerWidthClass={widthClasses.drawer}
          sidebarDensity={sidebarDensity}
        >
          <SidebarPanel {...panelProps} expanded pinned={false} onNavigate={closeMobile} />
        </SidebarMobileDrawer>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header
          className={cn(
            'app-surface macos-topbar sticky top-0 z-40 flex shrink-0 items-center gap-3 px-4 py-2.5 sm:px-5',
          )}
        >
          {(mobileDrawerOnly || showHeaderNav) ? (
            <Button
              ref={menuTriggerRef}
              type="button"
              variant="ghost"
              size="icon"
              className={cn(
                'size-10 rounded-xl',
                mobileDrawerOnly && 'lg:hidden',
                showHeaderNav && 'md:hidden',
              )}
              onClick={() => setMobileOpen(true)}
              aria-label={t('actions.openMenu')}
              aria-expanded={mobileOpen}
              aria-controls="sidebar-mobile-drawer"
            >
              <Menu className="size-5" />
            </Button>
          ) : null}
        <div className={cn(
          showHeaderNav ? 'shrink-0' : 'min-w-0 flex-1',
        )}>
          <AppTopbarBrand
            appTitle={appTitle}
            hasLogo={hasLogo}
            showHeaderNav={showHeaderNav}
          />
        </div>
          {showHeaderNav ? (
            <div className="hidden min-w-0 flex-1 md:flex">
              <NavMenuList entries={visibleNav} variant="navbar" onNavigate={closeMobile} />
            </div>
          ) : null}
          <div className={cn('flex shrink-0 items-center', showHeaderNav && 'ml-auto')}>
            <TopBarActions
              loggedIn={loggedIn}
              onOpenCommand={onOpenCommand}
              showPortalLink={showPortalLink}
            />
          </div>
        </header>
        {bannerSlot ? (
          <div className="app-shell-banners shrink-0" role="presentation">
            {bannerSlot}
          </div>
        ) : null}
        {announcementSlot}
        <main className="app-shell-main flex-1 overflow-auto">
          {children}
        </main>
        <AppFooter />
      </div>
    </div>
  )
}
