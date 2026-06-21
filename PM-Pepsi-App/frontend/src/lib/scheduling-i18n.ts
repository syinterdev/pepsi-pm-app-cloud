import type { ActivityDisplayMode } from '@/components/scheduling/CalendarColorLegend'
import { BRAND_CALENDAR, BRAND_LEGEND_TINT } from '@/lib/brand-palette'
import { PLANNER_PIPELINE_COLORS } from '@/lib/planner-pipeline'
import type { PmExecutionStatus } from '@/lib/wo-pm-execution'
import { PM_EXECUTION_META } from '@/lib/wo-pm-execution'
import type { TFunction } from 'i18next'

export function activityDisplayOptions(t: TFunction<'scheduling'>): ReadonlyArray<{
  value: ActivityDisplayMode
  label: string
}> {
  return [
    { value: 'all', label: t('activity.all') },
    { value: 'Z1', label: t('activity.Z1') },
    { value: 'Z2', label: t('activity.Z2') },
    { value: 'Z5', label: t('activity.Z5') },
  ]
}

export function calendarColorLegendItems(t: TFunction<'scheduling'>) {
  return [
    {
      color: BRAND_CALENDAR.inProgress,
      label: t('colors.inProgress'),
      title: t('colors.inProgressTitle'),
    },
    {
      color: BRAND_CALENDAR.moved,
      label: t('colors.moved'),
      title: t('colors.movedTitle'),
    },
    {
      color: BRAND_CALENDAR.completed,
      label: t('colors.done'),
      title: t('colors.doneTitle'),
    },
  ] as const
}

export function weekendLegendItems(t: TFunction<'scheduling'>) {
  return [
    { color: BRAND_LEGEND_TINT.sunday, label: t('colors.sunday'), title: t('colors.sundayTitle') },
    { color: BRAND_LEGEND_TINT.saturday, label: t('colors.saturday'), title: t('colors.saturdayTitle') },
  ] as const
}

/** Extended calendar legend (backlog / WO pages) — customer slide order */
export function woCalendarColorLegendItems(t: TFunction<'scheduling'>) {
  return [
    {
      color: BRAND_CALENDAR.overdue,
      label: t('calendarLegend.overdue'),
      title: t('calendarLegend.overdueTitle'),
    },
    {
      color: BRAND_CALENDAR.moved,
      label: t('colors.upcomingWo'),
      title: t('calendarLegend.upcomingWoTitle'),
    },
    {
      color: BRAND_CALENDAR.inProgress,
      label: t('colors.estimate'),
      title: t('calendarLegend.estimateTitle'),
    },
    {
      color: BRAND_CALENDAR.completed,
      label: t('colors.done'),
      title: t('calendarLegend.doneTitleExt'),
    },
  ] as const
}

/** Pipeline จ่ายงาน — ใช้บน /calendar และ /plan-calendar (สากล) */
export function plannerPipelineLegendItems(t: TFunction<'scheduling'>) {
  return [
    {
      color: PLANNER_PIPELINE_COLORS.unassigned,
      label: t('pipeline.status.unassigned.label'),
      title: t('pipeline.status.unassigned.title'),
    },
    {
      color: PLANNER_PIPELINE_COLORS.assigned,
      label: t('pipeline.status.assigned.label'),
      title: t('pipeline.status.assigned.title'),
    },
    {
      color: PLANNER_PIPELINE_COLORS.in_progress,
      label: t('pipeline.status.in_progress.label'),
      title: t('pipeline.status.in_progress.title'),
    },
    {
      color: PLANNER_PIPELINE_COLORS.closed,
      label: t('pipeline.status.closed.label'),
      title: t('pipeline.status.closed.title'),
    },
  ] as const
}

export function pmExecutionMeta(t: TFunction<'scheduling'>, status: PmExecutionStatus) {
  const base = PM_EXECUTION_META[status]
  return {
    ...base,
    label: t(`pmExecution.${status}.label`),
    title: t(`pmExecution.${status}.title`),
  }
}
