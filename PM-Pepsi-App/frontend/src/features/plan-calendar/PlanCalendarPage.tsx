import { CanPermission } from '@/components/auth/CanPermission'
import {
  AppPageSection,
  AppPageShell,
} from '@/components/layout/AppPageShell'
import { ManhourSummaryDialog } from '@/components/scheduling/ManhourSummaryDialog'
import { MonthFullCalendar } from '@/components/scheduling/MonthFullCalendar'
import { PlannerPipelineLegend } from '@/components/scheduling/PlannerPipelineLegend'
import { SchedulingCalendarPanel, schedulingHeroBadgeClass } from '@/components/scheduling/SchedulingPageLayout'
import { WorkOrderDetailDialog } from '@/components/scheduling/WorkOrderDetailDialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { fetchPlanCalendarEvents } from '@/lib/api-public'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { AlertCircle, CalendarRange } from 'lucide-react'
import { useState } from 'react'
import { formatCalendarMonthLabel } from '@/lib/format-month-label'
import { useAppLocale } from '@/providers/I18nProvider'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

/**
 * — ปฏิทินงานเปิดของช่าง (view_planwork + idwkctr)
 */
export function PlanCalendarPage() {
  const { t } = useTranslation('scheduling')
  const { t: tc } = useTranslation('common')
  const { locale } = useAppLocale()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [detailTarget, setDetailTarget] = useState<{ id: string; date: string } | null>(
    null,
  )
  const [mhOpen, setMhOpen] = useState(false)
  const [mhFrom, setMhFrom] = useState('')
  const [mhTo, setMhTo] = useState('')

  const q = useQuery({
    queryKey: ['plan-calendar', year, month],
    queryFn: () => fetchPlanCalendarEvents(year, month),
    placeholderData: keepPreviousData,
  })

  const eventCount = q.data?.items?.length ?? 0
  const monthLabel = formatCalendarMonthLabel(month, year, locale)

  return (
    <>
      <AppPageShell
        title={t('planCalendar.title')}
        description={t('planCalendar.description')}
        hints={[
          t('planCalendar.hints.assigned'),
          t('planCalendar.hints.colors'),
          t('planCalendar.hints.hours'),
          t('planCalendar.hints.wo'),
        ]}
        heroMeta={
          <Badge
            variant="outline"
            className={`mt-2 ${schedulingHeroBadgeClass}`}
          >
            {monthLabel}
          </Badge>
        }
        headerActions={
          <>
            <CanPermission permission="planning.read">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="dashboard-hero__btn gap-2"
                asChild
              >
                <Link to="/planning">{t('planCalendar.pmPlanning')}</Link>
              </Button>
            </CanPermission>
            <CanPermission permission="calendar.read">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="dashboard-hero__btn gap-2"
                asChild
              >
                <Link to="/calendar">
                  <CalendarRange className="size-4" aria-hidden />
                  {t('planCalendar.workScheduling')}
                </Link>
              </Button>
            </CanPermission>
          </>
        }
      >
        <AppPageSection index={0}>
          <PlannerPipelineLegend collapsible defaultOpen={false} className="mb-3" />
          {q.isLoading ? (
            <Skeleton
              className="h-[28rem] w-full rounded-card"
              aria-label={t('planCalendar.loading')}
            />
          ) : q.isError ? (
            <EmptyState
              icon={AlertCircle}
              title={t('planCalendar.loadFailed')}
              description={
                <>
                  {t('planCalendar.loadFailedHint')}{' '}
                  <code className="text-xs">planning.read</code>
                  {q.error instanceof Error ? ` — ${q.error.message}` : null}
                </>
              }
              action={{ label: tc('actions.retry'), onClick: () => void q.refetch() }}
            />
          ) : (
            <SchedulingCalendarPanel
              title={t('planCalendar.panelTitle')}
              subtitle={t('planCalendar.panelSubtitle')}
              eventCount={eventCount}
              isRefreshing={q.isFetching && !q.isLoading}
            >
              {eventCount === 0 ? (
                <p className="text-caption mt-3 rounded-button border border-dashed border-app bg-app-subtle/50 px-3 py-2">
                  {t('planCalendar.emptyMonth')}
                </p>
              ) : null}
              <MonthFullCalendar
                year={year}
                month={month}
                viewMode="month-week-day"
                yearMin={2015}
                yearMax={2035}
                showPeriodPicker
                events={q.data?.items ?? []}
                className="scheduling-calendar-widget mt-3"
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
              />
            </SchedulingCalendarPanel>
          )}
        </AppPageSection>
      </AppPageShell>

      <WorkOrderDetailDialog
        orderId={detailTarget?.id ?? null}
        contextDate={detailTarget?.date}
        initialTab="task-list"
        onOpenChange={(o) => !o && setDetailTarget(null)}
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
