/**
 * Manhour HR
 */
import { AppCard } from '@/components/layout/AppCard'
import { arrayLength } from '@/lib/coerce-array'
import { hintsFromT } from '@/lib/i18n-hints'
import { AppPageSection, AppPageSectionCard, AppPageShell } from '@/components/layout/AppPageShell'
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
  tableStickyClass,
} from '@/components/ui/table'
import { getStoredAuthUser } from '@/features/auth/login-api'
import {
  formatManhourDate,
  manhourOtNet,
} from '@/features/manhours/format-manhour-date'
import {
  defaultReportsDateRange,
  ReportsDateFilter,
} from '@/features/reports/ReportsDateFilter'
import { fetchManhourHr } from '@/lib/api-public'
import { useAnyPermission } from '@/lib/use-permission'
import { cn } from '@/lib/utils'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import {
  AlertCircle,
  CalendarDays,
  LineChart,
  Printer,
  RefreshCcw,
  Table2,
  Users,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

function HourCell({ value }: { value: number }) {
  return <span className="tabular-nums">{value}</span>
}

export function ManhoursHrPage() {
  const { t } = useTranslation('manhours')
  const { t: tc } = useTranslation('common')
  const auth = getStoredAuthUser()
  const canRead = useAnyPermission(['manhours.read', 'manhours.admin'])
  const wkctrLabel = auth?.wkctr?.trim() || '—'
  const canFetch = Boolean(canRead && (auth?.wkctr?.trim() || auth?.userst === 'A'))
  const [submitted, setSubmitted] = useState(() => defaultReportsDateRange(30))

  const q = useQuery({
    queryKey: ['manhours-hr', wkctrLabel, submitted],
    queryFn: () =>
      fetchManhourHr({
        limit: 500,
        from: submitted.from,
        to: submitted.to,
      }),
    enabled: canFetch,
    placeholderData: keepPreviousData,
  })

  const personUtilMap = useMemo(() => {
    const m = new Map<string, { pct: number; confirm: number; mh: number }>()
    for (const p of q.data?.utilization.byPerson ?? []) {
      m.set(p.idwkctr, {
        pct: p.utilizationPercent,
        confirm: p.confirmHours,
        mh: p.manhourHours,
      })
      m.set(p.wkctr, {
        pct: p.utilizationPercent,
        confirm: p.confirmHours,
        mh: p.manhourHours,
      })
    }
    return m
  }, [q.data?.utilization.byPerson])

  const team = q.data?.utilization.team
  const range = q.data?.range

  const utilRangeHint = range
    ? [
        t('hr.calcRange', { from: range.fromDate, to: range.toDate }),
        q.data?.utilization.manhourWorkdayFrom && q.data?.utilization.manhourWorkdayTo
          ? t('hr.dbRange', {
              from: q.data.utilization.manhourWorkdayFrom,
              to: q.data.utilization.manhourWorkdayTo,
            })
          : null,
      ]
        .filter(Boolean)
        .join(' · ')
    : undefined

  if (!canRead) {
    return (
      <AppPageShell title={t('hr.title')} description={t('hr.description', { wc: '—' })}>
        <EmptyState
          icon={AlertCircle}
          title={t('hr.noAccess')}
          description={
            <>
              {tc('rbac.requiresPermission')}{' '}
              <code className="text-xs">manhours.read</code>
            </>
          }
        />
      </AppPageShell>
    )
  }

  if (!auth?.wkctr?.trim() && auth?.userst !== 'A') {
    return (
      <AppPageShell title={t('hr.title')} description={t('hr.description', { wc: '—' })}>
        <EmptyState
          title={t('hr.needWcTitle')}
          description={t('hr.needWcDesc')}
        />
      </AppPageShell>
    )
  }

  return (
    <AppPageShell
      title={t('hr.title')}
      description={t('hr.description', { wc: wkctrLabel })}
      hints={hintsFromT(t, 'hr.hints')}
      headerActions={
        <>
          <Badge variant="secondary" className="gap-1 text-xs">
            <Printer className="size-3.5" aria-hidden />
            {t('hr.badgeRows', { count: q.data?.totalRows ?? 0 })}
          </Badge>
          {team ? (
            <Badge variant="secondary" className="text-xs">
              {t('hr.badgeTeamUtil', { pct: team.utilizationPercent.toFixed(1) })}
            </Badge>
          ) : null}
          <Button variant="outline" size="sm" asChild>
            <Link to="/summary-weekly">{t('hr.navEngUtil')}</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/manhours">{t('hr.navManhours')}</Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void q.refetch()}
            disabled={q.isFetching}
          >
            <RefreshCcw className={`mr-1 size-3.5 ${q.isFetching ? 'animate-spin' : ''}`} aria-hidden />
            {t('hr.refresh')}
          </Button>
        </>
      }
    >
      <AppPageSection index={0}>
        <AppPageSectionCard
          icon={CalendarDays}
          title={t('hr.dateSectionTitle')}
          description={t('hr.dateSectionDesc')}
        >
          <ReportsDateFilter
            key={`${submitted.from}-${submitted.to}`}
            initial={submitted}
            onSearch={setSubmitted}
          />
          <p className="mt-3 text-caption text-app-muted">
            {t('hr.rangeSelected', { from: submitted.from, to: submitted.to })}
          </p>
        </AppPageSectionCard>
      </AppPageSection>

      <AppPageSection index={1}>
        {q.isLoading && !q.data ? (
          <Skeleton className="h-40 w-full rounded-card" />
        ) : q.isError ? (
          <EmptyState
            icon={AlertCircle}
            title={t('hr.loadFailed')}
            description={(q.error as Error).message}
            action={{ label: tc('actions.retry'), onClick: () => void q.refetch() }}
          />
        ) : !q.data ? (
          <EmptyState title={t('hr.empty')} description={t('hr.emptyHint')} />
        ) : team ? (
          <AppPageSectionCard
            icon={LineChart}
            title={t('hr.utilSectionTitle')}
            description={t('hr.utilSectionDesc')}
          >
            {utilRangeHint ? (
              <p className="mb-3 text-caption text-app-muted">{utilRangeHint}</p>
            ) : null}
            <div className="grid gap-3 sm:grid-cols-3">
              <AppCard pad="compact">
                <div className="text-xs text-app-muted">{t('hr.teamUtil')}</div>
                <div className="mt-1 text-2xl font-semibold tabular-nums app-tone-info-strong">
                  {team.utilizationPercent.toFixed(2)}%
                </div>
                <p className="mt-1 text-xs text-app-muted">
                  {t('hr.teamUtilHint', {
                    confirm: team.confirmHours.toFixed(1),
                    hr: team.manhourHours.toFixed(1),
                  })}
                </p>
              </AppCard>
              <AppCard pad="compact">
                <div className="text-xs text-app-muted">{t('hr.teamConfirm')}</div>
                <div className="mt-1 text-2xl font-semibold tabular-nums">
                  {team.confirmHours.toFixed(1)}
                </div>
              </AppCard>
              <AppCard pad="compact">
                <div className="text-xs text-app-muted">{t('hr.teamHr')}</div>
                <div className="mt-1 text-2xl font-semibold tabular-nums">
                  {team.manhourHours.toFixed(1)}
                </div>
              </AppCard>
            </div>
          </AppPageSectionCard>
        ) : null}
      </AppPageSection>

      {q.data ? (
        <>
          <AppPageSection index={2}>
            <AppPageSectionCard
              icon={Users}
              title={t('hr.byPersonTitle')}
              description={t('hr.byPersonHint')}
              bodyClassName="!p-0"
            >
              <div className="app-table-shell overflow-x-auto">
                <Table embedded stickyHeader zebra>
                  <TableHeader>
                    <TableRow>
                      <TableHead className={cn(tableStickyClass(1), 'min-w-[5.5rem]')}>
                        {t('hr.colWc')}
                      </TableHead>
                      <TableHead>{t('page.colName')}</TableHead>
                      <TableHead className="text-right">{t('hr.colConfirm')}</TableHead>
                      <TableHead className="text-right">{t('hr.colHr')}</TableHead>
                      <TableHead className="text-right">{t('hr.colUtil')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {q.data.utilization.byPerson.length ? (
                      q.data.utilization.byPerson.map((p) => (
                        <TableRow key={p.idwkctr}>
                          <TableCell
                            className={cn('font-mono text-body-sm', tableStickyClass(1), 'min-w-[5.5rem]')}
                          >
                            {p.wkctr}
                          </TableCell>
                          <TableCell>{p.displayName ?? '—'}</TableCell>
                          <TableCell className="text-right tabular-nums">
                            {p.confirmHours.toFixed(1)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {p.manhourHours.toFixed(1)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums font-medium app-tone-warning-strong">
                            {p.utilizationPercent.toFixed(2)}%
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="p-0">
                          <EmptyState
                            className="border-0 bg-transparent py-8"
                            title={t('hr.byPersonEmpty')}
                            description={t('hr.byPersonEmptyHint')}
                          />
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </AppPageSectionCard>
          </AppPageSection>

          <AppPageSection index={3}>
            <AppPageSectionCard
              icon={Table2}
              title={t('hr.dailyTitle')}
              description={t('hr.dailySectionDesc')}
              bodyClassName="!p-0"
            >
              <div className="app-table-shell overflow-x-auto">
                <Table embedded stickyHeader zebra>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-14">{t('hr.colSeq')}</TableHead>
                      <TableHead>{t('hr.colWorkDate')}</TableHead>
                      <TableHead>{t('page.colName')}</TableHead>
                      <TableHead>{t('hr.colPosition')}</TableHead>
                      <TableHead className="text-right">WH</TableHead>
                      <TableHead className="text-right">OT1</TableHead>
                      <TableHead className="text-right">OT1.5</TableHead>
                      <TableHead className="text-right">OT1HOL</TableHead>
                      <TableHead className="text-right">OT2</TableHead>
                      <TableHead className="text-right">OT3</TableHead>
                      <TableHead className="text-right">{t('hr.colSummary')}</TableHead>
                      <TableHead className="text-right">{t('hr.colOtNet')}</TableHead>
                      <TableHead className="text-right">{t('hr.colUtil')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {arrayLength(q.data.items) ? (
                      (q.data.items ?? []).map((row, i) => {
                        const u =
                          personUtilMap.get(row.idwkctr) ??
                          (row.wkctr ? personUtilMap.get(row.wkctr) : undefined)
                        return (
                          <TableRow key={row.idmanhour}>
                            <TableCell>{i + 1}</TableCell>
                            <TableCell>{formatManhourDate(row.endDate, row.workday)}</TableCell>
                            <TableCell className="min-w-[10rem]">
                              {row.displayName?.trim() || row.idwkctr}
                            </TableCell>
                            <TableCell>{row.position?.trim() || '—'}</TableCell>
                            <TableCell className="text-right">
                              <HourCell value={row.wh} />
                            </TableCell>
                            <TableCell className="text-right">
                              <HourCell value={row.ot1} />
                            </TableCell>
                            <TableCell className="text-right">
                              <HourCell value={row.ot15} />
                            </TableCell>
                            <TableCell className="text-right">
                              <HourCell value={row.ot1hol} />
                            </TableCell>
                            <TableCell className="text-right">
                              <HourCell value={row.ot2} />
                            </TableCell>
                            <TableCell className="text-right">
                              <HourCell value={row.ot3} />
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              <HourCell value={row.total} />
                            </TableCell>
                            <TableCell className="text-right">
                              <HourCell value={manhourOtNet(row)} />
                            </TableCell>
                            <TableCell className="text-right tabular-nums app-tone-warning-strong">
                              {u ? `${u.pct.toFixed(2)}%` : '—'}
                            </TableCell>
                          </TableRow>
                        )
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={13} className="p-0">
                          <EmptyState
                            className="border-0 bg-transparent py-10"
                            title={t('hr.dailyEmpty')}
                            description={t('hr.dailyEmptyHint')}
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
