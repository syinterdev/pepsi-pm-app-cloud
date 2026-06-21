import type { AuthUser } from '@/api/schemas'
import { ProfileAvatar } from '@/components/profile/ProfileAvatar'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { authUserDisplayName } from '@/lib/user-initials'
import { resolveRoleDisplayLabel } from '@/lib/role-display'
import { cn } from '@/lib/utils'
import { useAppLocale } from '@/providers/I18nProvider'
import { LayoutGrid, LogIn, LogOut, Pin, PinOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router-dom'

export type SidebarFooterProps = {
  authUser: AuthUser | null
  loggedIn: boolean
  expanded: boolean
  pinned: boolean
  showPin?: boolean
  showPortalLink?: boolean
  onTogglePin: () => void
  onLogout: () => void
  onLogin: () => void
  onNavigate?: () => void
}

const logoutBtnClass =
  'border-[var(--app-sidebar-border)] bg-[var(--app-sidebar-hover)] text-[var(--app-sidebar-fg)] hover:bg-[var(--app-sidebar-active)]'

export function SidebarFooter({
  authUser,
  loggedIn,
  expanded,
  pinned,
  showPin,
  showPortalLink = false,
  onTogglePin,
  onLogout,
  onLogin,
  onNavigate,
}: SidebarFooterProps) {
  const { t } = useTranslation(['common', 'portal'])
  const { locale } = useAppLocale()
  const collapsed = !expanded

  const roleLabel = authUser ? resolveRoleDisplayLabel(authUser, locale) : ''
  const displayName = authUser ? authUserDisplayName(authUser) : ''
  const isWc = authUser?.accountType === 'workcenter'
  const avatarProps = authUser
    ? {
        displayName,
        idwkctr: isWc ? authUser.idwkctr : undefined,
        hasImage: Boolean(authUser.imgMember),
        imgMember: authUser.imgMember,
      }
    : null

  const userBlock =
    authUser && avatarProps ? (
      collapsed ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="app-sidebar-footer__user app-sidebar-footer__user--collapsed">
              <ProfileAvatar
                {...avatarProps}
                size="sm"
                className="sidebar-footer__avatar"
              />
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" className="sidebar-tooltip">
            <span className="block font-medium">{displayName}</span>
            <span className="block text-xs opacity-80">{roleLabel}</span>
          </TooltipContent>
        </Tooltip>
      ) : (
        <div className="app-sidebar-footer__user">
          <ProfileAvatar
            {...avatarProps}
            size="sm"
            className="sidebar-footer__avatar"
          />
          <div className="app-sidebar-footer__user-text min-w-0 flex-1">
            <p className="truncate text-xs font-semibold leading-snug text-[var(--app-sidebar-fg)]">
              {displayName}
            </p>
            <span className="app-sidebar-footer__role-badge">{roleLabel}</span>
          </div>
        </div>
      )
    ) : null

  const portalLink =
    showPortalLink && expanded ? (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn(
          'w-full border-[var(--app-sidebar-border)] bg-[var(--app-sidebar-hover)] text-[var(--app-sidebar-fg)] hover:bg-[var(--app-sidebar-active)]',
          'justify-start gap-2',
        )}
        asChild
      >
        <NavLink to="/portal" onClick={onNavigate}>
          <LayoutGrid className="size-4 shrink-0" aria-hidden />
          <span className="sidebar-reveal-label max-w-[12rem] opacity-100">
            {t('portal:backToPortal')}
          </span>
        </NavLink>
      </Button>
    ) : null

  const pinIcon = pinned ? (
    <PinOff className="size-[1.125rem] shrink-0" strokeWidth={2.25} aria-hidden />
  ) : (
    <Pin className="size-[1.125rem] shrink-0" strokeWidth={2.25} aria-hidden />
  )

  const pinButton =
    showPin && expanded ? (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="sidebar-pin-btn w-full justify-start gap-2 text-[var(--app-sidebar-fg-muted)] hover:bg-[var(--app-sidebar-hover)] hover:text-[var(--app-sidebar-fg)]"
        onClick={onTogglePin}
        title={pinned ? t('nav.unpinMenuTitle') : t('nav.pinMenuTitle')}
        aria-pressed={pinned}
        aria-label={pinned ? t('nav.unpinMenu') : t('nav.pinMenu')}
      >
        {pinIcon}
        <span className="sidebar-reveal-label max-w-[10rem] opacity-100">
          {pinned ? t('nav.unpinMenu') : t('nav.pinMenu')}
        </span>
      </Button>
    ) : showPin && collapsed ? (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="sidebar-pin-btn sidebar-pin-btn--collapsed h-10 w-full justify-center px-0 text-[var(--app-sidebar-fg-muted)] hover:bg-[var(--app-sidebar-hover)] hover:text-[var(--app-sidebar-fg)]"
            onClick={onTogglePin}
            aria-pressed={pinned}
            aria-label={pinned ? t('nav.unpinMenu') : t('nav.pinMenu')}
          >
            {pinIcon}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right" className="sidebar-tooltip">
          {pinned ? t('nav.unpinMenu') : t('nav.pinMenu')}
        </TooltipContent>
      </Tooltip>
    ) : null

  const logoutButton = loggedIn ? (
    <Button
      type="button"
      variant="outline"
      title={t('actions.logout')}
      className={cn(logoutBtnClass, collapsed ? 'w-full justify-center px-0' : 'w-full justify-start gap-2')}
      onClick={onLogout}
    >
      <LogOut className="size-4 shrink-0" aria-hidden />
      <span
        className={cn(
          'sidebar-reveal-label overflow-hidden whitespace-nowrap',
          collapsed ? 'max-w-0 opacity-0' : 'max-w-[8rem] opacity-100',
        )}
        aria-hidden={collapsed}
      >
        {t('actions.logout')}
      </span>
    </Button>
  ) : (
    <Button
      type="button"
      variant="outline"
      title={t('actions.login')}
      className={cn(logoutBtnClass, collapsed ? 'w-full justify-center px-0' : 'w-full justify-start gap-2')}
      onClick={onLogin}
    >
      <LogIn className="size-4 shrink-0" aria-hidden />
      <span
        className={cn(
          'sidebar-reveal-label overflow-hidden whitespace-nowrap',
          collapsed ? 'max-w-0 opacity-0' : 'max-w-[8rem] opacity-100',
        )}
        aria-hidden={collapsed}
      >
        {t('actions.login')}
      </span>
    </Button>
  )

  const actionButton = collapsed ? (
    <Tooltip>
      <TooltipTrigger asChild>{logoutButton}</TooltipTrigger>
      <TooltipContent side="right" className="sidebar-tooltip">
        {loggedIn ? t('actions.logout') : t('actions.login')}
      </TooltipContent>
    </Tooltip>
  ) : (
    logoutButton
  )

  const footer = (
    <div className="app-sidebar-footer space-y-2">
      {userBlock}
      {portalLink}
      {pinButton}
      {actionButton}
    </div>
  )

  if (collapsed) {
    return <TooltipProvider delayDuration={200}>{footer}</TooltipProvider>
  }

  return footer
}
