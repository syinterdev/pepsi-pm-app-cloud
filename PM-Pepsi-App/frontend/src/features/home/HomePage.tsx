import { CanPermission } from '@/components/auth/CanPermission'
import { AppPageContent } from '@/components/layout/AppPageContent'
import {
  AppPageHero,
  appPageHeroBtnClass,
  appPageHeroBtnPrimaryClass,
} from '@/components/layout/AppPageHero'
import { Sparkline, sparklineDelta, type SparklineTone } from '@/components/charts/Sparkline'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { getStoredAuthUser } from '@/features/auth/login-api'
import {
  displayUserName,
  navItemsToQuickLinks,
} from '@/features/home/dashboard-config'
import { fetchDashboardSummary } from '@/lib/api-public'
import { coerceNumberArray } from '@/lib/coerce-array'
import { readCssVar } from '@/lib/css-tokens'
import {
  listKpiStaggerItemMotion,
  listKpiStaggerRootMotion,
} from '@/lib/list-kpi-stagger'
import { useAppNav } from '@/lib/use-app-nav'
import { cn } from '@/lib/utils'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { motion, useReducedMotion } from 'framer-motion'
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Database,
  UserRound,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  EVENTS,
  Joyride,
  STATUS,
  type EventData,
  type Step,
} from 'react-joyride'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { resolveRoleDisplayLabel } from '@/lib/role-display'
import { useAppLocale } from '@/providers/I18nProvider'
import type { AppLocale } from '@/lib/app-locale'
import { useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

type KpiTone = 'pepsi-blue' | 'pepsi-red' | 'pepsi-orange'

function KpiCard({
  label,
  value,
  hint,
  to,
  icon: Icon,
  tone,
  trend,
  sparkTone,
  reducedMotion,
  last7DaysLabel,
  openModuleLabel,
}: {
  label: string
  value: string | number
  hint: string
  to: string
  icon: LucideIcon
  tone: KpiTone
  trend: number[]
  sparkTone: SparklineTone
  reducedMotion: boolean
  last7DaysLabel: string
  openModuleLabel: string
}) {
  const toneClass = {
    'pepsi-blue': 'dashboard-kpi--pepsi-blue',
    'pepsi-red': 'dashboard-kpi--pepsi-red',
    'pepsi-orange': 'dashboard-kpi--pepsi-orange',
  }[tone]

  const delta = sparklineDelta(trend)

  return (
    <motion.div {...listKpiStaggerItemMotion(reducedMotion)}>
      <Link
        to={to}
        className={cn('dashboard-kpi group block focus:outline-none', toneClass)}
      >
        <div className="dashboard-kpi__glow" aria-hidden />
        <div className="dashboard-kpi__stripe" aria-hidden />
        <div className="dashboard-kpi__inner">
          <div className="flex items-start justify-between gap-2">
            <div className="dashboard-kpi__icon">
              <Icon className="size-5" aria-hidden />
            </div>
            <div className="flex min-w-0 flex-col items-end gap-1">
              <Sparkline
                data={trend}
                tone={sparkTone}
                width={112}
                height={40}
                className="max-w-full shrink-0 opacity-95"
              />
              <span className="text-caption">{last7DaysLabel}</span>
            </div>
          </div>
          <p className="mt-3 text-body-sm font-medium text-[var(--app-text-muted)]">{label}</p>
          <div className="mt-1 flex flex-wrap items-baseline gap-2">
            <p className="text-3xl font-semibold tracking-tight tabular-nums text-[var(--app-text)]">
              {value}
            </p>
            {delta != null ? (
              <span
                className={cn(
                  'dashboard-kpi__delta',
                  delta >= 0 ? 'dashboard-kpi__delta--up' : 'dashboard-kpi__delta--down',
                )}
              >
                {delta >= 0 ? '+' : ''}
                {delta}%
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-xs leading-relaxed text-[var(--app-text-muted)]">{hint}</p>
          <span className="dashboard-kpi__cta mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[var(--app-accent)]">
            {openModuleLabel}
            <ArrowUpRight className="size-3.5" aria-hidden />
          </span>
        </div>
      </Link>
    </motion.div>
  )
}

function formatHeroDate(d: Date, locale: AppLocale): string {
  return d.toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/** หัวหน้าแดชบอร์ด — hero มาตรฐานทุกหน้า */
function DashboardHero({
  userName,
  wkctrBadge,
  isFetching,
  onStartTour,
  locale,
}: {
  userName: string
  wkctrBadge: ReactNode
  isFetching: boolean
  onStartTour: () => void
  locale: AppLocale
}) {
  const { t } = useTranslation('home')
  return (
    <AppPageHero
      title={t('greeting', { name: userName ? t('greetingName', { name: userName }) : '' })}
      description={
        <>
          {t('heroDescription', { date: formatHeroDate(new Date(), locale) })}
          {wkctrBadge}
        </>
      }
      actions={
        <>
          <span className={cn('dashboard-live', isFetching && 'dashboard-live--pulse')}>
            <span className="dashboard-live__dot" />
            {isFetching ? t('liveUpdating') : t('liveReady')}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={appPageHeroBtnClass}
            onClick={onStartTour}
          >
            {t('startTour')}
          </Button>
          <CanPermission permission="dashboard.read">
            <Button asChild variant="outline" size="sm" className={appPageHeroBtnClass}>
              <Link to="/board" target="_blank" rel="noopener noreferrer">
                {t('engineeringBoard')}
              </Link>
            </Button>
          </CanPermission>
          <CanPermission permission="planning.read">
            <Button asChild size="sm" className={appPageHeroBtnPrimaryClass}>
              <Link to="/plan-calendar">
                {t('goAssign')}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CanPermission>
        </>
      }
    />
  )
}

export function HomePage() {
  const { t, i18n } = useTranslation('home')
  const { t: tc } = useTranslation('common')
  const { locale } = useAppLocale()
  const [runTour, setRunTour] = useState(false)
  const reducedMotion = useReducedMotion()
  const user = getStoredAuthUser()
  const { entries } = useAppNav()

  const tourSteps: Step[] = useMemo(
    () => [
      { target: '[data-tour="dashboard-kpi"]', content: t('tour.kpi') },
      { target: '[data-tour="dashboard-quick"]', content: t('tour.quick') },
    ],
    [t],
  )
  const dash = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => fetchDashboardSummary(),
    placeholderData: keepPreviousData,
  })

  const quickLinks = useMemo(
    () => navItemsToQuickLinks(entries, t),
    [entries, t, i18n.language],
  )

  const handleJoyrideEvent = (data: EventData) => {
    if (data.type === EVENTS.TOUR_END) {
      setRunTour(false)
      toast.success(t('tourEnd'))
    }
    if (data.status === STATUS.SKIPPED) {
      setRunTour(false)
    }
  }

  const trends = dash.data?.trends
  const importDaily = coerceNumberArray(trends?.importDaily)

  const kpis = useMemo(
    () =>
      dash.data == null || trends == null
        ? null
        : [
          {
            label: t('kpi.openOrders'),
            value: dash.data.openOrders.toLocaleString(locale === 'th' ? 'th-TH' : 'en-US'),
            hint: t('kpi.openOrdersHint'),
            to: '/work-orders',
            icon: ClipboardList,
            tone: 'pepsi-blue' as const,
            trend: coerceNumberArray(trends.openDaily),
            sparkTone: 'pepsi-blue' as const,
          },
          {
            label: t('kpi.closedMonth'),
            value: dash.data.closedThisMonth.toLocaleString(locale === 'th' ? 'th-TH' : 'en-US'),
            hint: t('kpi.closedMonthHint'),
            to: '/work-orders',
            icon: CheckCircle2,
            tone: 'pepsi-red' as const,
            trend: coerceNumberArray(trends.closedDaily),
            sparkTone: 'pepsi-red' as const,
          },
          {
            label: t('kpi.pendingAssign'),
            value: dash.data.pendingPersonnel.toLocaleString(locale === 'th' ? 'th-TH' : 'en-US'),
            hint: t('kpi.pendingAssignHint'),
            to: '/planning',
            icon: UserRound,
            tone: 'pepsi-orange' as const,
            trend: coerceNumberArray(trends.pendingDaily),
            sparkTone: 'pepsi-orange' as const,
          },
          {
            label: t('kpi.iw37nImport'),
            value: dash.data.iw37nLastImport
              ? new Date(dash.data.iw37nLastImport).toLocaleDateString(
                  locale === 'th' ? 'th-TH' : 'en-US',
                )
              : '—',
            hint: t('kpi.iw37nImportHint', {
              count: importDaily.reduce((a, b) => a + b, 0),
            }),
            to: '/iw37n',
            icon: Database,
            tone: 'pepsi-blue' as const,
            trend: importDaily,
            sparkTone: 'pepsi-blue' as const,
          },
        ],
    [dash.data, trends, importDaily, t, locale],
  )

  const wkctrBadge =
    user?.wkctr ? (
      <span className="dashboard-hero__badge">
        WC {user.wkctr}
        {user.userst || user.roleNameTh || user.sysstatus
          ? ` · ${resolveRoleDisplayLabel(user, locale)}`
          : ''}
      </span>
    ) : null

  return (
    <div className="dashboard-page min-h-full w-full">
      <DashboardHero
        userName={user ? displayUserName(user) : ''}
        wkctrBadge={wkctrBadge}
        isFetching={dash.isFetching}
        onStartTour={() => setRunTour(true)}
        locale={locale}
      />

      <Joyride
        steps={tourSteps}
        run={runTour}
        continuous
        scrollToFirstStep
        options={{
          buttons: ['back', 'primary', 'skip'],
          primaryColor: readCssVar('--brand-pepsi-blue'),
        }}
        onEvent={handleJoyrideEvent}
        styles={{ tooltipContainer: { zIndex: 10000 } }}
        locale={{
          back: t('joyride.back'),
          close: t('joyride.close'),
          last: t('joyride.last'),
          next: t('joyride.next'),
          skip: t('joyride.skip'),
        }}
      />

      <AppPageContent className="dashboard-page__body mx-auto w-full max-w-[1600px] space-y-8 !pt-6">
        <section data-tour="dashboard-kpi" aria-labelledby="dashboard-kpi-heading">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2
                id="dashboard-kpi-heading"
                className="text-lg font-semibold tracking-tight text-[var(--app-text)]"
              >
                {t('kpiSection.title')}
              </h2>
              <p className="text-caption">{t('kpiSection.subtitle')}</p>
            </div>
            <CanPermission permission="reports.read">
              <Link
                to="/reports"
                className="hidden text-body-sm font-medium text-[var(--app-accent)] hover:underline sm:inline-flex sm:items-center sm:gap-1"
              >
                {t('kpiSection.fullReport')}
                <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            </CanPermission>
          </div>

          {dash.isLoading ? (
            <div
              className="dashboard-kpi-grid"
              aria-busy="true"
              aria-label={t('kpiSection.loading')}
            >
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-[188px] rounded-card" />
              ))}
            </div>
          ) : dash.isError ? (
            <EmptyState
              icon={AlertCircle}
              title={t('kpiSection.loadFailed')}
              description={
                <>
                  {t('kpiSection.loadFailedHint')}{' '}
                  <code className="text-xs">dashboard.read</code>
                  {dash.error instanceof Error ? ` — ${dash.error.message}` : null}
                </>
              }
              action={{ label: tc('actions.retry'), onClick: () => void dash.refetch() }}
            />
          ) : kpis ? (
            <motion.div
              className="dashboard-kpi-grid"
              {...listKpiStaggerRootMotion(reducedMotion)}
            >
              {kpis.map((k) => (
                <KpiCard
                  key={k.label}
                  {...k}
                  reducedMotion={!!reducedMotion}
                  last7DaysLabel={t('kpiSection.last7Days')}
                  openModuleLabel={t('kpiSection.openModule')}
                />
              ))}
            </motion.div>
          ) : (
            <EmptyState
              title={t('kpiSection.noData')}
              description={t('kpiSection.noDataHint')}
              action={{ label: t('kpiSection.refresh'), onClick: () => void dash.refetch() }}
            />
          )}
        </section>

        <section data-tour="dashboard-quick" aria-labelledby="dashboard-quick-heading">
          <div className="mb-4">
            <h2
              id="dashboard-quick-heading"
              className="text-lg font-semibold tracking-tight text-[var(--app-text)]"
            >
              {t('quick.title')}
            </h2>
            <p className="text-caption">{t('quick.subtitle')}</p>
          </div>

          {quickLinks.length === 0 ? (
            <EmptyState
              title={t('quick.noMenu')}
              description={t('quick.noMenuHint')}
            />
          ) : (
            <motion.div
              className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
              {...listKpiStaggerRootMotion(reducedMotion)}
            >
              {quickLinks.map((item) => {
                const Icon = item.icon
                return (
                  <motion.div key={item.to} {...listKpiStaggerItemMotion(reducedMotion)}>
                    <Link to={item.to} className="dashboard-quick group block focus:outline-none">
                      <div className="dashboard-quick__shine" aria-hidden />
                      <div className="flex items-start gap-3">
                        <div className="dashboard-quick__icon">
                          <Icon className="size-5" aria-hidden />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-[var(--app-text)] group-hover:text-[var(--app-accent)]">
                            {item.label}
                          </p>
                          <p className="mt-1 text-xs leading-relaxed text-[var(--app-text-muted)]">
                            {item.hint}
                          </p>
                        </div>
                        <CalendarClock
                          className="size-4 shrink-0 text-[var(--app-text-muted)] opacity-0 transition-opacity group-hover:opacity-100"
                          aria-hidden
                        />
                      </div>
                    </Link>
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </section>
      </AppPageContent>
    </div>
  )
}
