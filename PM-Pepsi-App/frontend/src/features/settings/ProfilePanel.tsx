import { AppCard } from '@/components/layout/AppCard'
import { ChangePasswordForm } from '@/features/settings/ChangePasswordForm'
import { getStoredAuthUser } from '@/features/auth/login-api'
import { useProfileQuery } from '@/features/profile/profile-api'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { SidebarPreferencePanel } from '@/features/settings/SidebarPreferencePanel'
import { AlertCircle } from 'lucide-react'
import { resolveRoleDisplayLabel } from '@/lib/role-display'
import { useAppLocale } from '@/providers/I18nProvider'
import { useTranslation } from 'react-i18next'

export function ProfilePanel() {
  const { t } = useTranslation()
  const { locale } = useAppLocale()
  const authUser = getStoredAuthUser()
  const q = useProfileQuery(Boolean(authUser))

  if (!authUser) {
    return (
      <EmptyState
        title={t('settings.signInRequired')}
        description={t('settings.signInForProfile')}
      />
    )
  }

  if (q.isLoading && !q.data) return <Skeleton className="h-40 w-full rounded-card" />
  if (q.isError) {
    return (
      <EmptyState
        icon={AlertCircle}
        title={t('settings.loadProfileFailed')}
        description={(q.error as Error).message}
        action={{ label: t('actions.retry'), onClick: () => void q.refetch() }}
      />
    )
  }

  const p = q.data!
  const isMember = p.accountType === 'member'

  return (
    <div className="space-y-4">
      <SidebarPreferencePanel />
      <AppCard pad="compact" className="space-y-4">
        <div>
          <h3 className="text-body-sm font-semibold text-app">{t('settings.profileTitle')}</h3>
          <p className="mt-1 text-xs text-app-muted">
            {t('settings.profileHint', {
              source: isMember
                ? t('settings.profileSourceMember')
                : t('settings.profileSourceWc'),
            })}
          </p>
        </div>
        <dl className="grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-app-muted">{t('settings.displayName')}</dt>
            <dd className="text-body-sm font-medium text-app">{p.displayName}</dd>
          </div>
          <div>
            <dt className="text-xs text-app-muted">{t('settings.status')}</dt>
            <dd className="text-body-sm text-app">{resolveRoleDisplayLabel(p, locale)}</dd>
          </div>
          <div>
            <dt className="text-xs text-app-muted">
              {isMember ? t('settings.username') : t('settings.wcCode')}
            </dt>
            <dd className="font-mono text-body-sm text-app">{p.username}</dd>
          </div>
          {!isMember && p.plnt ? (
            <div>
              <dt className="text-xs text-app-muted">{t('settings.plant')}</dt>
              <dd className="text-body-sm text-app">{p.plnt}</dd>
            </div>
          ) : null}
          {!isMember && p.birthdayLabel ? (
            <div>
              <dt className="text-xs text-app-muted">{t('settings.profileFields.age')}</dt>
              <dd className="text-body-sm text-app">{p.birthdayLabel}</dd>
            </div>
          ) : null}
          {!isMember && p.workAgeLabel ? (
            <div>
              <dt className="text-xs text-app-muted">{t('settings.profileFields.workAge')}</dt>
              <dd className="text-body-sm text-app">{p.workAgeLabel}</dd>
            </div>
          ) : null}
          {!isMember && p.worktimeTotalHours != null ? (
            <div>
              <dt className="text-xs text-app-muted">{t('settings.profileFields.worktimeHours')}</dt>
              <dd className="text-body-sm text-app">
                {p.worktimeTotalHours} {t('settings.profileFields.hoursUnit')}
              </dd>
            </div>
          ) : null}
          {isMember && p.idcard ? (
            <div>
              <dt className="text-xs text-app-muted">{t('settings.profileFields.idCard')}</dt>
              <dd className="text-body-sm text-app">{p.idcard}</dd>
            </div>
          ) : null}
          {isMember && p.bank ? (
            <div className="sm:col-span-2">
              <dt className="text-xs text-app-muted">{t('settings.profileFields.bank')}</dt>
              <dd className="text-body-sm text-app">
                {p.bank} {p.bankNo ? `· ${p.bankNo}` : ''} {p.branch ? `· ${p.branch}` : ''}
              </dd>
            </div>
          ) : null}
          {p.lastLogin ? (
            <div>
              <dt className="text-xs text-app-muted">{t('settings.profileFields.lastLogin')}</dt>
              <dd className="text-body-sm tabular-nums text-app">
                {new Date(p.lastLogin).toLocaleString(locale)}
              </dd>
            </div>
          ) : null}
        </dl>
      </AppCard>
      <ChangePasswordForm />
    </div>
  )
}
