import type { DatesSetArg, DateSelectArg, EventClickArg, EventDropArg } from '@fullcalendar/core'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin, { type DateClickArg } from '@fullcalendar/interaction'
import FullCalendar from '@fullcalendar/react'
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { motion, useReducedMotion } from 'framer-motion'

import { calendarEventHoverDetailSchema, type CalendarEventHoverDetail } from '@/api/schemas'
import { CalendarDayGantt } from '@/components/scheduling/CalendarDayGantt'
import { CalendarEventHoverCard } from '@/components/scheduling/CalendarEventHoverCard'
import { mountCalendarTecoBell } from '@/lib/calendar-event-bell'
import { mountCalendarPipelineBadges } from '@/lib/calendar-pipeline-badge'

import {
  eventFromClickArg,
  toFullCalendarEvents,
  type ScheduleCalendarEvent,
} from '@/lib/schedule-calendar'
import { pmPhaseCalendarClass } from '@/lib/wo-pm-phase'
import { useI18nFormat } from '@/lib/use-i18n-format'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { CalendarPeriodPicker } from './CalendarPeriodPicker'
import {
  ModernCalendarToolbar,
  type CalendarViewType,
} from './ModernCalendarToolbar'
import {
  MODERN_CALENDAR_DEFAULTS,
  modernCalendarThemeStyle,
  type ModernCalendarThemeVars,
} from './modern-calendar-theme'

/** Long-press delay on touch (ms) — balance drag vs tap-to-open */
const TOUCH_LONG_PRESS_MS = 400

type HoverCleanupEl = HTMLElement & { __pmCalHoverCleanup?: () => void }

function mountCalendarEventHover(
  el: HoverCleanupEl,
  detail: unknown,
  onHover: (detail: CalendarEventHoverDetail, x: number, y: number) => void,
  clearHover: () => void,
) {
  const parsed = calendarEventHoverDetailSchema.safeParse(detail)
  if (!parsed.success) return
  el.removeAttribute('title')
  const d = parsed.data
  const onEnter = (e: MouseEvent) => onHover(d, e.clientX, e.clientY)
  const onMove = (e: MouseEvent) => onHover(d, e.clientX, e.clientY)
  const onLeave = () => clearHover()
  el.addEventListener('mouseenter', onEnter)
  el.addEventListener('mousemove', onMove)
  el.addEventListener('mouseleave', onLeave)
  el.__pmCalHoverCleanup = () => {
    el.removeEventListener('mouseenter', onEnter)
    el.removeEventListener('mousemove', onMove)
    el.removeEventListener('mouseleave', onLeave)
    delete el.__pmCalHoverCleanup
  }
}

function weekendDayClasses(date: Date): string[] {
  const dow = date.getDay()
  if (dow === 0) return ['pm-cal-day--weekend', 'pm-cal-day--sunday']
  if (dow === 6) return ['pm-cal-day--weekend', 'pm-cal-day--saturday']
  return []
}

type MonthFullCalendarProps = {
  year: number
  month: number
  events: ScheduleCalendarEvent[]
  onMonthChange: (year: number, month: number) => void
  viewMode?: 'month' | 'month-week-day'
  onDateClick?: (date: string) => void
  onRangeSelect?: (fromDate: string, toDate: string) => void
  onEventClick?: (event: ScheduleCalendarEvent) => void
  onEventDrop?: (event: ScheduleCalendarEvent, newDate: string) => void
  className?: string
  showPeriodPicker?: boolean
  yearMin?: number
  yearMax?: number
  /** UI ปฏิทินแบบ modern (toolbar + animation) — ค่าเริ่มต้น true */
  modern?: boolean
  /** จำนวนงานที่แสดงในช่องวันก่อน "+N งาน" (ค่าเริ่มต้น 5) */
  dayMaxEvents?: number
  /** ความสูงขั้นต่ำช่องวัน เช่น `7.5rem` */
  dayCellMinHeight?: string
  /** Note รายวัน — รหัสศูนย์งานที่มีงานค้าง (Backlog) */
  dayWkctrNotes?: ReadonlyMap<string, readonly string[]> | Record<string, readonly string[]>
  /** สี/ธีมวันหยุด — ส่งผ่าน CSS variables */
  theme?: ModernCalendarThemeVars
}

function parseIsoDate(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!m) return null
  const yyyy = Number(m[1])
  const mm = Number(m[2])
  const dd = Number(m[3])
  if (!Number.isFinite(yyyy) || !Number.isFinite(mm) || !Number.isFinite(dd)) return null
  return new Date(yyyy, mm - 1, dd)
}

function defaultFocusDateForMonth(year: number, month: number): string {
  const today = new Date()
  if (today.getFullYear() === year && today.getMonth() + 1 === month) {
    const y = today.getFullYear()
    const m = String(today.getMonth() + 1).padStart(2, '0')
    const d = String(today.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  return `${year}-${String(month).padStart(2, '0')}-01`
}

export function MonthFullCalendar({
  year,
  month,
  events,
  onMonthChange,
  viewMode = 'month',
  onDateClick,
  onRangeSelect,
  onEventClick,
  onEventDrop,
  className,
  showPeriodPicker = true,
  yearMin,
  yearMax,
  modern = true,
  dayMaxEvents = MODERN_CALENDAR_DEFAULTS.dayMaxEvents,
  dayCellMinHeight,
  dayWkctrNotes,
  theme,
}: MonthFullCalendarProps) {
  const { t } = useTranslation('scheduling')
  const { fullCalendar: fcLocale } = useI18nFormat()
  const calRef = useRef<FullCalendar>(null)
  const buttonText = useMemo(
    () => ({
      today: t('toolbar.today'),
      month: t('toolbar.month'),
      week: t('toolbar.week'),
      day: t('toolbar.day'),
    }),
    [t],
  )
  const fcEvents = useMemo(() => toFullCalendarEvents(events), [events])
  const notesForDate = (isoDate: string): readonly string[] => {
    if (!dayWkctrNotes) return []
    if (dayWkctrNotes instanceof Map) return dayWkctrNotes.get(isoDate) ?? []
    const record = dayWkctrNotes as Record<string, readonly string[]>
    return record[isoDate] ?? []
  }
  const touchDnD = Boolean(onEventDrop)
  const touchSelect = Boolean(onDateClick || onRangeSelect)
  const reducedMotion = useReducedMotion()

  const themeStyle = useMemo(
    () =>
      modernCalendarThemeStyle({
        ...theme,
        dayCellMinHeight: dayCellMinHeight ?? theme?.dayCellMinHeight,
      }) as CSSProperties,
    [dayCellMinHeight, theme],
  )

  const [currentView, setCurrentView] = useState<CalendarViewType>('dayGridMonth')
  const [focusDate, setFocusDate] = useState(() => defaultFocusDateForMonth(year, month))
  const [slideDir, setSlideDir] = useState(0)
  const [eventHover, setEventHover] = useState<{
    detail: CalendarEventHoverDetail
    x: number
    y: number
  } | null>(null)
  const prevPeriod = useRef({ year, month })

  useEffect(() => {
    if (currentView === 'dayGridDay') return
    const api = calRef.current?.getApi()
    if (!api) return
    const viewDate = api.getDate()
    if (viewDate.getFullYear() !== year || viewDate.getMonth() + 1 !== month) {
      api.gotoDate(new Date(year, month - 1, 1))
    }
  }, [year, month, currentView])

  useEffect(() => {
    const fd = parseIsoDate(focusDate)
    if (!fd) {
      setFocusDate(defaultFocusDateForMonth(year, month))
      return
    }
    if (fd.getFullYear() !== year || fd.getMonth() + 1 !== month) {
      setFocusDate(defaultFocusDateForMonth(year, month))
    }
  }, [year, month, focusDate])

  useEffect(() => {
    const prev = prevPeriod.current
    if (prev.year !== year || prev.month !== month) {
      const prevIndex = prev.year * 12 + prev.month
      const nextIndex = year * 12 + month
      setSlideDir(nextIndex > prevIndex ? 1 : -1)
      prevPeriod.current = { year, month }
    }
  }, [year, month])

  const handlePeriodChange = (y: number, m: number) => {
    onMonthChange(y, m)
  }

  const shiftFocusByDays = (deltaDays: number) => {
    const base = parseIsoDate(focusDate) ?? new Date(year, month - 1, 1)
    base.setDate(base.getDate() + deltaDays)
    const iso = toYyyyMmDd(base)
    setFocusDate(iso)
    onMonthChange(base.getFullYear(), base.getMonth() + 1)
    if (currentView !== 'dayGridDay') {
      calRef.current?.getApi().gotoDate(base)
    }
  }

  const handleNavigate = (direction: -1 | 1) => {
    if (currentView === 'dayGridDay') {
      shiftFocusByDays(direction)
      return
    }
    if (currentView === 'dayGridWeek') {
      shiftFocusByDays(direction * 7)
      return
    }
    let y = year
    let m = month + direction
    while (m < 1) {
      m += 12
      y -= 1
    }
    while (m > 12) {
      m -= 12
      y += 1
    }
    onMonthChange(y, m)
  }

  const handleViewChange = (view: CalendarViewType) => {
    if (view === currentView) return
    setCurrentView(view)
    if (view === 'dayGridDay') {
      setFocusDate(defaultFocusDateForMonth(year, month))
    }
  }

  /** สลับเดือน/สัปดาห์บน FullCalendar โดยไม่รีเมานต์ (หลีกเลี่ยง reset เป็น month) */
  useEffect(() => {
    if (currentView === 'dayGridDay') return
    const api = calRef.current?.getApi()
    if (!api) return
    if (api.view.type !== currentView) {
      api.changeView(currentView)
    }
    const anchor = parseIsoDate(focusDate) ?? new Date(year, month - 1, 1)
    const viewDate = api.getDate()
    if (
      viewDate.getFullYear() !== anchor.getFullYear() ||
      viewDate.getMonth() !== anchor.getMonth() ||
      viewDate.getDate() !== anchor.getDate()
    ) {
      api.gotoDate(anchor)
    }
  }, [currentView, focusDate, year, month])

  const handleDatesSet = (arg: DatesSetArg) => {
    const viewType = arg.view.type as CalendarViewType
    if (viewType === 'dayGridMonth' || viewType === 'dayGridWeek' || viewType === 'dayGridDay') {
      setCurrentView(viewType)
    }
    const d = arg.view.currentStart
    const iso = toYyyyMmDd(d)
    if (viewType === 'dayGridDay' || viewType === 'dayGridWeek') {
      setFocusDate(iso)
    }
    const y = d.getFullYear()
    const m = d.getMonth() + 1
    if (y !== year || m !== month) onMonthChange(y, m)
  }

  const dayViewTitle = useMemo(() => {
    const d = parseIsoDate(focusDate)
    if (!d) return ''
    return d.toLocaleDateString('th-TH', {
      weekday: 'short',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }, [focusDate])

  const weekViewTitle = useMemo(() => {
    const start = parseIsoDate(focusDate)
    if (!start) return ''
    const end = new Date(start)
    end.setDate(end.getDate() + 6)
    const fmt = (d: Date) =>
      d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })
    return `${fmt(start)} – ${fmt(end)}`
  }, [focusDate])

  const handleEventClick = (arg: EventClickArg) => {
    if (!onEventClick) return
    const mapped = eventFromClickArg(arg)
    if (mapped) onEventClick(mapped)
  }

  const handleEventDrop = (arg: EventDropArg) => {
    if (!onEventDrop) return
    arg.revert()
    const mapped = eventFromClickArg(arg)
    if (!mapped || !arg.event.start) return
    if (mapped.canMovePlan === false) {
      toast.error(t('calendar.planNotMovable'))
      return
    }
    const d = arg.event.start
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    onEventDrop(mapped, `${y}-${m}-${day}`)
  }

  const handleDateClick = (arg: DateClickArg) => {
    if (!onDateClick) return
    const d = arg.date
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    onDateClick(`${y}-${m}-${day}`)
  }

  const toYyyyMmDd = (d: Date) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  const handleSelect = (arg: DateSelectArg) => {
    if (!onRangeSelect) return
    const start = arg.start
    const end = new Date(arg.end)
    end.setDate(end.getDate() - 1)
    onRangeSelect(toYyyyMmDd(start), toYyyyMmDd(end))
    calRef.current?.getApi().unselect()
  }

  const useModernChrome = modern && showPeriodPicker

  return (
    <div className={cn('modern-cal-root space-y-3', className)}>
      {useModernChrome ? (
        <ModernCalendarToolbar
          year={year}
          month={month}
          yearMin={yearMin}
          yearMax={yearMax}
          viewMode={viewMode}
          currentView={currentView}
          onPeriodChange={handlePeriodChange}
          onViewChange={handleViewChange}
          onNavigate={handleNavigate}
          dayTitle={dayViewTitle}
          weekTitle={weekViewTitle}
        />
      ) : showPeriodPicker ? (
        <CalendarPeriodPicker
          year={year}
          month={month}
          yearMin={yearMin}
          yearMax={yearMax}
          onChange={onMonthChange}
        />
      ) : null}

      <motion.div
        key={`${year}-${month}-${currentView === 'dayGridDay' ? 'gantt' : 'grid'}`}
        style={modern ? themeStyle : undefined}
        initial={
          reducedMotion
            ? false
            : { opacity: 0, x: slideDir !== 0 ? slideDir * 16 : 0, scale: 0.995 }
        }
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          'pm-fullcalendar overflow-x-auto rounded-2xl border border-app/50 p-1.5 sm:p-2',
          'bg-[color-mix(in_srgb,var(--app-bg)_10%,var(--app-surface))]',
          'shadow-[0_8px_30px_color-mix(in_srgb,var(--app-text)_6%,transparent)]',
          modern && 'pm-fullcalendar--modern',
          touchDnD && 'pm-fullcalendar--touch-dnd',
        )}
      >
        {currentView === 'dayGridDay' ? (
          <CalendarDayGantt
            date={focusDate}
            events={events}
            onEventClick={onEventClick}
          />
        ) : (
        <FullCalendar
          ref={calRef}
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView={
            currentView === 'dayGridWeek' ? 'dayGridWeek' : 'dayGridMonth'
          }
          initialDate={
            parseIsoDate(focusDate) ?? new Date(year, month - 1, 1)
          }
          locale={fcLocale}
          headerToolbar={
            useModernChrome
              ? false
              : {
                  left: 'prev,next today',
                  center: 'title',
                  right: viewMode === 'month-week-day' ? 'dayGridMonth,dayGridWeek,dayGridDay' : '',
                }
          }
          buttonText={buttonText}
          height="auto"
          fixedWeekCount={false}
          dayMaxEvents={dayMaxEvents}
          moreLinkText={(n) => t('calendar.moreJobs', { count: n })}
          events={fcEvents}
          datesSet={handleDatesSet}
          editable={touchDnD}
          eventStartEditable={touchDnD}
          eventDurationEditable={false}
          dragScroll
          longPressDelay={touchDnD || touchSelect ? TOUCH_LONG_PRESS_MS : undefined}
          eventLongPressDelay={touchDnD ? TOUCH_LONG_PRESS_MS : undefined}
          selectLongPressDelay={touchSelect ? TOUCH_LONG_PRESS_MS + 100 : undefined}
          dateClick={onDateClick ? handleDateClick : undefined}
          selectable={touchSelect}
          select={onRangeSelect ? handleSelect : undefined}
          selectMirror
          unselectAuto
          eventClick={onEventClick ? handleEventClick : undefined}
          eventDrop={onEventDrop ? handleEventDrop : undefined}
          eventDisplay="block"
          dayHeaderClassNames={(arg) => {
            const dow = arg.date.getDay()
            if (dow === 0) return ['pm-cal-dow', 'pm-cal-dow--weekend', 'pm-cal-dow--sunday']
            if (dow === 6) return ['pm-cal-dow', 'pm-cal-dow--weekend', 'pm-cal-dow--saturday']
            return ['pm-cal-dow']
          }}
          dayCellClassNames={(arg) => {
            const classes = ['pm-cal-day']
            if (arg.isToday) classes.push('pm-cal-day--today')
            if (arg.isPast) classes.push('pm-cal-day--past')
            classes.push(...weekendDayClasses(arg.date))
            return classes
          }}
          dayCellContent={(arg) => {
            const y = arg.date.getFullYear()
            const m = String(arg.date.getMonth() + 1).padStart(2, '0')
            const d = String(arg.date.getDate()).padStart(2, '0')
            const iso = `${y}-${m}-${d}`
            const notes = notesForDate(iso)
            return (
              <div className="pm-cal-day-head flex w-full flex-col gap-0.5">
                <span
                  className={cn(
                    'pm-cal-day-num',
                    arg.isToday && 'pm-cal-day-num--today',
                    arg.isOther && 'pm-cal-day-num--muted',
                    (arg.date.getDay() === 0 || arg.date.getDay() === 6) && 'pm-cal-day-num--weekend',
                  )}
                >
                  {arg.dayNumberText}
                </span>
                {notes.length > 0 ? (
                  <div className="pm-cal-day-notes space-y-px px-0.5" aria-hidden>
                    {notes.slice(0, 3).map((line) => (
                      <span
                        key={line}
                        className="block truncate rounded bg-[color-mix(in_srgb,var(--brand-pepsi-blue)_10%,transparent)] px-0.5 text-[9px] font-medium leading-tight text-[var(--brand-pepsi-blue)]"
                        title={line}
                      >
                        {line}
                      </span>
                    ))}
                    {notes.length > 3 ? (
                      <span className="text-[9px] text-app-muted">+{notes.length - 3}</span>
                    ) : null}
                  </div>
                ) : null}
              </div>
            )
          }}
          eventClassNames={(arg) => {
            const classes = ['pm-cal-event']
            if (arg.event.extendedProps.canMovePlan === false) {
              classes.push('pm-cal-event--locked')
            }
            const surface = arg.event.extendedProps.surfaceClasses
            if (Array.isArray(surface)) {
              for (const c of surface) {
                if (typeof c === 'string') classes.push(c)
              }
            }
            const phaseClass = pmPhaseCalendarClass(
              arg.event.extendedProps.pmPhase as ScheduleCalendarEvent['pmPhase'],
            )
            if (phaseClass) classes.push(phaseClass)
            return classes
          }}
          eventDidMount={(arg) => {
            const props = arg.event.extendedProps
            mountCalendarEventHover(
              arg.el as HoverCleanupEl,
              props.hoverDetail,
              (detail, x, y) => setEventHover({ detail, x, y }),
              () => setEventHover(null),
            )
            if (touchDnD) {
              arg.el.setAttribute(
                'aria-label',
                `${arg.event.title} — แตะค้างแล้วลากเพื่อย้ายวัน (แท็บเล็ต)`,
              )
            }
            if (modern) {
              arg.el.classList.add('pm-cal-event--enter')
            }
            if (props.tecoBellAlert === true) {
              mountCalendarTecoBell(arg.el)
            }
            const pipelineBadges = props.pipelineBadges
            if (Array.isArray(pipelineBadges) && pipelineBadges.length > 0) {
              mountCalendarPipelineBadges(
                arg.el,
                pipelineBadges as Parameters<typeof mountCalendarPipelineBadges>[1],
              )
            }
          }}
          eventWillUnmount={(arg) => {
            ;(arg.el as HoverCleanupEl).__pmCalHoverCleanup?.()
          }}
        />
        )}
      </motion.div>
      {eventHover && typeof document !== 'undefined'
        ? createPortal(
            <CalendarEventHoverCard
              detail={eventHover.detail}
              x={eventHover.x}
              y={eventHover.y}
            />,
            document.body,
          )
        : null}
    </div>
  )
}
