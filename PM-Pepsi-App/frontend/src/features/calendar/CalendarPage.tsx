import { CanPermission } from '@/components/auth/CanPermission'
import { AppPageContent } from '@/components/layout/AppPageContent'
import { FilterDetailSummary } from '@/components/scheduling/FilterDetailSummary'
import { FilterMultiSelect } from '@/components/scheduling/FilterMultiSelect'
import { ManhourSummaryDialog } from '@/components/scheduling/ManhourSummaryDialog'
import { MonthFullCalendar } from '@/components/scheduling/MonthFullCalendar'
import { MovePlanDialog } from '@/components/scheduling/MovePlanDialog'
import { SchedulingViewControls } from '@/components/scheduling/SchedulingLegends'
import {
  FilterDateField,
  SchedulingFilterDateRow,
  SchedulingFilterGrid,
  SchedulingFilterShell,
} from '@/components/scheduling/SchedulingFilterLayout'
import {
  SchedulingCalendarPanel,
  SchedulingFilterActions,
  SchedulingPageHeader,
  SchedulingPageSection,
  SchedulingPageStack,
  schedulingHeroBadgeClass,
  schedulingHeroLinkBtnClass,
  schedulingHeroLinkIconClass,
} from '@/components/scheduling/SchedulingPageLayout'
import { WorkOrderDetailDialog } from '@/components/scheduling/WorkOrderDetailDialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { QueryLoadErrorState } from '@/components/ui/query-load-error'
import { Skeleton } from '@/components/ui/skeleton'
import {
  fetchCalendarFilterOptions,
  postCalendarEvents,
  postCalendarFilterDetail,
} from '@/lib/api-public'
import { usePermission } from '@/lib/use-permission'
import type { ScheduleCalendarEvent } from '@/lib/schedule-calendar'
import { zodResolver } from '@hookform/resolvers/zod'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { AlertCircle, CalendarDays, CalendarRange } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import {
  ddMmYyyyToIsoDate,
  todayDdMmYyyy,
} from '@/lib/personnel-close-format'
import { woPmPhaseSchema } from '@/api/schemas'
import { withDisplayStatusColors } from '@/lib/calendar-display-status'
import { formatCalendarMonthLabel } from '@/lib/format-month-label'
import type { ActivityDisplayMode } from '@/components/scheduling/CalendarColorLegend'
import { useAppLocale } from '@/providers/I18nProvider'
import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'

const calendarFilterFormSchema = z.object({
  activity: z.array(z.string()),
  wktype: z.array(z.string()),
  status: z.array(z.string()),
  displayStatus: z.array(z.string()),
  pmPhase: z.array(woPmPhaseSchema),
  wkctr: z.array(z.string()),
  team: z.array(z.string()),
  functionalloc: z.array(z.string()),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  wcStartDate: z.string().optional(),
  wcEndDate: z.string().optional(),
  wcStartTime: z.string().optional(),
  wcEndTime: z.string().optional(),
})

type CalendarFilterForm = z.infer<typeof calendarFilterFormSchema>

function countActiveCalendarFilters(f: CalendarFilterForm): number {
  const arrayFields: (keyof CalendarFilterForm)[] = [
    'activity',
    'wktype',
    'status',
    'displayStatus',
    'pmPhase',
    'wkctr',
    'team',
    'functionalloc',
  ]
  let n = arrayFields.reduce((sum, key) => sum + (f[key]?.length ?? 0), 0)
  if (f.fromDate?.trim()) n += 1
  if (f.toDate?.trim()) n += 1
  return n
}

function calendarFilterCollapsedHint(
  f: CalendarFilterForm,
  t: TFunction<'scheduling'>,
): string | undefined {
  const n = countActiveCalendarFilters(f)
  if (n === 0) return undefined
  return t('filters.activeCount', { count: n })
}

export function CalendarPage() {
  const { t } = useTranslation('scheduling')
  const { t: tc } = useTranslation('common')
  const { locale } = useAppLocale()
  const canRead = usePermission('calendar.read')
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [detailTarget, setDetailTarget] = useState<{ id: string; date: string } | null>(null)
  const [moveTarget, setMoveTarget] = useState<{
    idiw37: string
    wkorder: string
    date: string
    moveReasonRequired: boolean
  } | null>(null)
  const [mhOpen, setMhOpen] = useState(false)
  const [mhFrom, setMhFrom] = useState('')
  const [mhTo, setMhTo] = useState('')

  const params = useParams()
  const [sp] = useSearchParams()
  const wkctrFromUrl = useMemo(() => {
    const fromPath = String(params.code ?? '').trim()
    const fromQuery = String(sp.get('wkctr') ?? '').trim()
    return (fromPath || fromQuery).trim()
  }, [params.code, sp])

  const form = useForm<CalendarFilterForm>({
    resolver: zodResolver(calendarFilterFormSchema),
    defaultValues: {
      activity: [],
      wktype: [],
      status: [],
      displayStatus: [],
      pmPhase: [],
      wkctr: [],
      team: [],
      functionalloc: [],
      fromDate: '',
      toDate: '',
      wcStartDate: todayDdMmYyyy(),
      wcEndDate: todayDdMmYyyy(),
      wcStartTime: '00:00',
      wcEndTime: '00:00',
    },
  })

  const [submittedFilters, setSubmittedFilters] = useState<CalendarFilterForm>({
    activity: [],
    wktype: [],
    status: [],
    displayStatus: [],
    pmPhase: [],
    wkctr: [],
    team: [],
    functionalloc: [],
    fromDate: '',
    toDate: '',
    wcStartDate: todayDdMmYyyy(),
    wcEndDate: todayDdMmYyyy(),
    wcStartTime: '00:00',
    wcEndTime: '00:00',
  })
  const [activityDisplay, setActivityDisplay] = useState<ActivityDisplayMode>('all')

  const optsQ = useQuery({
    queryKey: ['calendar', 'filter-options', 'activity-z1z2z5', 'maint-act-zb02', 'team-ab-ee-ut', 'syst-teco'],
    queryFn: fetchCalendarFilterOptions,
    enabled: canRead,
    staleTime: 300_000,
  })

  const filtersKey = JSON.stringify({ submittedFilters, activityDisplay })

  const calendarSearchBody = useMemo(() => {
    const activity =
      activityDisplay === 'all'
        ? submittedFilters.activity
        : [activityDisplay]
    return {
      year,
      month,
      activity,
      wktype: submittedFilters.wktype,
      status: submittedFilters.status,
      displayStatus: submittedFilters.displayStatus,
      pmPhase: submittedFilters.pmPhase,
      wkctr: submittedFilters.wkctr,
      team: submittedFilters.team,
      functionalloc: submittedFilters.functionalloc,
      priority: [],
      equipment: [],
      fromDate: submittedFilters.fromDate?.trim() ? submittedFilters.fromDate.trim() : undefined,
      toDate: submittedFilters.toDate?.trim() ? submittedFilters.toDate.trim() : undefined,
    }
  }, [year, month, submittedFilters, activityDisplay])

  const q = useQuery({
    queryKey: ['calendar', 'events', year, month, filtersKey],
    queryFn: () => postCalendarEvents(calendarSearchBody),
    enabled: canRead,
    placeholderData: keepPreviousData,
  })

  const filterDetailQ = useQuery({
    queryKey: ['calendar', 'filter-detail', year, month, filtersKey],
    queryFn: () => postCalendarFilterDetail(calendarSearchBody),
    enabled: canRead,
    placeholderData: keepPreviousData,
  })

  const clearFilters = () => {
    const empty: CalendarFilterForm = {
      activity: [],
      wktype: [],
      status: [],
      displayStatus: [],
      pmPhase: [],
      wkctr: [],
      team: [],
      functionalloc: [],
      fromDate: '',
      toDate: '',
      wcStartDate: todayDdMmYyyy(),
      wcEndDate: todayDdMmYyyy(),
      wcStartTime: '00:00',
      wcEndTime: '00:00',
    }
    form.reset(empty)
    setSubmittedFilters(empty)
  }

  const onSearch = form.handleSubmit((data) => {
    const wcStartIso = ddMmYyyyToIsoDate(data.wcStartDate?.trim() ?? '')
    const wcEndIso = ddMmYyyyToIsoDate(data.wcEndDate?.trim() ?? '')
    const useWcRange = data.wkctr.length > 0 && Boolean(wcStartIso && wcEndIso)
    const fromIso = useWcRange ? wcStartIso : data.fromDate?.trim() || ''
    const toIso = useWcRange ? wcEndIso : data.toDate?.trim() || ''
    const next: CalendarFilterForm = {
      ...data,
      fromDate: fromIso,
      toDate: toIso,
    }
    setSubmittedFilters(next)
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fromIso)
    if (m) {
      const y = Number(m[1])
      const mm = Number(m[2])
      if (Number.isFinite(y) && Number.isFinite(mm) && mm >= 1 && mm <= 12) {
        setYear(y)
        setMonth(mm)
      }
    }
  })

  useEffect(() => {
    if (!wkctrFromUrl) return
    const current = form.getValues('wkctr') ?? []
    if (current.length === 1 && current[0] === wkctrFromUrl) return
    form.setValue('wkctr', [wkctrFromUrl], { shouldDirty: true })
    const today = todayDdMmYyyy()
    setSubmittedFilters((prev) => ({
      ...prev,
      wkctr: [wkctrFromUrl],
      wcStartDate: prev.wcStartDate || today,
      wcEndDate: prev.wcEndDate || today,
    }))
  }, [form, wkctrFromUrl])

  const openMove = (event: ScheduleCalendarEvent, date: string) => {
    if (event.canMovePlan === false) {
      toast.error(t('calendar.planNotMovable'))
      return
    }
    setMoveTarget({
      idiw37: event.id,
      wkorder: event.orderId ?? event.title,
      date,
      moveReasonRequired: event.moveReasonRequired !== false,
    })
  }

  const displayStatusOptions = useMemo(
    () => withDisplayStatusColors(optsQ.data?.displayStatuses ?? []),
    [optsQ.data?.displayStatuses],
  )

  const eventCount = q.data?.items?.length ?? 0
  const monthLabel = formatCalendarMonthLabel(month, year, locale)
  const filterCollapsedHint = useMemo(
    () => calendarFilterCollapsedHint(submittedFilters, t),
    [submittedFilters, t],
  )

  if (!canRead) {
    return (
      <SchedulingPageHeader title={t('calendar.title')} icon={CalendarRange}>
        <AppPageContent>
          <EmptyState
            icon={AlertCircle}
            title={t('calendar.noAccess')}
            description={
              <>
                {t('calendar.noAccessHint')} <code className="text-xs">calendar.read</code>
              </>
            }
          />
        </AppPageContent>
      </SchedulingPageHeader>
    )
  }

  return (
    <>
      <SchedulingPageHeader
        title={t('calendar.title')}
        icon={CalendarRange}
        badge={
          <Badge
            variant="outline"
            className={schedulingHeroBadgeClass}
          >
            {monthLabel}
          </Badge>
        }
        hints={[
          t('calendar.hints.filter'),
          t('calendar.hints.drag'),
          t('calendar.hints.wo'),
          t('calendar.hints.hours'),
        ]}
      >
        <CanPermission permission="planning.read">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={schedulingHeroLinkBtnClass}
            asChild
          >
            <Link to="/plan-calendar">
              <CalendarDays className={schedulingHeroLinkIconClass} aria-hidden />
              {t('calendar.planCalendarLink')}
            </Link>
          </Button>
        </CanPermission>
      </SchedulingPageHeader>

      <AppPageContent className="scheduling-page pb-8">
        <SchedulingPageStack>
          <SchedulingPageSection index={0}>
            <form onSubmit={onSearch}>
              <SchedulingFilterShell
                title={t('filters.title')}
                collapsible
                defaultOpen={false}
                collapsedHint={filterCollapsedHint}
                actions={
                  <SchedulingFilterActions
                    onClear={clearFilters}
                    submitLabel={t('filters.search')}
                    clearLabel={t('filters.clear')}
                  />
                }
              >
                {optsQ.isLoading ? (
                  <Skeleton
                    className="h-32 w-full rounded-card"
                    aria-label={t('filters.loading')}
                  />
                ) : optsQ.isError ? (
                  <EmptyState
                    icon={AlertCircle}
                    title={t('filters.loadFailed')}
                    description={
                      optsQ.error instanceof Error
                        ? optsQ.error.message
                        : t('filters.genericError')
                    }
                    action={{ label: tc('actions.retry'), onClick: () => void optsQ.refetch() }}
                  />
                ) : (
                  <>
                    <SchedulingFilterGrid className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                      <Controller
                        name="pmPhase"
                        control={form.control}
                        render={({ field }) => (
                          <FilterMultiSelect
                            label={t('filters.labels.pmPhase')}
                            options={optsQ.data?.pmPhases ?? []}
                            value={field.value}
                            onChange={field.onChange}
                          />
                        )}
                      />
                      <Controller
                        name="functionalloc"
                        control={form.control}
                        render={({ field }) => (
                          <FilterMultiSelect
                            label={t('filters.labels.fl')}
                            options={optsQ.data?.functionals ?? []}
                            value={field.value}
                            onChange={field.onChange}
                          />
                        )}
                      />
                      <Controller
                        name="displayStatus"
                        control={form.control}
                        render={({ field }) => (
                          <FilterMultiSelect
                            label={t('filters.labels.woStatus')}
                            options={displayStatusOptions}
                            value={field.value}
                            onChange={field.onChange}
                          />
                        )}
                      />
                      <Controller
                        name="wkctr"
                        control={form.control}
                        render={({ field }) => (
                          <FilterMultiSelect
                            label={t('filters.labels.wkctr')}
                            options={optsQ.data?.workcenters ?? []}
                            value={field.value}
                            onChange={field.onChange}
                            placeholder={t('filters.selectTech')}
                          />
                        )}
                      />
                      <Controller
                        name="wktype"
                        control={form.control}
                        render={({ field }) => (
                          <FilterMultiSelect
                            label={t('filters.labels.wktype')}
                            options={optsQ.data?.wktypes ?? []}
                            value={field.value}
                            onChange={field.onChange}
                          />
                        )}
                      />
                    </SchedulingFilterGrid>

                    <details className="rounded-card border border-app/60 bg-[var(--app-surface)] px-3 py-2">
                      <summary className="cursor-pointer text-xs font-semibold text-app-muted">
                        {t('filters.more')}
                      </summary>
                      <div className="mt-3 space-y-3">
                        <SchedulingFilterGrid className="grid-cols-1 sm:grid-cols-2">
                          <Controller
                            name="team"
                            control={form.control}
                            render={({ field }) => (
                              <FilterMultiSelect
                                label={t('filters.team')}
                                options={optsQ.data?.teams ?? []}
                                value={field.value}
                                onChange={field.onChange}
                              />
                            )}
                          />
                        </SchedulingFilterGrid>
                        {form.watch('wkctr').length > 0 ? (
                          <SchedulingFilterDateRow>
                            <FilterDateField
                              id="calendar-wc-start"
                              label={t('filters.wcFrom')}
                              value={form.watch('wcStartDate') ?? ''}
                              onChange={(v) => form.setValue('wcStartDate', v)}
                            />
                            <FilterDateField
                              id="calendar-wc-end"
                              label={t('filters.wcTo')}
                              value={form.watch('wcEndDate') ?? ''}
                              onChange={(v) => form.setValue('wcEndDate', v)}
                            />
                          </SchedulingFilterDateRow>
                        ) : null}
                      </div>
                    </details>

                    <SchedulingFilterDateRow>
                      <Controller
                        name="fromDate"
                        control={form.control}
                        render={({ field }) => (
                          <FilterDateField
                            id="calendar-from"
                            label={t('filters.fromDate')}
                            value={field.value ?? ''}
                            onChange={field.onChange}
                          />
                        )}
                      />
                      <Controller
                        name="toDate"
                        control={form.control}
                        render={({ field }) => (
                          <FilterDateField
                            id="calendar-to"
                            label={t('filters.toDate')}
                            value={field.value ?? ''}
                            onChange={field.onChange}
                          />
                        )}
                      />
                    </SchedulingFilterDateRow>
                  </>
                )}
              </SchedulingFilterShell>
            </form>
          </SchedulingPageSection>

          <SchedulingPageSection index={1}>
            <SchedulingViewControls
              activityDisplay={activityDisplay}
              onActivityDisplayChange={setActivityDisplay}
              legendMode="work"
              collapsible
              defaultOpen={false}
            />
          </SchedulingPageSection>

          <SchedulingPageSection index={2}>
            <FilterDetailSummary
              title={t('calendar.filterSummaryTitle')}
              data={filterDetailQ.data}
              isLoading={filterDetailQ.isLoading}
              isError={filterDetailQ.isError}
              error={filterDetailQ.error as Error | null}
              isRefreshing={filterDetailQ.isFetching && !filterDetailQ.isLoading}
              collapsible
              defaultOpen={false}
            />
          </SchedulingPageSection>

          <SchedulingPageSection index={3}>
            {q.isLoading && !q.data ? (
              <Skeleton
                className="h-[32rem] w-full rounded-card"
                aria-label={t('calendar.loading')}
              />
            ) : q.isError ? (
              <QueryLoadErrorState
                title={t('calendar.loadFailed')}
                error={q.error}
                description={
                  <>
                    {t('calendar.loadFailedHint')}{' '}
                    <code className="text-xs">calendar.read</code>
                    {q.error instanceof Error ? ` — ${q.error.message}` : null}
                  </>
                }
                action={{ label: tc('actions.retry'), onClick: () => void q.refetch() }}
              />
            ) : (
              <SchedulingCalendarPanel
                title={t('calendar.panelTitle')}
                subtitle={t('calendar.panelSubtitle', { month: monthLabel })}
                eventCount={eventCount}
                isRefreshing={q.isFetching && !q.isLoading}
              >
                <MonthFullCalendar
                  year={year}
                  month={month}
                  viewMode="month-week-day"
                  yearMin={2015}
                  yearMax={2030}
                  events={q.data?.items ?? []}
                  className="scheduling-calendar-widget"
                  onMonthChange={(y, m) => {
                    setYear(y)
                    setMonth(m)
                  }}
                  onRangeSelect={(from, to) => {
                    setMhFrom(from)
                    setMhTo(to)
                    setMhOpen(true)
                  }}
                  onEventClick={(e) => setDetailTarget({ id: e.id, date: e.date })}
                  onEventDrop={(e, newDate) => openMove(e, newDate)}
                />
              </SchedulingCalendarPanel>
            )}
          </SchedulingPageSection>
        </SchedulingPageStack>
      </AppPageContent>

      <WorkOrderDetailDialog
        orderId={detailTarget?.id ?? null}
        contextDate={detailTarget?.date}
        tabLayout="assigned"
        initialTab="task-list"
        onOpenChange={(o) => !o && setDetailTarget(null)}
      />

      <MovePlanDialog
        open={Boolean(moveTarget)}
        onOpenChange={(o) => !o && setMoveTarget(null)}
        idiw37={moveTarget?.idiw37 ?? ''}
        wkorder={moveTarget?.wkorder}
        defaultDate={moveTarget?.date}
        moveReasonRequired={moveTarget?.moveReasonRequired ?? true}
        onSuccess={() => void q.refetch()}
      />

      <ManhourSummaryDialog
        open={mhOpen}
        onOpenChange={setMhOpen}
        fromDate={mhFrom}
        toDate={mhTo}
      />
    </>
  )
}
