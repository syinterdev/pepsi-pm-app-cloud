import { arrayLength } from '@/lib/coerce-array'
import { AppCard } from '@/components/layout/AppCard'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Label } from '@/components/ui/label'
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { fetchManhourHrConfirmReport } from '@/lib/api-public'
import {
  currentPepsiWorkWeekLabel,
  defaultHrConfirmMonth,
  type HrConfirmPeriod,
  pepsiWeekSelectOptions,
} from '@/lib/manhour-hr-confirm-period'
import { cn } from '@/lib/utils'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { ArcElement, Chart as ChartJS, Legend, Title, Tooltip } from 'chart.js'
import { AlertCircle, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pie } from 'react-chartjs-2'
import { motion, useReducedMotion } from 'framer-motion'

ChartJS.register(ArcElement, Title, Tooltip, Legend)

function formatThaiDot(iso: string) {
  const [y, m, d] = iso.split('-')
  if (!y || !m || !d) return iso
  return `${d}.${m}.${y}`
}

function HourCell({ value }: { value: number }) {
  if (value <= 0) return <span className="text-app-muted">—</span>
  return <span className="tabular-nums">{value.toFixed(1)}</span>
}

function pieFromTotals(
  totals: {
    wh: number
    ot1: number
    ot15: number
    ot1hol: number
    ot2: number
    ot3: number
    confirmHours: number
  },
  otHolidayLabel: string,
) {
  const labels = ['WH', 'OT1', 'OT1.5', otHolidayLabel, 'OT2', 'OT3', 'Confirm']
  const values = [
    totals.wh,
    totals.ot1,
    totals.ot15,
    totals.ot1hol,
    totals.ot2,
    totals.ot3,
    totals.confirmHours,
  ]
  return {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: [
          'rgba(24,24,27,0.9)',
          'rgba(63,63,70,0.9)',
          'rgba(113,113,122,0.9)',
          'rgba(161,161,170,0.9)',
          'rgba(212,212,216,0.9)',
          'rgba(228,228,231,0.9)',
          'rgba(34,197,94,0.85)',
        ],
      },
    ],
  }
}

type Props = {
  enabled: boolean
}

export function ManhourHrConfirmPanel({ enabled }: Props) {
  const { t } = useTranslation('manhours')
  const { t: tc } = useTranslation('common')
  const reducedMotion = useReducedMotion()
  const [period, setPeriod] = useState<HrConfirmPeriod>('month')
  const [month, setMonth] = useState(defaultHrConfirmMonth)
  const [week, setWeek] = useState(currentPepsiWorkWeekLabel)
  const [submitted, setSubmitted] = useState(() => ({
    period: 'month' as HrConfirmPeriod,
    month: defaultHrConfirmMonth(),
    week: currentPepsiWorkWeekLabel(),
  }))

  const weekOptions = useMemo(() => pepsiWeekSelectOptions(24), [])

  const q = useQuery({
    queryKey: ['manhours', 'chart', 'hr-confirm', submitted],
    queryFn: () =>
      fetchManhourHrConfirmReport({
        period: submitted.period,
        month: submitted.period === 'month' ? submitted.month : undefined,
        week: submitted.period === 'week' ? submitted.week : undefined,
      }),
    enabled,
    placeholderData: keepPreviousData,
  })

  const pieData = useMemo(
    () => (q.data ? pieFromTotals(q.data.totals, t('hrConfirm.pieOtHoliday')) : null),
    [q.data, t],
  )

  const rangeLabel = q.data
    ? `${formatThaiDot(q.data.range.fromDate)} – ${formatThaiDot(q.data.range.toDate)}`
    : ''

  const apply = () => {
    setSubmitted({ period, month, week })
  }

  return (
    <div className="space-y-4">
      <motion.div
        initial={reducedMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        <AppCard
          pad="compact"
          className={[
            'border-app/75 shadow-[var(--app-shadow-card)]',
            'bg-gradient-to-b from-[var(--app-surface)] to-[color-mix(in_srgb,var(--app-bg)_18%,var(--app-surface))]',
          ].join(' ')}
        >
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label>{t('hrConfirm.viewLabel')}</Label>
            <Tabs
              value={period}
              onValueChange={(v) => setPeriod(v as HrConfirmPeriod)}
            >
              <TabsList className="h-9">
                <TabsTrigger value="month" className="text-xs">
                  {t('hrConfirm.viewMonth')}
                </TabsTrigger>
                <TabsTrigger value="week" className="text-xs">
                  {t('hrConfirm.viewWeek')}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          {period === 'month' ? (
            <div className="space-y-1">
              <Label htmlFor="hr-confirm-month">{t('hrConfirm.month')}</Label>
              <input
                id="hr-confirm-month"
                type="month"
                className="flex h-9 rounded-button border border-app bg-[var(--app-surface)] px-3 text-body-sm shadow-sm"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              />
            </div>
          ) : (
            <div className="space-y-1">
              <Label htmlFor="hr-confirm-week">{t('hrConfirm.week')}</Label>
              <select
                id="hr-confirm-week"
                className="flex h-9 min-w-[16rem] rounded-button border border-app bg-[var(--app-surface)] px-3 text-body-sm shadow-sm"
                value={week}
                onChange={(e) => setWeek(e.target.value)}
              >
                {weekOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          <Button type="button" onClick={apply}>
            <Search className="mr-2 size-4" aria-hidden />
            {tc('actions.search')}
          </Button>
        </div>
        </AppCard>
      </motion.div>

      {q.isLoading && !q.data ? (
        <Skeleton className="h-96 w-full rounded-card" />
      ) : q.isError ? (
        <EmptyState
          icon={AlertCircle}
          title={t('hrConfirm.loadFailed')}
          description={(q.error as Error).message}
          action={{ label: tc('actions.retry'), onClick: () => void q.refetch() }}
        />
      ) : q.data ? (
        <>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
            <motion.div
              initial={reducedMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <AppCard
                pad="compact"
                className={[
                  'overflow-x-auto border-app/75 shadow-[var(--app-shadow-card)]',
                  'bg-gradient-to-b from-[var(--app-surface)] to-[color-mix(in_srgb,var(--app-bg)_18%,var(--app-surface))]',
                ].join(' ')}
              >
              <p className="mb-3 text-body-sm font-medium text-app">
                {q.data.periodLabel}
                <span className="ml-2 font-normal text-app-muted">({rangeLabel})</span>
              </p>
              <div className="app-table-shell overflow-x-auto">
                <Table embedded stickyHeader zebra>
                  <TableHeader>
                    <TableRow>
                      <TableHead className={cn(tableStickyClass(1), 'min-w-[5rem]')}>
                        {t('hrConfirm.colTechCode')}
                      </TableHead>
                      <TableHead className="min-w-[8rem]">{t('page.colName')}</TableHead>
                      <TableHead className="text-right">WH</TableHead>
                      <TableHead className="text-right">OT1</TableHead>
                      <TableHead className="text-right">OT1.5</TableHead>
                      <TableHead className="text-right">OT1HOL</TableHead>
                      <TableHead className="text-right">OT2</TableHead>
                      <TableHead className="text-right">OT3</TableHead>
                      <TableHead className="text-right">{t('hrConfirm.colHrTotal')}</TableHead>
                      <TableHead className="text-right">{t('hrConfirm.colConfirm')}</TableHead>
                      <TableHead className="text-right">%</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {arrayLength(q.data.rows) === 0 ? (
                      <TableRow>
                        <TableCell colSpan={11} className="p-0">
                          <EmptyState
                            className="border-0 bg-transparent py-10"
                            title={t('hrConfirm.empty')}
                          />
                        </TableCell>
                      </TableRow>
                    ) : (
                      <>
                        {q.data.rows.map((row) => (
                          <TableRow
                            key={row.idwkctr}
                            className="transition-colors motion-safe:hover:bg-[color-mix(in_srgb,var(--app-accent)_9%,transparent)]"
                          >
                            <TableCell className="font-medium tabular-nums">{row.wkctr}</TableCell>
                            <TableCell>{row.displayName ?? '—'}</TableCell>
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
                            <TableCell className="text-right font-medium tabular-nums">
                              {row.totalManhours.toFixed(1)}
                            </TableCell>
                            <TableCell className="text-right font-medium tabular-nums app-tone-success-strong">
                              {row.confirmHours.toFixed(1)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {row.totalManhours > 0
                                ? `${row.utilizationPercent.toFixed(1)}%`
                                : '—'}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-app-muted/60 font-semibold">
                          <TableCell colSpan={2}>{t('hrConfirm.totalRow')}</TableCell>
                          <TableCell className="text-right tabular-nums">
                            {q.data.totals.wh.toFixed(1)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {q.data.totals.ot1.toFixed(1)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {q.data.totals.ot15.toFixed(1)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {q.data.totals.ot1hol.toFixed(1)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {q.data.totals.ot2.toFixed(1)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {q.data.totals.ot3.toFixed(1)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {(
                              q.data.totals.wh +
                              q.data.totals.ot1 +
                              q.data.totals.ot15 +
                              q.data.totals.ot1hol +
                              q.data.totals.ot2 +
                              q.data.totals.ot3
                            ).toFixed(1)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums app-tone-success-strong">
                            {q.data.totals.confirmHours.toFixed(1)}
                          </TableCell>
                          <TableCell />
                        </TableRow>
                      </>
                    )}
                  </TableBody>
                </Table>
              </div>
              </AppCard>
            </motion.div>

            {pieData ? (
              <motion.div
                initial={reducedMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1], delay: 0.04 }}
                className="lg:sticky lg:top-4"
              >
                <AppCard
                  pad="compact"
                  className={[
                    'border-app/75 shadow-[var(--app-shadow-card)]',
                    'bg-gradient-to-b from-[var(--app-surface)] to-[color-mix(in_srgb,var(--app-bg)_18%,var(--app-surface))]',
                  ].join(' ')}
                >
                  <Pie
                    data={pieData}
                    options={{
                      responsive: true,
                      plugins: {
                        title: {
                          display: true,
                          text: t('hrConfirm.pieTitle', { range: rangeLabel }),
                        },
                        legend: { position: 'bottom' },
                      },
                      animation: reducedMotion ? false : undefined,
                    }}
                  />
                </AppCard>
              </motion.div>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  )
}
