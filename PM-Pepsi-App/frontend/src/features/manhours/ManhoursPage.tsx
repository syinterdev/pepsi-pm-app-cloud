/**
 * Manhour charts and performance views */
import { CanPermission } from '@/components/auth/CanPermission'
import { PersonnelAvatar } from '@/components/personnel/PersonnelAvatar'
import { AppCard } from '@/components/layout/AppCard'
import { AppPageSection, AppPageSectionCard, AppPageShell } from '@/components/layout/AppPageShell'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { YearPicker } from '@/components/ui/year-picker'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { fetchManhourChartPerformance, fetchManhourZbByPerson } from '@/lib/api-public'
import { resolveWorkCntr } from '@/lib/wkctr-code'
import { useAnyPermission, usePermission } from '@/lib/use-permission'
import {
  currentPepsiWorkWeekLabel,
  pepsiWeekSelectOptions,
} from '@/lib/manhour-hr-confirm-period'
import {
  resolveManhourPerformanceRange,
  type ManhourPerformancePeriod,
} from '@/lib/manhour-performance-period'
import { canViewTeamManhours } from '@/lib/manhours-team-view'
import { cn } from '@/lib/utils'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { AlertCircle, Search, Users } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ManhourHrConfirmPanel } from './ManhourHrConfirmPanel'
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'framer-motion'
import { animate, type JSAnimation } from 'animejs'

function formatThaiDot(iso: string) {
  const [y, m, d] = iso.split('-')
  if (!y || !m || !d) return iso
  return `${d}.${m}.${y}`
}

function ChartQueryError({
  message,
  onRetry,
}: {
  message: string
  onRetry: () => void
}) {
  const { t } = useTranslation('manhours')
  const { t: tc } = useTranslation('common')
  return (
    <EmptyState
      icon={AlertCircle}
      title={t('page.loadFailed')}
      description={message}
      action={{ label: tc('actions.retry'), onClick: onRetry }}
    />
  )
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 10, filter: 'blur(2px)' },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { delay: i * 0.05, duration: 0.38, ease: [0.22, 1, 0.36, 1] as const },
  }),
}

function todayIso() {
  return format(new Date(), 'yyyy-MM-dd')
}

const periodSelectClass =
  'flex h-11 min-w-[min(100%,18rem)] rounded-button border border-app bg-[var(--app-surface)] px-3 text-body font-medium text-app shadow-sm focus-app-ring focus-visible:outline-none'

export function ManhoursPage() {
  const { t } = useTranslation('manhours')
  const { t: tc } = useTranslation('common')
  const authUser = getStoredAuthUser()
  const canRead = useAnyPermission(['manhours.read', 'manhours.admin'])
  const canAdmin = usePermission('manhours.admin') || authUser?.userst === 'A'
  const canViewTeam = canViewTeamManhours(authUser)
  const thisYear = new Date().getFullYear()
  const reducedMotion = useReducedMotion()

  const [viewPeriod, setViewPeriod] = useState<ManhourPerformancePeriod>('weekly')
  const [day, setDay] = useState(todayIso)
  const [week, setWeek] = useState(currentPepsiWorkWeekLabel())
  const [year, setYear] = useState(thisYear)
  const weekOptions = useMemo(() => pepsiWeekSelectOptions(30), [])
  const yearOptions = useMemo(() => {
    const out: number[] = []
    for (let y = thisYear + 1; y >= thisYear - 6; y -= 1) out.push(y)
    return out
  }, [thisYear])

  const resolvedRange = useMemo(
    () =>
      resolveManhourPerformanceRange({
        period: viewPeriod,
        day,
        week,
        year,
      }),
    [viewPeriod, day, week, year],
  )

  const [submitted, setSubmitted] = useState(resolvedRange)
  const [adminWkctr, setAdminWkctr] = useState('')
  const [activeTab, setActiveTab] = useState('performance')
  const [showZbPeople, setShowZbPeople] = useState(false)
  const [zbPeopleQText, setZbPeopleQText] = useState('')

  useEffect(() => {
    setSubmitted(resolvedRange)
  }, [resolvedRange])

  useEffect(() => {
    if (!canViewTeam) setShowZbPeople(false)
  }, [canViewTeam])

  const chartOpts = {
    from: submitted.from,
    to: submitted.to,
    idwkctr: canAdmin && adminWkctr.trim() ? adminWkctr.trim() : undefined,
  }

  const totalOrdersRef = useRef<HTMLDivElement | null>(null)
  const utilRef = useRef<HTMLDivElement | null>(null)
  const pulseAnimRef = useRef<JSAnimation | null>(null)

  const perfQ = useQuery({
    queryKey: ['manhours', 'chart', 'performance', chartOpts],
    queryFn: () => fetchManhourChartPerformance(chartOpts),
    enabled: canRead,
    placeholderData: keepPreviousData,
  })

  const zbPeopleQ = useQuery({
    queryKey: ['manhours', 'chart', 'zb-by-person', submitted],
    queryFn: () => fetchManhourZbByPerson({ from: submitted.from, to: submitted.to }),
    enabled: canRead && canViewTeam && activeTab === 'performance' && showZbPeople,
    placeholderData: keepPreviousData,
  })
  const zbPeopleRows = (zbPeopleQ.data?.rows ?? []).filter((r) => {
    const q = zbPeopleQText.trim().toLowerCase()
    if (!q) return true
    return (
      String(r.wkctr ?? '')
        .toLowerCase()
        .includes(q) || (r.displayName ?? '').toLowerCase().includes(q)
    )
  })
  const zbPeopleTotals = zbPeopleRows.reduce(
    (acc, r) => ({
      zb01Planned: acc.zb01Planned + r.zb01Planned,
      zb01Confirmed: acc.zb01Confirmed + r.zb01Confirmed,
      zb02Planned: acc.zb02Planned + r.zb02Planned,
      zb02Confirmed: acc.zb02Confirmed + r.zb02Confirmed,
      zb05Planned: acc.zb05Planned + r.zb05Planned,
      zb05Confirmed: acc.zb05Confirmed + r.zb05Confirmed,
    }),
    {
      zb01Planned: 0,
      zb01Confirmed: 0,
      zb02Planned: 0,
      zb02Confirmed: 0,
      zb05Planned: 0,
      zb05Confirmed: 0,
    },
  )

  useEffect(() => {
    if (reducedMotion) return
    if (!perfQ.data) return
    pulseAnimRef.current?.cancel()
    const els = [totalOrdersRef.current, utilRef.current].filter(Boolean) as HTMLElement[]
    if (els.length === 0) return
    pulseAnimRef.current = animate(els, {
      scale: [1, 1.02, 1],
      duration: 420,
      easing: 'easeOutQuad',
      delay: (_el: HTMLElement, i: number) => i * 40,
    })
    return () => {
      pulseAnimRef.current?.cancel()
    }
  }, [perfQ.data, reducedMotion])

  const perf = perfQ.data

  if (!canRead) {
    return (
      <AppPageShell title={t('page.title')} description={t('page.description')}>
        <EmptyState
          icon={AlertCircle}
          title={t('page.noAccess')}
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

  return (
    <AppPageShell
      title={t('page.title')}
      description={t('page.description')}
      hints={[t('page.tabPerformance'), t('page.tabHrVsConfirm'), t('page.filterTitle'), t('page.colName')]}
      headerActions={
        <>
          <CanPermission permission="manhours.read">
            <Button variant="outline" size="sm" asChild>
              <Link to="/manhours-hr">{t('page.navManhourHr')}</Link>
            </Button>
          </CanPermission>
          <CanPermission permission="personnel.read">
            <Button variant="outline" size="sm" asChild>
              <Link to="/personnel">{t('page.navPersonnel')}</Link>
            </Button>
          </CanPermission>
        </>
      }
    >
      <AppPageSection index={0}>
        <AppPageSectionCard
          icon={Search}
          title={t('page.filterTitle')}
          description={t('page.filterDescPeriod')}
        >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Label className="sr-only">{t('page.viewPeriod')}</Label>
            <Tabs
              value={viewPeriod}
              onValueChange={(v) => setViewPeriod(v as ManhourPerformancePeriod)}
            >
              <TabsList className="flex h-auto flex-wrap gap-1 bg-[var(--app-surface-muted)] p-1">
                <TabsTrigger value="daily">{t('worktime.periodDaily')}</TabsTrigger>
                <TabsTrigger value="weekly">{t('worktime.periodWeekly')}</TabsTrigger>
                <TabsTrigger value="yearly">{t('worktime.periodYearly')}</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            {viewPeriod === 'daily' ? (
              <div className="space-y-1">
                <Label htmlFor="mh-day">{t('page.day')}</Label>
                <DatePicker id="mh-day" value={day} onChange={setDay} />
              </div>
            ) : null}

            {viewPeriod === 'weekly' ? (
              <div className="space-y-1">
                <Label htmlFor="mh-week">{t('page.week')}</Label>
                <select
                  id="mh-week"
                  value={week}
                  onChange={(e) => setWeek(e.target.value)}
                  className={periodSelectClass}
                >
                  {weekOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            {viewPeriod === 'yearly' ? (
              <div className="space-y-1">
                <Label htmlFor="mh-year">{t('page.year')}</Label>
                <YearPicker
                  id="mh-year"
                  value={year}
                  years={yearOptions}
                  onChange={setYear}
                />
              </div>
            ) : null}

            {canAdmin ? (
              <div className="space-y-1">
                <Label htmlFor="mh-idwkctr">{t('page.hrAdmin')}</Label>
                <Input
                  id="mh-idwkctr"
                  value={adminWkctr}
                  onChange={(e) => setAdminWkctr(e.target.value)}
                  placeholder={t('page.hrPlaceholder')}
                  className="w-40"
                />
              </div>
            ) : null}

            <Button
              type="button"
              onClick={() => setSubmitted(resolvedRange)}
              disabled={!resolvedRange.from || !resolvedRange.to}
            >
              <Search className="mr-2 size-4" aria-hidden />
              {tc('actions.search')}
            </Button>
          </div>

          <p className="text-body-sm text-app-muted">
            {t('page.periodSummary', {
              label: resolvedRange.periodLabel,
              from: formatThaiDot(resolvedRange.from),
              to: formatThaiDot(resolvedRange.to),
            })}
          </p>
          {!canViewTeam ? (
            <p className="text-body-sm text-app-muted">{t('page.selfOnlyHint')}</p>
          ) : null}
        </div>
        </AppPageSectionCard>
      </AppPageSection>

      <AppPageSection index={1}>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex h-auto flex-wrap gap-1 bg-[var(--app-surface)] p-1">
          <TabsTrigger value="performance">{t('page.tabPerformance')}</TabsTrigger>
          <TabsTrigger value="breakdown">{t('page.tabHrVsConfirm')}</TabsTrigger>
        </TabsList>

        <div className="mt-4">
          <AnimatePresence mode="wait" initial={false}>
            {activeTab === 'performance' ? (
              <motion.div
                key="performance"
                variants={fadeUp}
                custom={0}
                initial={reducedMotion ? false : 'hidden'}
                animate="show"
                exit={reducedMotion ? undefined : { opacity: 0, y: 6, transition: { duration: 0.18 } }}
                className="space-y-4"
              >
                {perfQ.isLoading && !perfQ.data ? (
                  <Skeleton className="h-80 w-full rounded-card" />
                ) : perfQ.isError ? (
                  <ChartQueryError
                    message={(perfQ.error as Error).message}
                    onRetry={() => void perfQ.refetch()}
                  />
                ) : perf ? (
                  <AppCard
                    pad="default"
                    className={[
                      'border-app/75 shadow-[var(--app-shadow-card)]',
                      'bg-gradient-to-b from-[var(--app-surface)] to-[color-mix(in_srgb,var(--app-bg)_18%,var(--app-surface))]',
                    ].join(' ')}
                  >
                    <p className="text-center text-body-sm font-medium text-app">
                      {submitted.from === submitted.to
                        ? t('page.dateSingle', {
                            date: formatThaiDot(submitted.from),
                            label: submitted.periodLabel,
                          })
                        : t('page.dateRange', {
                            from: perf ? formatThaiDot(perf.range.fromDate) : formatThaiDot(submitted.from),
                            to: perf ? formatThaiDot(perf.range.toDate) : formatThaiDot(submitted.to),
                            label: submitted.periodLabel,
                          })}
                    </p>

                    <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_auto_1fr]">
                      <motion.div
                        variants={fadeUp}
                        custom={1}
                        initial={reducedMotion ? false : 'hidden'}
                        animate="show"
                        className="space-y-3"
                      >
                        <div className="rounded-card bg-[var(--app-text)] px-3 py-2 text-center text-body-sm font-medium text-white shadow-sm">
                          {t('page.totalOrders')}
                        </div>
                        <div
                          ref={totalOrdersRef}
                          className="rounded-card bg-app-muted py-6 text-center text-3xl font-bold tabular-nums shadow-sm ring-1 ring-app/10"
                        >
                          {perf.totalPlannedOrders}
                        </div>
                        <div className="mt-6 rounded-card bg-[var(--app-text)] px-3 py-2 text-center text-body-sm font-medium text-white shadow-sm">
                          {t('page.utilization')}
                        </div>
                        <div
                          ref={utilRef}
                          className="rounded-card bg-app-muted py-6 text-center text-3xl font-bold tabular-nums shadow-sm ring-1 ring-app/10"
                        >
                          {perf.utilizationPercent.toFixed(2)}%
                        </div>
                      </motion.div>

                      <motion.div
                        variants={fadeUp}
                        custom={2}
                        initial={reducedMotion ? false : 'hidden'}
                        animate="show"
                        className="flex flex-col items-center justify-center px-2"
                      >
                        <div className="transition-transform duration-200 motion-safe:hover:-translate-y-0.5">
                          <PersonnelAvatar
                            idwkctr={perf.profile.idwkctr}
                            displayName={perf.profile.displayName}
                            hasImage={perf.profile.hasImage}
                            size="lg"
                            className="size-48 rounded-card border border-app object-cover shadow-sm"
                          />
                        </div>
                        <div className="mt-3 flex max-w-[14rem] flex-col items-center gap-0.5 text-center">
                          <p className="text-body font-semibold tabular-nums">
                            {resolveWorkCntr(perf.profile) ||
                              perf.profile.wkctr ||
                              perf.profile.idwkctr}
                          </p>
                          <p className="text-body-sm text-app-muted">{perf.profile.displayName}</p>
                          {[perf.profile.wkctrtype, perf.profile.position].some(Boolean) ? (
                            <p className="text-xs text-app-muted">
                              {[perf.profile.wkctrtype, perf.profile.position]
                                .filter(Boolean)
                                .join(' — ')}
                            </p>
                          ) : null}
                        </div>
                      </motion.div>

                      <motion.div
                        variants={fadeUp}
                        custom={3}
                        initial={reducedMotion ? false : 'hidden'}
                        animate="show"
                        className="space-y-4"
                      >
                        {perf.zb.length === 0 ? (
                          <EmptyState
                            className="border-0 bg-transparent py-6"
                            title={t('page.noZb')}
                            description={t('page.noZbDesc')}
                          />
                        ) : (
                          perf.zb.map((z, idx) => (
                            <motion.div
                              key={z.wktype}
                              variants={fadeUp}
                              custom={idx}
                              initial={reducedMotion ? false : 'hidden'}
                              animate="show"
                              className="group rounded-card border border-app/60 bg-[var(--app-surface)] p-2 shadow-sm transition-colors motion-safe:hover:border-app/80 motion-safe:hover:bg-[color-mix(in_srgb,var(--app-surface)_88%,var(--app-accent)_12%)]"
                            >
                              <div className="app-tone-success-fill rounded-card px-3 py-2 text-center text-body-sm font-medium shadow-sm">
                                {z.wktype}
                              </div>
                              <div className="mt-1 grid grid-cols-3 gap-1 text-center text-body-sm font-semibold">
                                <div className="rounded bg-app-muted py-3 tabular-nums">
                                  {z.planned}
                                </div>
                                <div className="rounded bg-blue-100 py-3 tabular-nums">
                                  {z.confirmed}
                                </div>
                                <div className="rounded bg-app-muted py-3 tabular-nums">
                                  {z.percent.toFixed(2)}%
                                </div>
                              </div>
                              <div className="mt-1 grid grid-cols-3 gap-1 text-center text-badge text-app-muted">
                                <span>{t('page.legendAssigned')}</span>
                                <span>{t('page.legendConfirm')}</span>
                                <span>{t('page.legendPercent')}</span>
                              </div>
                              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-app-muted">
                                <div className="flex h-full w-full">
                                  <div
                                    className="app-tone-success-strip-fill h-full transition-[width] duration-500 motion-safe:group-hover:duration-300"
                                    style={{ width: `${Math.min(100, Math.max(0, z.percent))}%` }}
                                    title={`% ${z.percent.toFixed(2)}`}
                                  />
                                </div>
                              </div>
                            </motion.div>
                          ))
                        )}
                      </motion.div>
                    </div>

                    <div className="mt-5 flex flex-wrap justify-center gap-2">
                      {canViewTeam ? (
                        <Button
                          type="button"
                          variant={showZbPeople ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setShowZbPeople((s) => !s)}
                        >
                          <Users className="mr-2 size-4" aria-hidden />
                          {t('page.zbByPersonToggle')}
                        </Button>
                      ) : null}
                    </div>

                    {showZbPeople ? (
                      <div className="mt-4">
                        {zbPeopleQ.isLoading && !zbPeopleQ.data ? (
                          <Skeleton className="h-56 w-full rounded-card" />
                        ) : zbPeopleQ.isError ? (
                          <ChartQueryError
                            message={(zbPeopleQ.error as Error).message}
                            onRetry={() => void zbPeopleQ.refetch()}
                          />
                        ) : zbPeopleQ.data ? (
                          <div className="space-y-3">
                            <div className="flex flex-wrap items-end justify-between gap-3">
                              <div className="space-y-1">
                                <Label htmlFor="zb-people-q">{t('page.zbSearchLabel')}</Label>
                                <Input
                                  id="zb-people-q"
                                  value={zbPeopleQText}
                                  onChange={(e) => setZbPeopleQText(e.target.value)}
                                  placeholder={t('page.zbSearchPlaceholder')}
                                  className="h-9 w-56"
                                />
                              </div>
                              <div className="flex flex-wrap gap-2 text-xs">
                                <div className="rounded-card border border-app/60 bg-[var(--app-surface)] px-3 py-2">
                                  <div className="text-app-muted">{t('page.zbTotalsZ1')}</div>
                                  <div className="mt-0.5 font-semibold tabular-nums text-app">
                                    {zbPeopleTotals.zb01Planned} / {zbPeopleTotals.zb01Confirmed}
                                  </div>
                                </div>
                                <div className="rounded-card border border-app/60 bg-[var(--app-surface)] px-3 py-2">
                                  <div className="text-app-muted">{t('page.zbTotalsZ2')}</div>
                                  <div className="mt-0.5 font-semibold tabular-nums text-app">
                                    {zbPeopleTotals.zb02Planned} / {zbPeopleTotals.zb02Confirmed}
                                  </div>
                                </div>
                                <div className="rounded-card border border-app/60 bg-[var(--app-surface)] px-3 py-2">
                                  <div className="text-app-muted">{t('page.zbTotalsZ5')}</div>
                                  <div className="mt-0.5 font-semibold tabular-nums text-app">
                                    {zbPeopleTotals.zb05Planned} / {zbPeopleTotals.zb05Confirmed}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="app-table-shell overflow-x-auto">
                              <Table embedded stickyHeader zebra>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className={cn(tableStickyClass(1), 'bg-[var(--app-surface)]')} />
                                  <TableHead className="bg-[var(--app-surface)]" />
                                  <TableHead colSpan={2} className="bg-[var(--app-surface)] text-center">
                                    Z1
                                  </TableHead>
                                  <TableHead colSpan={2} className="bg-[var(--app-surface)] text-center">
                                    Z2
                                  </TableHead>
                                  <TableHead colSpan={2} className="bg-[var(--app-surface)] text-center">
                                    Z5
                                  </TableHead>
                                </TableRow>
                                <TableRow>
                                  <TableHead
                                    className={cn(tableStickyClass(1), 'min-w-[5.5rem]')}
                                  >
                                    {t('page.colTechCode')}
                                  </TableHead>
                                  <TableHead className="min-w-[10rem]">{t('page.colName')}</TableHead>
                                  <TableHead className="text-right">
                                    {t('page.zbColZ1Assigned')}
                                  </TableHead>
                                  <TableHead className="text-right">{t('page.zbColZ1Done')}</TableHead>
                                  <TableHead className="text-right">
                                    {t('page.zbColZ2Assigned')}
                                  </TableHead>
                                  <TableHead className="text-right">{t('page.zbColZ2Done')}</TableHead>
                                  <TableHead className="text-right">
                                    {t('page.zbColZ5Assigned')}
                                  </TableHead>
                                  <TableHead className="text-right">{t('page.zbColZ5Done')}</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {zbPeopleRows.length === 0 ? (
                                  <TableRow>
                                    <TableCell colSpan={8} className="p-0">
                                      <EmptyState
                                        className="border-0 bg-transparent py-10"
                                        title={t('page.zbEmpty')}
                                      />
                                    </TableCell>
                                  </TableRow>
                                ) : (
                                  zbPeopleRows.map((r) => (
                                    <TableRow key={r.wkctr}>
                                      <TableCell className="font-medium tabular-nums">
                                        {r.wkctr}
                                      </TableCell>
                                      <TableCell>{r.displayName ?? '—'}</TableCell>
                                      <TableCell className="text-right tabular-nums">
                                        {r.zb01Planned}
                                      </TableCell>
                                      <TableCell className="text-right tabular-nums">
                                        {r.zb01Confirmed}
                                      </TableCell>
                                      <TableCell className="text-right tabular-nums">
                                        {r.zb02Planned}
                                      </TableCell>
                                      <TableCell className="text-right tabular-nums">
                                        {r.zb02Confirmed}
                                      </TableCell>
                                      <TableCell className="text-right tabular-nums">
                                        {r.zb05Planned}
                                      </TableCell>
                                      <TableCell className="text-right tabular-nums">
                                        {r.zb05Confirmed}
                                      </TableCell>
                                    </TableRow>
                                  ))
                                )}
                              </TableBody>
                            </Table>
                          </div>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </AppCard>
                ) : (
                  <EmptyState
                    title={t('page.performanceEmpty')}
                    description={t('page.performanceEmptyHint')}
                  />
                )}
              </motion.div>
            ) : (
              <motion.div
                key="breakdown"
                variants={fadeUp}
                custom={0}
                initial={reducedMotion ? false : 'hidden'}
                animate="show"
                exit={reducedMotion ? undefined : { opacity: 0, y: 6, transition: { duration: 0.18 } }}
              >
                <ManhourHrConfirmPanel enabled={canRead && activeTab === 'breakdown'} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Tabs>
      </AppPageSection>
    </AppPageShell>
  )
}
