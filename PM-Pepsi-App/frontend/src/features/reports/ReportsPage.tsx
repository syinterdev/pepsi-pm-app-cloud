import { CanPermission } from '@/components/auth/CanPermission'
import { hintsFromT } from '@/lib/i18n-hints'
import { AppPageSection, AppPageSectionCard, AppPageShell } from '@/components/layout/AppPageShell'
import { KpiStatGrid } from '@/components/kpi/KpiStatGrid'
import { KpiStatCard } from '@/components/kpi/KpiStatCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import {
  defaultReportsDateRange,
  ReportsDateFilter,
} from '@/features/reports/ReportsDateFilter'
import { WeekToWeekTable } from '@/features/reports/WeekToWeekTable'
import { fetchKpi } from '@/lib/api-public'
import { usePermission } from '@/lib/use-permission'
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { AlertCircle } from 'lucide-react'
import { Bar, Line } from 'react-chartjs-2'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
)

export function ReportsPage() {
  const { t } = useTranslation('reports')
  const { t: tc } = useTranslation('common')
  const canRead = usePermission('reports.read')
  const initial = defaultReportsDateRange(56)
  const [submitted, setSubmitted] = useState(() => ({
    ...initial,
    weeksBack: 8,
  }))

  const q = useQuery({
    queryKey: ['reports-kpi', submitted],
    queryFn: () =>
      fetchKpi({
        from: submitted.from,
        to: submitted.to,
        weeksBack: submitted.weeksBack,
      }),
    enabled: canRead,
    placeholderData: keepPreviousData,
  })

  const avgUtil =
    Array.isArray(q.data?.utilization) && q.data.utilization.length > 0
      ? Math.round(
          q.data.utilization.reduce((a, b) => a + b, 0) / q.data.utilization.length,
        )
      : 0

  if (!canRead) {
    return (
      <AppPageShell title={t('page.title')} description={t('page.description')}>
        <EmptyState
          icon={AlertCircle}
          title={t('page.noAccess')}
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
      title={t('page.title')}
      description={t('page.description')}
      hints={hintsFromT(t, 'page.hints')}
      headerActions={
        <>
          <Badge variant="secondary" className="text-xs">
            {t('page.badgeWeekToWeek')}
          </Badge>
          <CanPermission permission="reports.read">
            <Button variant="outline" size="sm" asChild>
              <Link to="/summary-weekly">{t('page.navSummaryWeekly')}</Link>
            </Button>
          </CanPermission>
          <CanPermission permission="reports.read">
            <Button variant="outline" size="sm" asChild>
              <Link to="/activity-log">{t('page.navActivityLog')}</Link>
            </Button>
          </CanPermission>
          <CanPermission permission="reports.read">
            <Button variant="outline" size="sm" asChild>
              <Link to="/reports/audit">{t('page.navAuditorHub')}</Link>
            </Button>
          </CanPermission>
        </>
      }
    >
        <AppPageSection index={0}>
        <ReportsDateFilter
          initial={submitted}
          showWeeksBack
          onSearch={(value) =>
            setSubmitted({
              from: value.from,
              to: value.to,
              weeksBack: value.weeksBack ?? 8,
            })
          }
        />
        </AppPageSection>

        <AppPageSection index={1}>
        {q.isLoading && !q.data ? (
          <Skeleton className="h-96 w-full rounded-card" />
        ) : q.isError ? (
          <EmptyState
            icon={AlertCircle}
            title={t('page.loadFailed')}
            description={(q.error as Error).message}
            action={{ label: tc('actions.retry'), onClick: () => void q.refetch() }}
          />
        ) : q.data ? (
          <>
            <KpiStatGrid className="mb-4 gap-3 sm:grid-cols-3">
              <KpiStatCard label={t('page.kpiAvgUtil')} value={`${avgUtil}%`} />
              <KpiStatCard
                label={t('page.kpiBacklogLatest')}
                value={String(
                  Array.isArray(q.data.backlogHours) && q.data.backlogHours.length > 0
                    ? q.data.backlogHours[q.data.backlogHours.length - 1]
                    : 0,
                )}
              />
              <KpiStatCard
                label={t('page.kpiDataRange')}
                value={`${q.data.range?.fromDate ?? '—'} – ${q.data.range?.toDate ?? '—'}`}
                footer={
                  Array.isArray(q.data.labels) && q.data.labels.length > 0
                    ? `${q.data.labels[0]} – ${q.data.labels[q.data.labels.length - 1]}`
                    : undefined
                }
              />
            </KpiStatGrid>
            <AppPageSectionCard
              icon={AlertCircle}
              title={t('page.weekToWeekTitle')}
              description={t('page.weekToWeekDesc')}
              bodyClassName="space-y-3"
            >
              <WeekToWeekTable rows={q.data.weekToWeek} />
            </AppPageSectionCard>

            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              <AppPageSectionCard
                icon={AlertCircle}
                title={t('page.chartUtilization')}
                bodyClassName="!p-3"
              >
                <Bar
                  data={{
                    labels: q.data.labels,
                    datasets: [
                      {
                        label: 'Utilization %',
                        data: q.data.utilization,
                        backgroundColor: 'rgba(59,130,246,0.8)',
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    plugins: {
                      title: { display: true, text: t('page.chartUtilizationTitle') },
                    },
                    scales: { y: { max: 100 } },
                  }}
                />
              </AppPageSectionCard>
              <AppPageSectionCard
                icon={AlertCircle}
                title={t('page.chartBacklogTrend')}
                bodyClassName="!p-3"
              >
                <Line
                  data={{
                    labels: q.data.labels,
                    datasets: [
                      {
                        label: t('page.chartBacklogDataset'),
                        data: q.data.backlogHours,
                        borderColor: 'rgb(24,24,27)',
                        backgroundColor: 'rgba(24,24,27,0.1)',
                        fill: true,
                        tension: 0.3,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    plugins: {
                      title: { display: true, text: t('page.chartBacklogTitle') },
                    },
                  }}
                />
              </AppPageSectionCard>
            </div>
          </>
        ) : (
          <EmptyState
            icon={AlertCircle}
            title={t('page.empty')}
            description={t('page.emptyHint')}
          />
        )}
        </AppPageSection>
    </AppPageShell>
  )
}
