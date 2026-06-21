import { AppCard } from '@/components/layout/AppCard'
import { arrayLength } from '@/lib/coerce-array'
import { hintsFromT } from '@/lib/i18n-hints'

import { AppPageSection, AppPageSectionCard, AppPageShell } from '@/components/layout/AppPageShell'

import { Badge } from '@/components/ui/badge'

import { Button } from '@/components/ui/button'

import { EmptyState } from '@/components/ui/empty-state'
import { QueryLoadErrorState } from '@/components/ui/query-load-error'

import { Input } from '@/components/ui/input'

import { Label } from '@/components/ui/label'

import { Skeleton } from '@/components/ui/skeleton'
import { TableSkeletonRows } from '@/components/ui/table-skeleton'

import {

  Table,

  TableBody,

  TableCell,

  TableHead,

  TableHeader,

  TableRow,

  tableStickyClass,

} from '@/components/ui/table'

import {

  defaultReportsDateRange,

  ReportsDateFilter,

} from '@/features/reports/ReportsDateFilter'

import { WeekToWeekTable } from '@/features/reports/WeekToWeekTable'

import { fetchActivityLog, fetchKpi } from '@/lib/api-public'

import { usePermission } from '@/lib/use-permission'

import { cn } from '@/lib/utils'

import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { AlertCircle, BarChart3, Search } from 'lucide-react'

import { useQueryLoadErrorToast } from '@/lib/query-load-error'
import { useMemo, useState } from 'react'

import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'



function formatTime(iso: string): string {

  const d = new Date(iso)

  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString('th-TH')

}



function formatWorkWindow(startedAt: string | null, endedAt: string | null): string {

  if (startedAt && endedAt) return `${startedAt} → ${endedAt}`

  if (startedAt) return startedAt

  if (endedAt) return endedAt

  return '—'

}



export function ActivityLogPage() {
  const { t } = useTranslation('reports')
  const { t: tc } = useTranslation('common')
  const canRead = usePermission('reports.read')

  const [submitted, setSubmitted] = useState(() => defaultReportsDateRange(7))

  const [searchQ, setSearchQ] = useState('')

  const [appliedQ, setAppliedQ] = useState('')



  const kpiRange = useMemo(

    () => ({

      ...defaultReportsDateRange(56),

      weeksBack: 8,

    }),

    [],

  )



  const q = useQuery({

    queryKey: ['activity-log', submitted, appliedQ],

    queryFn: () =>

      fetchActivityLog({

        from: submitted.from,

        to: submitted.to,

        q: appliedQ || undefined,

        limit: 200,

        offset: 0,

      }),

    enabled: canRead,

    placeholderData: keepPreviousData,

  })



  const kpiQ = useQuery({

    queryKey: ['reports-kpi', 'activity-log-w2w', kpiRange],

    queryFn: () =>

      fetchKpi({

        from: kpiRange.from,

        to: kpiRange.to,

        weeksBack: kpiRange.weeksBack,

      }),

    enabled: canRead,

    staleTime: 120_000,

  })



  useQueryLoadErrorToast(
    { isError: kpiQ.isError, error: kpiQ.error, data: kpiQ.data },
    t('page.loadFailed'),
  )

  const w2wHint =
    arrayLength(kpiQ.data?.weekToWeek) > 0
      ? t('activity.w2wCollapsed', { count: arrayLength(kpiQ.data?.weekToWeek) })
      : undefined



  if (!canRead) {

    return (

      <AppPageShell title={t('activity.title')} description={t('activity.description')}>

        <EmptyState

          icon={AlertCircle}

          title={t('activity.noAccess')}

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

      title={t('activity.title')}

      description={t('activity.description')}

      hints={hintsFromT(t, 'activity.hints')}

      headerActions={

        <>

          <Badge variant="secondary" className="text-xs">

            {t('activity.badgeMaxRows')}

          </Badge>

          <Button variant="outline" size="sm" asChild>

            <Link to="/reports">{t('activity.navKpi')}</Link>

          </Button>

          <Button variant="outline" size="sm" asChild>

            <Link to="/reports/audit">{t('activity.navAuditor')}</Link>

          </Button>

        </>

      }

    >

      <AppPageSection index={0}>

        <ReportsDateFilter

          key={`${submitted.from}-${submitted.to}`}

          initial={submitted}

          onSearch={setSubmitted}

        />



        <AppPageSectionCard

          icon={Search}

          title={t('activity.searchSection')}

          description={t('activity.searchDesc')}

          bodyClassName="!pt-0"

        >

          <div className="flex flex-wrap items-end gap-3">

            <div className="min-w-[200px] flex-1 space-y-1">

              <Label htmlFor="activity-q">{t('activity.searchLabel')}</Label>

              <Input

                id="activity-q"

                placeholder={t('activity.searchPlaceholder')}

                value={searchQ}

                onChange={(e) => setSearchQ(e.target.value)}

              />

            </div>

            <Button

              type="button"

              onClick={() => setAppliedQ(searchQ.trim())}

              disabled={q.isFetching}

            >

              <Search className="mr-2 size-4" aria-hidden />

              {tc('actions.search')}

            </Button>

          </div>

        </AppPageSectionCard>

      </AppPageSection>



      <AppPageSection index={1}>

        {q.isError && !q.data ? (

          <QueryLoadErrorState

            title={t('activity.loadFailed')}

            error={q.error}

            action={{ label: tc('actions.retry'), onClick: () => void q.refetch() }}

          />

        ) : q.isLoading && !q.data ? (

          <AppCard pad="compact">

            <div className="app-table-shell overflow-x-auto" aria-busy="true">

              <Table embedded stickyHeader zebra>

                <TableHeader>

                  <TableRow>

                    <TableHead className={cn('w-12', tableStickyClass(1))}>#</TableHead>

                    <TableHead className={tableStickyClass(2)}>{t('activity.colLoggedAt')}</TableHead>

                    <TableHead>{t('activity.colPerson')}</TableHead>

                    <TableHead>{t('activity.colJob')}</TableHead>

                    <TableHead>{t('activity.colLine')}</TableHead>

                    <TableHead>WO</TableHead>

                    <TableHead>{t('activity.colResource')}</TableHead>

                    <TableHead>{t('activity.colWindow')}</TableHead>

                    <TableHead>{t('activity.colActivity')}</TableHead>

                    <TableHead>{t('activity.colStatus')}</TableHead>

                  </TableRow>

                </TableHeader>

                <TableBody>

                  <TableSkeletonRows rows={10} columns={10} narrowFirstColumn />

                </TableBody>

              </Table>

            </div>

          </AppCard>

        ) : q.data ? (

          <>

            <p className="text-caption">

              {t('activity.resultCount', {
                shown: arrayLength(q.data.items).toLocaleString(),
                total: q.data.total.toLocaleString(),
                from: submitted.from,
                to: submitted.to,
              })}

            </p>

            <AppCard pad="compact">

              <div className="app-table-shell overflow-x-auto">

                <Table embedded stickyHeader zebra>

                  <TableHeader>

                    <TableRow>

                      <TableHead className={cn('w-12', tableStickyClass(1))}>#</TableHead>

                      <TableHead className={tableStickyClass(2)}>{t('activity.colLoggedAt')}</TableHead>

                      <TableHead>{t('activity.colPerson')}</TableHead>

                      <TableHead>{t('activity.colJob')}</TableHead>

                      <TableHead>{t('activity.colLine')}</TableHead>

                      <TableHead>WO</TableHead>

                      <TableHead>{t('activity.colResource')}</TableHead>

                      <TableHead>{t('activity.colWindow')}</TableHead>

                      <TableHead>{t('activity.colActivity')}</TableHead>

                      <TableHead>{t('activity.colStatus')}</TableHead>

                    </TableRow>

                  </TableHeader>

                  <TableBody>

                    {arrayLength(q.data.items) ? (

                      (q.data.items ?? []).map((row, i) => (

                        <TableRow key={`${row.source}-${row.id}-${row.createdAt}-${i}`}>

                          <TableCell className={tableStickyClass(1)}>{i + 1}</TableCell>

                          <TableCell

                            className={cn(

                              'whitespace-nowrap text-body-sm tabular-nums',

                              tableStickyClass(2),

                            )}

                          >

                            {formatTime(row.createdAt)}

                          </TableCell>

                          <TableCell className="text-body-sm">

                            <span className="font-medium">{row.actorDisplayName ?? '—'}</span>

                            {row.actorId && row.actorId !== row.actorDisplayName ? (

                              <span className="block text-xs text-app-muted">{row.actorId}</span>

                            ) : null}

                          </TableCell>

                          <TableCell className="max-w-[180px] truncate text-body-sm" title={row.jobDetail ?? undefined}>

                            {row.jobDetail ?? '—'}

                          </TableCell>

                          <TableCell className="text-body-sm">{row.productLine ?? '—'}</TableCell>

                          <TableCell className="text-body-sm tabular-nums">

                            {row.workOrder ?? '—'}

                          </TableCell>

                          <TableCell className="text-body-sm">{row.resourceLabel ?? '—'}</TableCell>

                          <TableCell className="whitespace-nowrap text-xs tabular-nums">

                            {formatWorkWindow(row.startedAt, row.endedAt)}

                          </TableCell>

                          <TableCell className="text-body-sm">

                            <span>{row.actionLabel}</span>

                            {row.message ? (

                              <span className="mt-0.5 block max-w-[200px] truncate text-xs text-app-muted">

                                {row.message}

                              </span>

                            ) : null}

                          </TableCell>

                          <TableCell className="text-xs uppercase">{row.status}</TableCell>

                        </TableRow>

                      ))

                    ) : (

                      <TableRow>

                        <TableCell colSpan={10} className="p-0">

                          <EmptyState

                            className="border-0 bg-transparent py-10"

                            title={t('activity.empty')}

                            description={t('activity.emptyHint')}

                          />

                        </TableCell>

                      </TableRow>

                    )}

                  </TableBody>

                </Table>

              </div>

            </AppCard>

          </>

        ) : (

          <EmptyState title={t('activity.emptyPage')} description={t('activity.emptyPageHint')} />

        )}

      </AppPageSection>



      <AppPageSection index={2}>

        <AppPageSectionCard

          icon={BarChart3}

          title={t('activity.w2wTitle')}

          description={t('activity.w2wDesc')}

          collapsible

          defaultOpen={false}

          collapsedHint={w2wHint}

          bodyClassName="space-y-3"

        >

          {kpiQ.isLoading && !kpiQ.data ? (

            <Skeleton className="h-40 w-full rounded-card" />

          ) : kpiQ.isError ? (

            <p className="text-caption text-form-error">{(kpiQ.error as Error).message}</p>

          ) : (

            <>

              <WeekToWeekTable rows={kpiQ.data?.weekToWeek ?? []} />

              <p className="text-caption text-app-muted">

                {t('activity.w2wFullCharts')}{' '}

                <Link to="/reports" className="text-[var(--brand-pepsi-blue)] hover:underline">

                  {t('activity.w2wLinkKpi')}

                </Link>

              </p>

            </>

          )}

        </AppPageSectionCard>

      </AppPageSection>

    </AppPageShell>

  )

}


