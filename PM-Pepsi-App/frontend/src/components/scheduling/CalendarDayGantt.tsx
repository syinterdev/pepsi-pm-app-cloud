import { calendarEventHoverDetailSchema, type CalendarEventHoverDetail } from '@/api/schemas'
import { CalendarEventHoverCard } from '@/components/scheduling/CalendarEventHoverCard'
import type { ScheduleCalendarEvent } from '@/lib/schedule-calendar'
import { cn } from '@/lib/utils'
import { pmPhaseCalendarClass } from '@/lib/wo-pm-phase'
import { calendarEventSurfaceClasses } from '@/lib/calendar-event-classes'
import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'

const DAY_START_HOUR = 6
const DAY_END_HOUR = 22
const DAY_SPAN_HOURS = DAY_END_HOUR - DAY_START_HOUR

const HOUR_LABELS = Array.from(
  { length: DAY_SPAN_HOURS + 1 },
  (_, i) => DAY_START_HOUR + i,
)

function hourFraction(iso: string): number {
  const d = new Date(iso)
  return d.getHours() + d.getMinutes() / 60
}

function barLayout(planStartIso: string, planEndIso: string): { left: string; width: string } {
  const startH = hourFraction(planStartIso)
  const endH = hourFraction(planEndIso)
  const clampedStart = Math.max(startH, DAY_START_HOUR)
  const clampedEnd = Math.min(endH, DAY_END_HOUR)
  const span = Math.max(clampedEnd - clampedStart, 0.25)
  const leftPct = ((clampedStart - DAY_START_HOUR) / DAY_SPAN_HOURS) * 100
  const widthPct = (span / DAY_SPAN_HOURS) * 100
  return {
    left: `${leftPct}%`,
    width: `${Math.min(Math.max(widthPct, 3), 100 - leftPct)}%`,
  }
}

export type CalendarDayGanttProps = {
  date: string
  events: ScheduleCalendarEvent[]
  onEventClick?: (event: ScheduleCalendarEvent) => void
  className?: string
}

export function CalendarDayGantt({
  date,
  events,
  onEventClick,
  className,
}: CalendarDayGanttProps) {
  const [eventHover, setEventHover] = useState<{
    detail: CalendarEventHoverDetail
    x: number
    y: number
  } | null>(null)

  const dayEvents = useMemo(
    () =>
      events
        .filter((e) => e.date === date && e.planStartIso && e.planEndIso)
        .sort((a, b) => (a.planStartIso ?? '').localeCompare(b.planStartIso ?? '')),
    [date, events],
  )

  const dateLabel = useMemo(() => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
    if (!m) return date
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
    return d.toLocaleDateString('th-TH', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }, [date])

  return (
    <div className={cn('pm-cal-gantt', className)}>
      <p className="pm-cal-gantt__date mb-1 text-sm font-semibold text-app">{dateLabel}</p>
      <p className="pm-cal-gantt__hint mb-2 text-xs text-app-muted">
        Order Frame — กรอบเวลา bscstart + ชม.งาน · 06:00–22:00
      </p>
      <div className="pm-cal-gantt__scroll overflow-x-auto rounded-xl border border-app/40 bg-[var(--app-surface)]">
        <div
          className="pm-cal-gantt__grid relative min-w-[42rem]"
          style={{ minHeight: `${Math.max(dayEvents.length, 1) * 2.75 + 2}rem` }}
        >
          <div className="pm-cal-gantt__hours-row sticky top-0 z-10 flex border-b border-app/30 bg-[color-mix(in_srgb,var(--app-bg)_8%,var(--app-surface))]">
            <div className="w-0 shrink-0 sm:w-28" aria-hidden />
            {HOUR_LABELS.map((h) => (
              <div
                key={h}
                className="pm-cal-gantt__hour-label flex-1 border-l border-app/20 px-0.5 py-1.5 text-center text-[10px] font-medium text-app-muted sm:text-xs"
              >
                {String(h).padStart(2, '0')}:00
              </div>
            ))}
          </div>

          <div className="pm-cal-gantt__lanes relative">
            {HOUR_LABELS.slice(0, -1).map((h) => (
              <div
                key={`grid-${h}`}
                className="pointer-events-none absolute inset-y-0 border-l border-app/15"
                style={{ left: `${((h - DAY_START_HOUR) / DAY_SPAN_HOURS) * 100}%` }}
                aria-hidden
              />
            ))}

            {dayEvents.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-app-muted">ไม่มีงานในวันนี้</p>
            ) : (
              dayEvents.map((ev, idx) => {
                const layout = barLayout(ev.planStartIso!, ev.planEndIso!)
                const hoverParsed = calendarEventHoverDetailSchema.safeParse(ev.hoverDetail)
                const frameLabel =
                  hoverParsed.success &&
                  hoverParsed.data.orderFrameStart &&
                  hoverParsed.data.orderFrameEnd
                    ? `${hoverParsed.data.orderFrameStart}–${hoverParsed.data.orderFrameEnd}`
                    : undefined
                return (
                  <button
                    key={ev.id}
                    type="button"
                    aria-label={frameLabel ? `${ev.title} · ${frameLabel}` : ev.title}
                    title={frameLabel ? `${ev.title} · Order Frame ${frameLabel}` : ev.title}
                    className={cn(
                      'pm-cal-gantt__bar absolute mx-0.5 truncate rounded-md px-1.5 py-0.5 text-left text-[10px] font-semibold text-white shadow-sm transition-opacity hover:opacity-90 sm:text-xs',
                      ev.canMovePlan === false && 'pm-cal-event--locked',
                      pmPhaseCalendarClass(ev.pmPhase),
                      ...calendarEventSurfaceClasses(ev),
                    )}
                    style={{
                      ...layout,
                      top: `${1.25 + idx * 2.75}rem`,
                      height: '2.25rem',
                    }}
                    onClick={() => onEventClick?.(ev)}
                    onMouseEnter={
                      hoverParsed.success
                        ? (e) =>
                            setEventHover({
                              detail: hoverParsed.data,
                              x: e.clientX,
                              y: e.clientY,
                            })
                        : undefined
                    }
                    onMouseMove={
                      hoverParsed.success
                        ? (e) =>
                            setEventHover({
                              detail: hoverParsed.data,
                              x: e.clientX,
                              y: e.clientY,
                            })
                        : undefined
                    }
                    onMouseLeave={hoverParsed.success ? () => setEventHover(null) : undefined}
                  >
                    {ev.tecoBellAlert ? (
                      <span className="pm-cal-event-bell mr-0.5" aria-hidden>
                        🔔
                      </span>
                    ) : null}
                    {ev.title}
                  </button>
                )
              })
            )}
          </div>
        </div>
      </div>

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
