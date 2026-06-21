import type { CalendarEventHoverDetail } from '@/api/schemas'
import { WoPmPhaseBadge } from '@/components/scheduling/WoPmPhaseBadge'
import { cn } from '@/lib/utils'

type CalendarEventHoverCardProps = {
  detail: CalendarEventHoverDetail
  x: number
  y: number
  className?: string
}

function dash(v: string | undefined): string {
  const t = v?.trim()
  return t ? t : '—'
}

type RowProps = { label: string; value: string }

function HoverRow({ label, value }: RowProps) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] gap-x-2 gap-y-0.5 text-xs leading-snug">
      <dt className="font-medium text-app-muted">{label}</dt>
      <dd className="text-app">{value}</dd>
    </div>
  )
}

export function CalendarEventHoverCard({ detail, x, y, className }: CalendarEventHoverCardProps) {
  const pad = 12
  const cardW = 300
  const cardH = 280
  const left = Math.min(Math.max(pad, x + 14), window.innerWidth - cardW - pad)
  const top = Math.min(Math.max(pad, y + 14), window.innerHeight - cardH - pad)

  const typeDisplay = detail.wktype
    ? detail.wktypeLabel && detail.wktypeLabel !== detail.wktype
      ? `${detail.wktype} (${detail.wktypeLabel})`
      : detail.wktype
    : '—'

  const resources =
    detail.resourceName?.trim() ||
    (detail.wkctr ? detail.wkctr : undefined) ||
    '—'

  return (
    <div
      role="tooltip"
      className={cn(
        'calendar-event-hover-card pointer-events-none fixed z-[10050]',
        'max-w-[min(20rem,calc(100vw-1.5rem))] rounded-xl border border-app/60',
        'bg-[var(--app-surface)] p-3 shadow-lg ring-1 ring-[color-mix(in_srgb,var(--app-text)_8%,transparent)]',
        className,
      )}
      style={{ left, top }}
    >
      {detail.zoneTitle ? (
        <p className="mb-2 border-b border-app/40 pb-2 text-sm font-semibold text-app">
          {detail.zoneTitle}
        </p>
      ) : null}
      <dl className="space-y-1.5">
        <HoverRow label="Work Order" value={dash(detail.workOrder)} />
        <HoverRow label="Type" value={typeDisplay} />
        <div className="grid grid-cols-[7.5rem_1fr] gap-x-2 gap-y-0.5 text-xs leading-snug">
          <dt className="font-medium text-app-muted">PM Phase</dt>
          <dd>
            {detail.pmPhase ? (
              <WoPmPhaseBadge phase={detail.pmPhase} syst={detail.syst} showSyst />
            ) : (
              <span className="text-app">{dash(detail.syst)}</span>
            )}
          </dd>
        </div>
        <HoverRow label="Resources" value={resources} />
        <HoverRow label="Functional Desc." value={dash(detail.functionalDesc)} />
        <HoverRow label="Plan date" value={dash(detail.planDate)} />
        <HoverRow label="Finish date" value={dash(detail.finishDate)} />
        {detail.orderFrameStart && detail.orderFrameEnd ? (
          <HoverRow
            label="Order Frame"
            value={`${detail.orderFrameStart} – ${detail.orderFrameEnd}`}
          />
        ) : null}
        <HoverRow label="Moved to" value={dash(detail.movedToDate)} />
        <HoverRow label="Reason" value={dash(detail.moveReason)} />
      </dl>
    </div>
  )
}
