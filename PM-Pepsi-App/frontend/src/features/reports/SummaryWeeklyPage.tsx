/**
 * Eng Utilization + สรุปรายสัปดาห์
 */
import { AppPageSection, AppPageSectionCard, AppPageShell } from '@/components/layout/AppPageShell'
import { arrayLength } from '@/lib/coerce-array'
import { hintsFromT } from '@/lib/i18n-hints'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ReportsDateFilter } from '@/features/reports/ReportsDateFilter'
import { EngUtilizationChart } from '@/features/reports/EngUtilizationChart'
import { EngUtilizationMissingPhotos } from '@/features/reports/EngUtilizationMissingPhotos'
import { EngUtilizationTeamGrid } from '@/features/reports/EngUtilizationTeamGrid'
import { useAnyPermission, usePermission } from '@/lib/use-permission'
import { SummaryWeeklyImportHint } from '@/features/reports/SummaryWeeklyImportHint'
import { SummaryWeeklyUtilizationChart } from '@/features/reports/SummaryWeeklyUtilizationChart'
import { fetchSummaryWeekly } from '@/lib/api-public'
import {
  type EngUtilizationPeriodId,
  excelStylePercentTotal,
  formatEngUtilizationLabel,
  engUtilizationYearlyHint,
  resolveEngUtilizationDateRange,
  toEngUtilizationChartRows,
} from '@/lib/eng-utilization-chart'
import { engUtilizationPeriodPresets } from '@/lib/reports-i18n'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import {
  AlertCircle,
  BarChart3,
  CalendarDays,
  ExternalLink,
  History,
  RefreshCcw,
  Table2,
  Users,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

function chartFullHref(variant: 'chart' | 'chart2', from: string, to: string) {
  const qs = new URLSearchParams({ variant, from, to })
  return `/summary-weekly/chart/full?${qs.toString()}`
}

export function SummaryWeeklyPage() {
  const { t } = useTranslation('reports')
  const { t: tc } = useTranslation('common')
  const canRead = usePermission('reports.read')
  const [periodId, setPeriodId] = useState<EngUtilizationPeriodId>('weekly')
  const [submitted, setSubmitted] = useState(() => resolveEngUtilizationDateRange('weekly'))
  const [showRcaInChart, setShowRcaInChart] = useState(false)
  const [hideWithoutPhoto, setHideWithoutPhoto] = useState(false)
  const canManagePhotos = useAnyPermission(['admin.users.write', 'personnel.write'])

  const periodPresets = useMemo(() => engUtilizationPeriodPresets(t), [t])
  const periodPreset = periodPresets.find((p) => p.id === periodId) ?? periodPresets[1]!

  const q = useQuery({
    queryKey: ['summary-weekly', periodId, submitted],
    queryFn: () => fetchSummaryWeekly({ from: submitted.from, to: submitted.to }),
    enabled: canRead,
    placeholderData: keepPreviousData,
  })

  const engChartRows = useMemo(
    () => (q.data?.rows ? toEngUtilizationChartRows(q.data.rows) : []),
    [q.data?.rows],
  )

  const displayChartRows = useMemo(
    () => (hideWithoutPhoto ? engChartRows.filter((p) => p.hasImage) : engChartRows),
    [engChartRows, hideWithoutPhoto],
  )

  const missingPhotoCount = useMemo(
    () => engChartRows.filter((p) => !p.hasImage).length,
    [engChartRows],
  )

  const chart = q.data?.utilizationChart ?? []
  const fullChart2 = useMemo(
    () => chartFullHref('chart2', submitted.from, submitted.to),
    [submitted.from, submitted.to],
  )
  const fullChart = useMemo(
    () => chartFullHref('chart', submitted.from, submitted.to),
    [submitted.from, submitted.to],
  )

  const applyPeriod = (id: EngUtilizationPeriodId) => {
    setPeriodId(id)
    setSubmitted(resolveEngUtilizationDateRange(id))
  }

  const rangeCaption =
    q.data?.range
      ? t('engUtil.rangeIso', {
          from: q.data.range.fromDate,
          to: q.data.range.toDate,
          shown: String(displayChartRows.length),
          total: hideWithoutPhoto ? ` / ${engChartRows.length}` : '',
        })
      : null

  if (!canRead) {
    return (
      <AppPageShell title={t('engUtil.title')} description={t('engUtil.description')}>
        <EmptyState
          icon={AlertCircle}
          title={t('engUtil.noAccess')}
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
      title={t('engUtil.title')}
      description={t('engUtil.description')}
      hints={hintsFromT(t, 'engUtil.hints')}
      headerActions={
        <>
          {q.data?.rows ? (
            <Badge variant="secondary" className="text-xs">
              {t('engUtil.badgeTechCount', { count: engChartRows.length })}
            </Badge>
          ) : null}
          <Button variant="outline" size="sm" asChild>
            <Link to="/reports">{t('engUtil.navKpi')}</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/manhours-hr">{t('engUtil.navManhourHr')}</Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void q.refetch()}
            disabled={q.isFetching}
          >
            <RefreshCcw className={`mr-1 size-3.5 ${q.isFetching ? 'animate-spin' : ''}`} aria-hidden />
            {t('engUtil.refresh')}
          </Button>
        </>
      }
    >
      <AppPageSection index={0}>
        <AppPageSectionCard
          icon={CalendarDays}
          title={t('engUtil.dateSectionTitle')}
          description={t('engUtil.dateSectionDesc')}
        >
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {periodPresets.map((p) => (
                <Button
                  key={p.id}
                  type="button"
                  size="sm"
                  variant={periodId === p.id ? 'default' : 'outline'}
                  onClick={() => applyPeriod(p.id)}
                  title={p.hint}
                >
                  {p.label}
                </Button>
              ))}
            </div>
            <p className="text-xs text-app-muted">
              {t('engUtil.autoRange', {
                preset: periodPreset.label,
                hint: periodId === 'yearly' ? engUtilizationYearlyHint() : periodPreset.hint,
              })}
            </p>
            <ReportsDateFilter
              key={`${submitted.from}-${submitted.to}`}
              initial={submitted}
              onSearch={(value) => {
                setSubmitted(value)
              }}
            />
          </div>
        </AppPageSectionCard>
      </AppPageSection>

      <AppPageSection index={1}>
        {q.data?.importCoverage ? (
          <SummaryWeeklyImportHint
            coverage={q.data.importCoverage}
            rowCount={arrayLength(q.data.rows)}
            onApplySapRange={(from, to) => setSubmitted({ from, to })}
          />
        ) : null}

        {q.isLoading && !q.data ? (
          <Skeleton className="h-96 w-full rounded-card" />
        ) : q.isError ? (
          <EmptyState
            icon={AlertCircle}
            title={t('engUtil.loadFailed')}
            description={(q.error as Error).message}
            action={{ label: tc('actions.retry'), onClick: () => void q.refetch() }}
          />
        ) : !q.data ? (
          <EmptyState title={t('engUtil.empty')} description={t('engUtil.emptyHint')} />
        ) : (
          <>
            {rangeCaption ? (
              <p className="mb-4 text-caption text-app-muted">{rangeCaption}</p>
            ) : null}

            <EngUtilizationMissingPhotos
              people={engChartRows}
              canManagePhotos={canManagePhotos}
            />
          </>
        )}
      </AppPageSection>

      {q.data ? (
        <>
          <AppPageSection index={2}>
            <AppPageSectionCard
              icon={Users}
              title={t('engUtil.gridTitle')}
              description={t('engUtil.gridSectionDesc')}
              actions={
                <label className="flex items-center gap-2 text-caption">
                  <input
                    type="checkbox"
                    checked={hideWithoutPhoto}
                    onChange={(e) => setHideWithoutPhoto(e.target.checked)}
                    className="size-4 rounded border-app"
                    disabled={missingPhotoCount === 0}
                  />
                  {t('engUtil.hideNoPhoto')}
                  {missingPhotoCount > 0 ? (
                    <span className="text-app-muted">({missingPhotoCount})</span>
                  ) : null}
                </label>
              }
            >
              <EngUtilizationTeamGrid people={displayChartRows} showRca={showRcaInChart} />
            </AppPageSectionCard>
          </AppPageSection>

          <AppPageSection index={3}>
            <AppPageSectionCard
              icon={BarChart3}
              title={t('engUtil.chartStacked')}
              description={t('engUtil.chartSectionDesc')}
              actions={
                <label className="flex items-center gap-2 text-caption">
                  <input
                    type="checkbox"
                    checked={showRcaInChart}
                    onChange={(e) => setShowRcaInChart(e.target.checked)}
                    className="size-4 rounded border-app"
                  />
                  {t('engUtil.includeRca')}
                </label>
              }
            >
              <EngUtilizationChart
                items={displayChartRows}
                layout="compact"
                showRca={showRcaInChart}
              />
            </AppPageSectionCard>
          </AppPageSection>

          <AppPageSection index={4}>
            <AppPageSectionCard
              icon={History}
              title={t('engUtil.legacyChart')}
              description={t('engUtil.legacyChartDesc')}
              collapsible
              defaultOpen={false}
            >
              <SummaryWeeklyUtilizationChart items={chart} variant="chart2" layout="compact" />
              <p className="mt-3 text-center text-body-sm">
                <Button variant="ghost" size="sm" className="h-auto px-1 text-[var(--app-accent)]" asChild>
                  <a href={fullChart2} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-1 inline size-3.5" aria-hidden />
                    {t('engUtil.expandChart')}
                  </a>
                </Button>
                <span className="mx-2 text-app-muted">|</span>
                <Button variant="ghost" size="sm" className="h-auto px-1 text-app-muted" asChild>
                  <a href={fullChart} target="_blank" rel="noopener noreferrer">
                    {t('engUtil.legacyChartLink')}
                  </a>
                </Button>
              </p>
            </AppPageSectionCard>
          </AppPageSection>

          <AppPageSection index={5}>
            <AppPageSectionCard
              icon={Table2}
              title={t('engUtil.tableSectionTitle')}
              description={t('engUtil.tableSectionDesc')}
              bodyClassName="!p-0"
            >
              <div className="app-table-shell overflow-x-auto">
                <Table embedded stickyHeader zebra>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">{t('engUtil.colNo')}</TableHead>
                      <TableHead>{t('engUtil.colWc')}</TableHead>
                      <TableHead className="text-right">{t('engUtil.colPmHrs')}</TableHead>
                      <TableHead className="text-right">{t('engUtil.colReactiveHrs')}</TableHead>
                      <TableHead className="text-right">{t('engUtil.colRcaHrs')}</TableHead>
                      <TableHead className="text-right">{t('engUtil.cardWo')}</TableHead>
                      <TableHead className="text-right">{t('engUtil.colHrHour')}</TableHead>
                      <TableHead className="text-right">{t('engUtil.colOtHour')}</TableHead>
                      <TableHead className="text-right">{t('engUtil.colPctPm')}</TableHead>
                      <TableHead className="text-right">{t('engUtil.colPctReactive')}</TableHead>
                      <TableHead className="text-right">{t('engUtil.colPctRca')}</TableHead>
                      <TableHead className="text-right">{t('engUtil.colTotalExcel')}</TableHead>
                      <TableHead className="text-right">{t('engUtil.colTotalRca')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {arrayLength(q.data.rows) ? (
                      (q.data.rows ?? []).map((row, i) => {
                        const excelTotal = excelStylePercentTotal(
                          row.percentPm,
                          row.percentReactive,
                        )
                        return (
                          <TableRow key={row.idwkctr}>
                            <TableCell>{i + 1}</TableCell>
                            <TableCell title={row.displayName ?? undefined}>
                              {formatEngUtilizationLabel(row.wkctr, row.displayName)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {row.pmHours.toFixed(1)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {row.reactiveHours.toFixed(1)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {row.rcaWork.toFixed(1)}
                            </TableCell>
                            <TableCell className="app-tone-warning-icon text-right tabular-nums">
                              {row.woCount}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">{row.hrHour}</TableCell>
                            <TableCell className="text-right tabular-nums">{row.otHour}</TableCell>
                            <TableCell className="app-tone-warning-icon text-right tabular-nums">
                              {row.percentPm.toFixed(2)}%
                            </TableCell>
                            <TableCell className="app-tone-warning-icon text-right tabular-nums">
                              {row.percentReactive.toFixed(2)}%
                            </TableCell>
                            <TableCell className="app-tone-warning-icon text-right tabular-nums">
                              {row.percentRca.toFixed(2)}%
                            </TableCell>
                            <TableCell className="app-tone-success-icon text-right tabular-nums font-medium">
                              {excelTotal.toFixed(2)}%
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-app-muted">
                              {row.percentTotal.toFixed(2)}%
                            </TableCell>
                          </TableRow>
                        )
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={13} className="p-0">
                          <EmptyState
                            className="border-0 bg-transparent py-10"
                            title={t('engUtil.tableEmpty')}
                            description={t('engUtil.tableEmptyHint')}
                          />
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </AppPageSectionCard>
          </AppPageSection>
        </>
      ) : null}
    </AppPageShell>
  )
}
