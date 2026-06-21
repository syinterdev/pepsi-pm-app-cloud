/**
 * Engineering Board sidebar — links to app sections that require login.
 */
import { appNav, type NavEntry } from '@/components/layout/nav-config'
import { NAV_ROUTE_PERMISSION } from '@/lib/nav-route-permissions'
import { isLoggedIn } from '@/features/auth/login-api'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'
import { LogIn } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router-dom'

function navItemsForBoard(): NavEntry[] {
  return appNav.filter((e) => {
    if (e.kind === 'heading') return true
    if (e.to === '/board') return false
    return true
  })
}

function NavIcon({ icon: Icon }: { icon: LucideIcon }) {
  return <Icon className="size-4 shrink-0 opacity-90" aria-hidden />
}

export function BoardKioskNav({ collapsed = false }: { collapsed?: boolean }) {
  const { t } = useTranslation('board')
  const location = useLocation()
  const loggedIn = isLoggedIn()

  return (
    <nav
      className={cn(
        'engineering-board__nav flex flex-col gap-1 overflow-y-auto',
        collapsed ? 'px-2 py-2' : 'p-3',
      )}
      aria-label={t('kioskNav.appMenuAria')}
    >
      {!collapsed ? (
        <p className="nav-menu-group-heading px-2 pb-1 pt-0">{t('kioskNav.loginSection')}</p>
      ) : null}
      {navItemsForBoard().map((entry, idx) =>
        entry.kind === 'heading' ? (
          collapsed ? (
            <div
              key={`h-${idx}-${entry.label}`}
              className="sidebar-heading-rule mx-auto my-1 h-px w-6 opacity-40"
              aria-hidden
            />
          ) : (
            <div
              key={`h-${idx}-${entry.label}`}
              className={cn('nav-menu-group-heading px-2 pb-1 pt-3', idx === 0 && 'pt-1')}
            >
              {entry.label}
            </div>
          )
        ) : (
          <Link
            key={entry.to}
            to={entry.to}
            title={collapsed ? entry.label : undefined}
            className={cn(
              'flex items-center rounded-card text-body-sm font-medium transition-colors',
              collapsed ? 'justify-center px-2 py-3' : 'gap-3 px-3 py-2',
              location.pathname === entry.to ||
                (entry.to !== '/' && location.pathname.startsWith(`${entry.to}/`))
                ? 'bg-white/15 text-white'
                : 'text-white/70 hover:bg-white/10 hover:text-white',
            )}
          >
            <NavIcon icon={entry.icon} />
            <span className={cn('min-w-0 leading-snug', collapsed && 'sr-only')}>
              {entry.label}
            </span>
            {!collapsed && NAV_ROUTE_PERMISSION[entry.to] ? (
              <span className="ml-auto text-badge uppercase tracking-wide text-white/45">
                login
              </span>
            ) : null}
          </Link>
        ),
      )}
      {!loggedIn ? (
        <Link
          to="/login"
          state={{ from: { pathname: '/' } }}
          className={cn(
            'mt-2 flex items-center rounded-card border border-white/20 bg-white/10 font-medium text-white hover:bg-white/15',
            collapsed ? 'justify-center px-2 py-3' : 'gap-3 px-3 py-2',
          )}
        >
          <LogIn className="size-4 shrink-0" aria-hidden />
          <span className={cn(collapsed && 'sr-only')}>{t('kioskNav.signIn')}</span>
        </Link>
      ) : (
        <Link
          to="/"
          className={cn(
            'mt-2 flex items-center rounded-card font-medium text-sky-300 hover:underline',
            collapsed ? 'justify-center px-2 py-2' : 'gap-3 px-3 py-2',
          )}
        >
          <span className={cn(collapsed && 'sr-only')}>{t('kioskNav.openFullApp')}</span>
        </Link>
      )}
    </nav>
  )
}
