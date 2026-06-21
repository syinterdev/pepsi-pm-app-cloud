import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { buildYearOptions, getCalendarMonthNames } from './calendar-period-utils'

export type CalendarViewType = 'dayGridMonth' | 'dayGridWeek' | 'dayGridDay'

export type ModernCalendarToolbarProps = {
  year: number
  month: number
  yearMin?: number
  yearMax?: number
  viewMode?: 'month' | 'month-week-day'
  currentView: CalendarViewType
  onPeriodChange: (year: number, month: number) => void
  onViewChange: (view: CalendarViewType) => void
  onNavigate?: (direction: -1 | 1) => void
  dayTitle?: string
  weekTitle?: string
  className?: string
}

export function ModernCalendarToolbar({
  year,
  month,
  yearMin,
  yearMax,
  viewMode = 'month-week-day',
  currentView,
  onPeriodChange,
  onViewChange,
  onNavigate,
  dayTitle,
  weekTitle,
  className,
}: ModernCalendarToolbarProps) {
  const { t, i18n } = useTranslation('scheduling')
  const reducedMotion = useReducedMotion()
  const now = new Date()
  const minY = yearMin ?? now.getFullYear() - 20
  const maxY = yearMax ?? now.getFullYear() + 2
  const years = buildYearOptions(minY, maxY)
  const clampYear = (y: number) => Math.min(maxY, Math.max(minY, y))
  const useBuddhistYear = i18n.language.startsWith('th')

  const viewOptions = useMemo(
    () =>
      [
        { id: 'dayGridMonth' as const, label: t('toolbar.month') },
        { id: 'dayGridWeek' as const, label: t('toolbar.week') },
        { id: 'dayGridDay' as const, label: t('toolbar.day') },
      ],
    [t],
  )

  const shiftMonth = (delta: number) => {
    let y = year
    let m = month + delta
    while (m < 1) {
      m += 12
      y -= 1
    }
    while (m > 12) {
      m -= 12
      y += 1
    }
    onPeriodChange(clampYear(y), m)
  }

  const goToday = () => {
    onPeriodChange(now.getFullYear(), now.getMonth() + 1)
  }

  const monthNames = useMemo(() => getCalendarMonthNames(), [i18n.language])
  const monthLabel = monthNames[month - 1] ?? String(month)
  const displayYear = useBuddhistYear ? year + 543 : year
  const title =
    currentView === 'dayGridDay' && dayTitle
      ? dayTitle
      : currentView === 'dayGridWeek' && weekTitle
        ? weekTitle
        : `${monthLabel} ${displayYear}`

  const navBackLabel =
    currentView === 'dayGridDay'
      ? t('toolbar.prevDay')
      : currentView === 'dayGridWeek'
        ? t('toolbar.prevWeek')
        : t('toolbar.prevMonth')
  const navForwardLabel =
    currentView === 'dayGridDay'
      ? t('toolbar.nextDay')
      : currentView === 'dayGridWeek'
        ? t('toolbar.nextWeek')
        : t('toolbar.nextMonth')

  const navBack = () => (onNavigate ? onNavigate(-1) : shiftMonth(-1))
  const navForward = () => (onNavigate ? onNavigate(1) : shiftMonth(1))

  return (
    <div
      className={cn(
        'modern-cal-toolbar flex flex-col gap-3 rounded-xl border border-app/60',
        'bg-gradient-to-r from-[color-mix(in_srgb,var(--app-accent)_6%,var(--app-surface))] to-[var(--app-surface)]',
        'p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-0.5 rounded-lg border border-app/50 bg-[var(--app-surface)] p-0.5 shadow-sm">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 rounded-md"
            aria-label={navBackLabel}
            onClick={navBack}
          >
            <ChevronLeft className="size-4" aria-hidden />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 rounded-md"
            aria-label={navForwardLabel}
            onClick={navForward}
          >
            <ChevronRight className="size-4" aria-hidden />
          </Button>
        </div>

        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={title}
              initial={reducedMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reducedMotion ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="min-w-[8rem] text-sm font-semibold text-app sm:text-base"
            >
              {title}
            </motion.p>
          </AnimatePresence>

          <select
            aria-label={t('toolbar.selectMonth')}
            className="h-8 rounded-lg border border-app/70 bg-[var(--app-surface)] px-2 text-xs shadow-sm transition-shadow focus:shadow-md sm:text-sm"
            value={month}
            onChange={(e) => onPeriodChange(year, Number(e.target.value))}
          >
            {monthNames.map((name, idx) => (
              <option key={name} value={idx + 1}>
                {name}
              </option>
            ))}
          </select>

          <select
            aria-label={t('toolbar.selectYear')}
            className="h-8 rounded-lg border border-app/70 bg-[var(--app-surface)] px-2 text-xs shadow-sm transition-shadow focus:shadow-md sm:text-sm"
            value={year}
            onChange={(e) => onPeriodChange(clampYear(Number(e.target.value)), month)}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {useBuddhistYear ? y + 543 : y}
              </option>
            ))}
          </select>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5 shadow-sm"
          onClick={goToday}
        >
          <CalendarDays className="size-3.5" aria-hidden />
          {t('toolbar.today')}
        </Button>
      </div>

      {viewMode === 'month-week-day' ? (
        <div
          role="tablist"
          aria-label={t('toolbar.viewAria')}
          className="modern-cal-view-switch inline-flex rounded-lg border border-app/50 bg-app-subtle/50 p-0.5"
        >
          {viewOptions.map((opt) => {
            const active = currentView === opt.id
            return (
              <button
                key={opt.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onViewChange(opt.id)}
                className={cn(
                  'relative rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200',
                  active
                    ? 'bg-[var(--app-surface)] text-app shadow-sm ring-1 ring-[color-mix(in_srgb,var(--app-accent)_20%,var(--app-border))]'
                    : 'text-app-muted hover:text-app',
                )}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
