import { ProfileAvatar } from '@/components/profile/ProfileAvatar'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useProfileQuery } from '@/features/profile/profile-api'
import { BarChart3, CalendarDays, ChevronDown, Clock, LogOut, Settings } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppLocale } from '@/providers/I18nProvider'
import { resolveRoleDisplayLabel } from '@/lib/role-display'
import { useTranslation } from 'react-i18next'

export function AppNavbarUser() {
  const { t } = useTranslation()
  const { locale } = useAppLocale()
  const navigate = useNavigate()
  const q = useProfileQuery()

  if (q.isLoading) {
    return <Skeleton className="h-11 w-40 rounded-xl" />
  }

  if (q.isError || !q.data) {
    return null
  }

  const p = q.data
  const roleLabel = resolveRoleDisplayLabel(p, locale)
  const isWc = p.accountType === 'workcenter'
  const avatarProps = {
    displayName: p.displayName,
    idwkctr: isWc ? p.userId : undefined,
    hasImage: p.hasImage,
    imgMember: p.imgMember,
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="app-topbar-user h-auto min-h-11 max-w-[min(100%,18rem)] gap-2.5 whitespace-normal rounded-xl border-[color-mix(in_srgb,var(--app-border)_80%,transparent)] bg-[color-mix(in_srgb,var(--app-surface)_88%,white)] py-1.5 pl-2 pr-2.5 shadow-sm transition-all hover:border-[color-mix(in_srgb,var(--app-accent)_22%,var(--app-border))] hover:bg-[var(--app-surface)] hover:shadow-md"
          aria-label={t('userMenu.menuAria')}
        >
          <ProfileAvatar {...avatarProps} size="sm" variant="topbar" />
          <span className="hidden min-w-0 flex-1 flex-col justify-center gap-0.5 text-left sm:flex">
            <span className="block w-full truncate text-[13px] font-semibold leading-snug text-app">
              {p.displayName}
            </span>
            <span className="flex w-full min-w-0 items-center gap-1.5 text-xs leading-normal text-app-muted">
              {p.userst ? (
                <span className="inline-flex shrink-0 items-center rounded-md bg-[color-mix(in_srgb,var(--app-accent)_14%,transparent)] px-1.5 py-px font-mono text-[10px] font-bold leading-none text-[var(--app-accent)]">
                  {p.userst}
                </span>
              ) : null}
              <span className="min-w-0 truncate">{roleLabel}</span>
            </span>
          </span>
          <ChevronDown className="hidden size-4 shrink-0 self-center text-app-muted sm:block" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 overflow-hidden rounded-2xl p-0 shadow-lg">
        <div className="relative overflow-hidden p-4">
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[color-mix(in_srgb,var(--brand-pepsi-blue)_10%,var(--app-surface))] via-transparent to-[color-mix(in_srgb,var(--brand-pepsi-red)_8%,var(--app-surface))]"
            aria-hidden
          />
          <div className="relative flex items-start gap-3">
            <ProfileAvatar {...avatarProps} size="lg" variant="popover" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-body-sm font-semibold text-app">{p.displayName}</p>
              <p className="mt-1 text-xs text-app-muted">
                {t('userMenu.statusLine', { userst: p.userst ?? '—', sysstatus: roleLabel })}
              </p>
              {!isWc && p.username ? (
                <p className="mt-1 font-mono text-caption">{p.username}</p>
              ) : null}
            </div>
          </div>

          {isWc && (p.birthdayLabel || p.workAgeLabel || p.worktimeTotalHours != null) ? (
            <dl className="mt-3 space-y-2 rounded-card bg-app-subtle px-3 py-2 text-xs">
              {p.birthdayLabel ? (
                <div className="flex justify-between gap-2">
                  <dt className="text-app-muted">{t('userMenu.currentAge')}</dt>
                  <dd className="text-right font-medium text-app">{p.birthdayLabel}</dd>
                </div>
              ) : null}
              {p.workAgeLabel ? (
                <div className="flex justify-between gap-2">
                  <dt className="text-app-muted">{t('userMenu.workAge')}</dt>
                  <dd className="text-right font-medium text-app">{p.workAgeLabel}</dd>
                </div>
              ) : null}
              {p.worktimeTotalHours != null ? (
                <div className="flex justify-between gap-2">
                  <dt className="text-app-muted">{t('userMenu.totalHours')}</dt>
                  <dd className="text-right font-medium text-app">
                    <Link to="/worktime" className="hover:underline">
                      {p.worktimeTotalHours} {t('userMenu.hoursUnit')}
                    </Link>
                  </dd>
                </div>
              ) : null}
            </dl>
          ) : null}
        </div>

        <Separator />

        <nav className="flex flex-col p-1" aria-label={t('userMenu.navAria')}>
          {isWc ? (
            <>
              <Link
                to="/manhours"
                className="flex items-center gap-2 rounded-button px-3 py-2 text-body-sm text-app hover:bg-app-muted"
              >
                <BarChart3 className="size-4 shrink-0 opacity-70" aria-hidden />
                {t('userMenu.viewPerformance')}
                {p.worktimeTotalHours != null ? (
                  <span className="ml-auto text-xs text-app-muted">
                    {p.worktimeTotalHours} {t('userMenu.hoursUnit')}
                  </span>
                ) : null}
              </Link>
              <Link
                to="/worktime"
                className="flex items-center gap-2 rounded-button px-3 py-2 text-body-sm text-app hover:bg-app-muted"
              >
                <Clock className="size-4 shrink-0 opacity-70" aria-hidden />
                {t('userMenu.workHours')}
              </Link>
              <Link
                to="/planning"
                className="flex items-center gap-2 rounded-button px-3 py-2 text-body-sm text-app hover:bg-app-muted"
              >
                <CalendarDays className="size-4 shrink-0 opacity-70" aria-hidden />
                {t('userMenu.planWorkView')}
              </Link>
              <Separator className="my-1" />
            </>
          ) : null}
          <Link
            to="/settings"
            className="flex items-center gap-2 rounded-button px-3 py-2 text-body-sm text-app hover:bg-app-muted"
          >
            <Settings className="size-4 shrink-0 opacity-70" aria-hidden />
            {t('userMenu.profile')}
          </Link>
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-button px-3 py-2 text-left text-body-sm text-app hover:bg-app-muted"
            onClick={() => navigate('/logout')}
          >
            <LogOut className="size-4 shrink-0 opacity-70" aria-hidden />
            {t('actions.logout')}
          </button>
        </nav>
      </PopoverContent>
    </Popover>
  )
}
