import type { NavEntry, NavLinkEntry } from '@/components/layout/nav-config'
import { SidebarNavIndicator } from '@/components/layout/SidebarNavIndicator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useSidebarNavScrollFade } from '@/lib/use-sidebar-nav-scroll-fade'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'
import { useRef } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export function NavMenuList({
  entries,
  variant,
  onNavigate,
  showMeta,
  navSource,
  userst,
  collapsed = false,
}: {
  entries: NavEntry[]
  variant: 'sidebar' | 'navbar'
  onNavigate?: () => void
  showMeta?: boolean
  navSource?: 'api' | 'fallback'
  userst?: string
  /** แถบไอคอน — ซ่อนข้อความ (desktop collapsed) */
  collapsed?: boolean
}) {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const navRef = useRef<HTMLElement>(null)
  const { fadeTop, fadeBottom } = useSidebarNavScrollFade(navRef, variant === 'sidebar')

  if (variant === 'navbar') {
    return (
      <div
        className="flex min-w-0 flex-1 flex-wrap items-center gap-x-1 gap-y-1"
        aria-label={t('nav.mainMenu')}
      >
        {entries.map((entry, idx) =>
          entry.kind === 'heading' ? (
            <span
              key={`h-${idx}-${entry.label}`}
              className="nav-menu-group-heading nav-menu-group-heading--navbar hidden shrink-0 px-2 first:pl-0 sm:inline"
            >
              {entry.label}
            </span>
          ) : (
            <NavMenuLink
              key={entry.to}
              item={entry}
              variant="navbar"
              onNavigate={onNavigate}
            />
          ),
        )}
      </div>
    )
  }

  const nav = (
    <nav
      ref={navRef}
      className={cn(
        'sidebar-nav relative flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto overscroll-contain px-2 py-1',
        collapsed && 'sidebar-nav--collapsed',
        fadeTop && 'sidebar-nav--fade-top',
        fadeBottom && 'sidebar-nav--fade-bottom',
      )}
      aria-label={t('nav.mainMenu')}
      data-collapsed={collapsed ? 'true' : 'false'}
      data-nav-indicator={collapsed ? 'off' : 'on'}
      data-fade-top={fadeTop ? 'true' : 'false'}
      data-fade-bottom={fadeBottom ? 'true' : 'false'}
    >
      <SidebarNavIndicator navRef={navRef} enabled={!collapsed} syncKey={pathname} />
      {showMeta && !collapsed ? (
        <p className="relative z-[1] mb-1 px-2 text-sidebar-muted">
          {t('nav.fromTbmenu')} <code className="opacity-80">tbmenu</code>
          {navSource === 'api' ? ` ${t('nav.apiDb')}` : ` ${t('nav.fallback')}`}
          {userst ? ` · ${userst}` : ''}
        </p>
      ) : null}
      {entries.map((entry, idx) =>
        entry.kind === 'heading' ? (
          <NavGroupHeading
            key={`h-${idx}-${entry.label}`}
            label={entry.label}
            collapsed={collapsed}
            isFirst={idx === 0}
          />
        ) : (
          <NavMenuLink
            key={entry.to}
            item={entry}
            variant="sidebar"
            collapsed={collapsed}
            onNavigate={onNavigate}
          />
        ),
      )}
    </nav>
  )

  if (collapsed) {
    return (
      <TooltipProvider delayDuration={200}>
        {nav}
      </TooltipProvider>
    )
  }

  return nav
}

function NavGroupHeading({
  label,
  collapsed,
  isFirst,
}: {
  label: string
  collapsed: boolean
  isFirst: boolean
}) {
  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'sidebar-group-marker',
              !isFirst && 'sidebar-group-marker--spaced',
            )}
            aria-label={label}
          >
            <span className="sidebar-group-marker__line" aria-hidden />
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" className="sidebar-tooltip">
          {label}
        </TooltipContent>
      </Tooltip>
    )
  }

  return (
    <div
      className={cn(
        'nav-menu-group-heading nav-menu-group-heading--sidebar',
        isFirst && 'nav-menu-group-heading--first',
      )}
    >
      {label}
    </div>
  )
}

function NavMenuLink({
  item,
  variant,
  onNavigate,
  collapsed = false,
}: {
  item: NavLinkEntry
  variant: 'sidebar' | 'navbar'
  onNavigate?: () => void
  collapsed?: boolean
}) {
  const Icon = item.icon as LucideIcon

  if (variant === 'navbar') {
    return (
      <NavLink
        to={item.to}
        end={item.end}
        onClick={onNavigate}
        className={({ isActive }) =>
          cn(
            'nav-menu-link nav-menu-link--navbar relative inline-flex h-10 shrink-0 items-center rounded-lg px-3 text-body-sm font-medium transition-colors focus-app-ring focus-visible:outline-none',
            isActive
              ? 'nav-menu-link--active text-[var(--app-accent)]'
              : 'text-app-muted hover:bg-app-muted hover:text-app',
          )
        }
      >
        <span className="flex min-w-0 max-w-[12rem] items-center gap-2">
          <Icon className="size-4 shrink-0" aria-hidden />
          <span className="truncate" title={item.label}>
            {item.label}
          </span>
        </span>
      </NavLink>
    )
  }

  const link = (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'nav-menu-link nav-menu-link--sidebar relative z-[1] flex items-center rounded-lg font-medium transition-[color,transform] text-[length:var(--app-nav-link-size)] focus-app-ring focus-visible:outline-none',
          collapsed ? 'h-11 min-h-11 justify-center px-1' : 'h-10 gap-3 px-3',
          isActive && 'nav-menu-link--active font-semibold',
        )
      }
    >
      {collapsed ? (
        <span className="nav-menu-link__icon-slot relative inline-flex shrink-0 items-center justify-center">
          <Icon className="nav-menu-link__icon size-[1.125rem] shrink-0" strokeWidth={2.25} aria-hidden />
        </span>
      ) : (
        <Icon className="nav-menu-link__icon size-4 shrink-0" aria-hidden />
      )}
      <span
        className={cn(
          'nav-menu-link__label min-w-0 leading-snug',
          collapsed
            ? 'pointer-events-none max-w-0 overflow-hidden whitespace-nowrap opacity-0'
            : 'max-w-[14rem] truncate opacity-100',
        )}
        title={!collapsed ? item.label : undefined}
        aria-hidden={collapsed}
      >
        {item.label}
      </span>
    </NavLink>
  )

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right" className="sidebar-tooltip">
          {item.label}
        </TooltipContent>
      </Tooltip>
    )
  }

  return link
}
