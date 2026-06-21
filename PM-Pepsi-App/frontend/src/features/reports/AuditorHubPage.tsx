import { AppCard } from '@/components/layout/AppCard'
import { hintsFromT } from '@/lib/i18n-hints'
import { arrayLength } from '@/lib/coerce-array'
import {
  AppPageSection,
  AppPageSectionCard,
  AppPageShell,
} from '@/components/layout/AppPageShell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { AuditorRevisionTable } from '@/features/reports/AuditorRevisionTable'
import { WeekToWeekTable } from '@/features/reports/WeekToWeekTable'
import { fetchAuditHub, fetchKpi } from '@/lib/api-public'
import { usePermission } from '@/lib/use-permission'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import {
  AlertCircle,
  BookText,
  ClipboardList,
  History,
  LineChart,
  ShieldAlert,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

function KpiCard({
  title,
  value,
  hint,
}: {
  title: string
  value: number | string
  hint?: string
}) {
  return (
    <AppCard pad="compact">
      <div className="text-xs text-app-muted">{title}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums text-app">{value}</div>
      {hint ? <p className="mt-1 text-xs text-app-muted">{hint}</p> : null}
    </AppCard>
  )
}

function latestWeekToWeek(rows: { utilization: number; backlogHours: number }[]) {
  if (!rows.length) return null
  return rows[rows.length - 1]
}

/** Phase A+F — Auditor Hub (`reports.read`) */
export function AuditorHubPage() {
  const { t } = useTranslation('reports')
  const { t: tc } = useTranslation('common')
  const canRead = usePermission('reports.read')
  const canAdminAudit = usePermission('admin.audit.read')

  const hubQ = useQuery({
    queryKey: ['reports', 'audit-hub'],
    queryFn: fetchAuditHub,
    staleTime: 60_000,
    enabled: canRead,
    placeholderData: keepPreviousData,
  })

  const kpiQ = useQuery({
    queryKey: ['reports', 'kpi', 'audit-hub', 8],
    queryFn: () => fetchKpi({ weeksBack: 8 }),
    staleTime: 120_000,
    enabled: canRead,
    placeholderData: keepPreviousData,
  })

  const data = hubQ.data
  const latestWtw = latestWeekToWeek(kpiQ.data?.weekToWeek ?? [])
  const rangeLabel = data
    ? `${new Date(data.range.from).toLocaleDateString()} – ${new Date(data.range.to).toLocaleDateString()}`
    : t('auditor.badgeLast7Days')

  if (!canRead) {
    return (
      <AppPageShell title={t('auditor.title')} description={t('auditor.description')}>
        <EmptyState
          icon={AlertCircle}
          title={t('auditor.noAccess')}
          description={
            <>
              {tc('rbac.requiresPermission')}{' '}
              <code className="text-xs">reports.read</code>
            </>
          }
        />
      </AppPageShell>
    )
  }

  return (
    <AppPageShell
      title={t('auditor.title')}
      description={t('auditor.description')}
      hints={hintsFromT(t, 'auditor.hints')}
      headerActions={
        <>
          <Badge variant="secondary" className="text-xs">
            {t('auditor.badgeLast7Days')}
          </Badge>
          <Button variant="default" size="sm" asChild>
            <Link to="/activity-log">
              <BookText className="mr-1 size-4" aria-hidden />
              {t('auditor.navActivityLog')}
            </Link>
          </Button>
          {canAdminAudit ? (
            <Button variant="outline" size="sm" asChild>
              <Link to="/admin/audit">
                <History className="mr-1 size-4" aria-hidden />
                {t('auditor.navFullAudit')}
              </Link>
            </Button>
          ) : null}
        </>
      }
    >
      <AppPageSection index={0}>
        {hubQ.isLoading && !hubQ.data ? (
          <Skeleton className="h-32 w-full rounded-card" />
        ) : data ? (
          <p className="text-caption">
            {t('auditor.rangeSummary', {
              range: rangeLabel,
              days: data.retentionDays,
              cutoff: data.retentionCutoffDate,
            })}
          </p>
        ) : null}

        {hubQ.isError ? (
          <EmptyState
            icon={ShieldAlert}
            title={t('auditor.loadFailed')}
            description={t('auditor.loadFailedHint')}
            action={{ label: tc('actions.retry'), onClick: () => void hubQ.refetch() }}
          />
        ) : null}

        {data ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <KpiCard title={t('auditor.kpiEventsOk')} value={data.totals.events} />
              <KpiCard title={t('auditor.kpiDenied')} value={data.totals.denied} hint="rbac.deny" />
              <KpiCard title={t('auditor.kpiImports')} value={data.totals.imports} />
              <KpiCard title={t('auditor.kpiPlanning')} value={data.totals.planning} />
              <KpiCard title={t('auditor.kpiConfirmations')} value={data.totals.confirmations} />
              <KpiCard title={t('auditor.kpiWorkOrders')} value={data.totals.workOrders} />
            </div>

            {arrayLength(data.byPrefix) > 0 ? (
              <AppCard pad="default" className="mt-4">
                <h3 className="text-base font-semibold text-app">{t('auditor.byAction')}</h3>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {(data.byPrefix ?? []).map((p) => (
                    <li
                      key={p.prefix}
                      className="rounded-button border border-app bg-[var(--app-surface)] px-3 py-2 text-body-sm"
                    >
                      {p.label}{' '}
                      <span className="font-medium tabular-nums text-app">{p.count}</span>
                    </li>
                  ))}
                </ul>
              </AppCard>
            ) : null}
          </>
        ) : hubQ.isLoading ? (
          <div className="grid gap-3 sm:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-24 rounded-card" />
            ))}
          </div>
        ) : !hubQ.isError ? (
          <EmptyState title={t('auditor.empty')} description={t('auditor.emptyHint')} />
        ) : null}
      </AppPageSection>

      <AppPageSection index={1}>
        <AppPageSectionCard
          icon={ClipboardList}
          title={t('auditor.planWoTitle', { month: data?.planWo.monthLabel ?? '' })}
          description={t('auditor.planWoDesc')}
          collapsible
          defaultOpen
          collapsedHint={
            data
              ? `PM ${data.planWo.pmWo} · WO ${data.planWo.totalWo} · ${data.planWo.assignedWo}`
              : undefined
          }
        >
          {data ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <KpiCard title={t('auditor.kpiTotalWo')} value={data.planWo.totalWo} />
                <KpiCard title={t('auditor.kpiPm')} value={data.planWo.pmWo} hint={t('auditor.kpiPmHint')} />
                <KpiCard title={t('auditor.kpiReactive')} value={data.planWo.reactiveWo} />
                <KpiCard title={t('auditor.kpiOpen')} value={data.planWo.openWo} />
                <KpiCard title={t('auditor.kpiAssigned')} value={data.planWo.assignedWo} />
                <KpiCard title={t('auditor.kpiMoved')} value={data.planWo.movedWo} />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" asChild>
                  <Link to="/plan-calendar">{t('auditor.navPlanCalendar')}</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/work-orders">{t('auditor.navWorkOrders')}</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/calendar">{t('auditor.navScheduling')}</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/planning">{t('auditor.navPlanning')}</Link>
                </Button>
              </div>
            </>
          ) : (
            <Skeleton className="h-32 w-full rounded-card" />
          )}
        </AppPageSectionCard>
      </AppPageSection>

      <AppPageSection index={2}>
        <AppPageSectionCard
          icon={History}
          title={t('auditor.revisionTitle')}
          description={t('auditor.revisionDesc')}
          collapsible
          defaultOpen
          collapsedHint={
            arrayLength(data?.recentRevisions) > 0
              ? t('auditor.revisionCollapsed', { count: arrayLength(data?.recentRevisions) })
              : undefined
          }
        >
          <AuditorRevisionTable rows={data?.recentRevisions ?? []} />
        </AppPageSectionCard>

        <AppPageSectionCard
          icon={LineChart}
          title={t('auditor.utilTitle')}
          description={t('auditor.utilDesc')}
          collapsible
          defaultOpen={false}
          className="mt-4"
          collapsedHint={
            latestWtw
              ? t('auditor.utilCollapsed', {
                  util: latestWtw.utilization,
                  hrs: latestWtw.backlogHours,
                })
              : undefined
          }
        >
          {kpiQ.isLoading && !kpiQ.data ? (
            <Skeleton className="h-40 w-full rounded-card" />
          ) : kpiQ.isError ? (
            <EmptyState
              icon={AlertCircle}
              title={t('auditor.utilLoadFailed')}
              description={(kpiQ.error as Error).message}
              action={{ label: tc('actions.retry'), onClick: () => void kpiQ.refetch() }}
            />
          ) : (
            <>
              <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <KpiCard
                  title={t('auditor.utilLatest')}
                  value={latestWtw ? `${latestWtw.utilization}%` : '—'}
                />
                <KpiCard
                  title={t('auditor.utilBacklog')}
                  value={latestWtw ? latestWtw.backlogHours.toLocaleString() : '—'}
                />
              </div>
              <WeekToWeekTable rows={kpiQ.data?.weekToWeek ?? []} />
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link to="/summary-weekly">{t('engUtil.title')}</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/reports">{t('activity.navKpi')}</Link>
                </Button>
              </div>
            </>
          )}
        </AppPageSectionCard>

        <AppCard pad="default" className="mt-4">
          <h3 className="text-base font-semibold text-app">{t('auditor.shortcutsTitle')}</h3>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild>
              <Link to="/activity-log">{t('auditor.navActivityLog')}</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/calendar">{t('auditor.shortcutsOrderFrame')}</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/summary-weekly">{t('engUtil.title')}</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/user-log">{t('auditor.shortcutsUserLog')}</Link>
            </Button>
          </div>
        </AppCard>
      </AppPageSection>
    </AppPageShell>
  )
}
