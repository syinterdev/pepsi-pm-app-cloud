/**
 * Layout มาตรฐานหน้า Scheduling (ปฏิทิน / WO / Backlog)
 * — ใช้เป็นต้นแบบ UI โมเดิร์น + animation สำหรับหน้าอื่น
 */
import {
  AppPageHero,
  AppPageHeroHints,
} from '@/components/layout/AppPageHero'
import { coerceStringArray } from '@/lib/coerce-array'
import { Button } from '@/components/ui/button'
import { collapseHintSummary } from '@/lib/collapse-hint'
import { APP_INTERACTIVE_MOTION, APP_INTERACTIVE_MOTION_SUBTLE } from '@/lib/app-motion'
import { cn } from '@/lib/utils'
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'framer-motion'
import { ChevronDown, RotateCcw, Search } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

export const schedulingFadeUp: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.42, ease: [0.22, 1, 0.36, 1] as const },
  }),
}

/** ปุ่มลิงก์บน hero gradient — ใช้กับ SchedulingPageHeader actions */
export const schedulingHeroLinkBtnClass =
  'dashboard-hero__btn gap-2 rounded-xl shadow-sm backdrop-blur-sm'

export const schedulingHeroLinkIconClass = 'size-4 shrink-0 text-white/90'

export const schedulingHeroBadgeClass =
  'border-white/25 bg-white/10 text-[10px] font-semibold text-white/90'

/** คอลัมน์เนื้อหาหลัก — spacing มาตรฐาน scheduling pages */
export function SchedulingPageStack({
  className,
  children,
  ...props
}: ComponentProps<'div'>) {
  return (
    <div className={cn('scheduling-page-stack space-y-5', className)} {...props}>
      {children}
    </div>
  )
}

/** แต่ละบล็อกในหน้า — ห่อ section พร้อม fade-up */
export function SchedulingPageSection({
  index = 0,
  className,
  children,
}: {
  index?: number
  className?: string
  children: ReactNode
}) {
  const reducedMotion = useReducedMotion()

  return (
    <motion.section
      custom={index}
      variants={schedulingFadeUp}
      initial={reducedMotion ? false : 'hidden'}
      animate="show"
      className={cn(className)}
    >
      {children}
    </motion.section>
  )
}

type SchedulingSectionProps = {
  icon: LucideIcon
  title: string
  description?: string
  badge?: ReactNode
  actions?: ReactNode
  collapsible?: boolean
  defaultOpen?: boolean
  /** แสดงแทน description เมื่อย่อ */
  collapsedHint?: ReactNode
  className?: string
  bodyClassName?: string
  children: ReactNode
}

/** การ์ด section พร้อมหัวข้อ — ใช้ซ้ำ KPI / legend / ปฏิทิน */
export function SchedulingSection({
  icon: Icon,
  title,
  description,
  badge,
  actions,
  collapsible = false,
  defaultOpen = true,
  collapsedHint,
  className,
  bodyClassName,
  children,
}: SchedulingSectionProps) {
  const { t } = useTranslation(['scheduling', 'common'])
  const [open, setOpen] = useState(defaultOpen)
  const reducedMotion = useReducedMotion()
  const isOpen = !collapsible || open
  const collapsedSummary =
    typeof collapsedHint === 'string'
      ? collapseHintSummary(collapsedHint)
      : collapsedHint

  return (
    <div
      className={cn(
        'scheduling-section overflow-hidden rounded-card border border-app/75',
        'bg-gradient-to-b from-[var(--app-surface)] to-[color-mix(in_srgb,var(--app-bg)_22%,var(--app-surface))]',
        'shadow-[var(--app-shadow-card)]',
        className,
      )}
    >
      <div
        className={cn(
          'flex flex-wrap items-start justify-between gap-3 border-b border-app/45 px-4 py-3.5',
          collapsible && !isOpen && 'border-b-0',
        )}
      >
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--app-accent)_11%,var(--app-surface))] text-[var(--app-accent)] shadow-sm ring-1 ring-[color-mix(in_srgb,var(--app-accent)_18%,transparent)]">
            <Icon className="size-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-body-sm font-semibold text-app">{title}</h3>
              {isOpen ? badge : null}
            </div>
            {collapsible && !isOpen && collapsedSummary ? (
              <p className="mt-0.5 text-xs leading-relaxed text-app-muted">
                {collapsedSummary}
              </p>
            ) : description ? (
              <p className="mt-0.5 text-xs leading-relaxed text-app-muted">{description}</p>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {isOpen ? actions : null}
          {collapsible ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 text-app-muted"
              aria-expanded={isOpen}
              aria-label={
                isOpen ? t('common:actions.collapseSection') : t('common:actions.expandSection')
              }
              onClick={() => setOpen((v) => !v)}
            >
              <ChevronDown
                className={cn('size-4 transition-transform duration-200', isOpen && 'rotate-180')}
                aria-hidden
              />
            </Button>
          ) : null}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="body"
            initial={collapsible && !reducedMotion ? { height: 0, opacity: 0 } : false}
            animate={{ height: 'auto', opacity: 1 }}
            exit={collapsible && !reducedMotion ? { height: 0, opacity: 0 } : undefined}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className={cn('p-4', bodyClassName)}>{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export type SegmentOption<T extends string> = { value: T; label: string }

/** Toggle แบบ segmented control — ใช้เลือก Z1/Z2/Z5 ฯลฯ */
export function SchedulingSegmentControl<T extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: T
  onChange: (next: T) => void
  options: ReadonlyArray<SegmentOption<T>>
  className?: string
}) {
  const { t } = useTranslation('scheduling')
  return (
    <div
      role="tablist"
      aria-label={t('layout.displayOptionsAria')}
      className={cn(
        'scheduling-segment grid gap-1 rounded-xl border border-app/70 bg-app-subtle/60 p-1',
        options.length <= 2
          ? 'grid-cols-2'
          : options.length === 3
            ? 'grid-cols-2 sm:grid-cols-3'
            : 'grid-cols-2 sm:grid-cols-4',
        className,
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              'rounded-lg px-2 py-2 text-xs font-medium transition-all duration-200',
              active
                ? 'bg-[var(--app-surface)] text-app shadow-md ring-1 ring-[color-mix(in_srgb,var(--app-accent)_22%,var(--app-border))]'
                : 'text-app-muted hover:bg-[color-mix(in_srgb,var(--app-surface)_55%,transparent)] hover:text-app',
            )}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

/** ปุ่มค้นหา / ล้าง มาตรฐานในตัวกรอง */
export function SchedulingFilterActions({
  onClear,
  submitLabel,
  clearLabel,
}: {
  onClear: () => void
  submitLabel?: string
  clearLabel?: string
}) {
  const { t } = useTranslation(['scheduling', 'common'])
  const searchLabel = submitLabel ?? t('common:actions.search')
  const resetLabel = clearLabel ?? t('filters.clear')
  return (
    <>
      <Button
        type="submit"
        className={cn('gap-2 shadow-md', APP_INTERACTIVE_MOTION)}
      >
        <Search className="size-4" aria-hidden />
        {searchLabel}
      </Button>
      <Button
        type="button"
        variant="outline"
        className="gap-2 transition-colors hover:bg-app-subtle"
        onClick={onClear}
      >
        <RotateCcw className="size-3.5" aria-hidden />
        {resetLabel}
      </Button>
    </>
  )
}

/** กรอบปฏิทิน — header + loading overlay */
export function SchedulingCalendarPanel({
  title,
  subtitle,
  eventCount,
  isRefreshing,
  className,
  children,
}: {
  title?: string
  subtitle?: string
  eventCount?: number
  isRefreshing?: boolean
  className?: string
  children: ReactNode
}) {
  const { t, i18n } = useTranslation('scheduling')
  const panelTitle = title ?? t('layout.calendarPanelDefaultTitle')
  const locale = i18n.language.startsWith('th') ? 'th-TH' : 'en-US'
  return (
    <div
      className={cn(
        'scheduling-calendar-panel relative overflow-hidden rounded-card border border-app/70',
        'bg-[var(--app-surface)] shadow-[var(--app-shadow-card)]',
        'before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px',
        'before:bg-gradient-to-r before:from-transparent before:via-[color-mix(in_srgb,var(--app-accent)_35%,transparent)] before:to-transparent',
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-app/45 px-4 py-3">
        <div>
          <p className="text-body-sm font-semibold text-app">{panelTitle}</p>
          {subtitle ? <p className="text-xs text-app-muted">{subtitle}</p> : null}
        </div>
        <div className="flex items-center gap-2">
          {typeof eventCount === 'number' ? (
            <span className="rounded-full border border-app/60 bg-app-subtle/80 px-2.5 py-0.5 text-xs tabular-nums text-app-muted">
              {t('layout.eventCount', { count: eventCount.toLocaleString(locale) })}
            </span>
          ) : null}
          {isRefreshing ? (
            <span className="scheduling-calendar-panel__pulse text-xs text-app-muted">
              {t('layout.refreshing')}
            </span>
          ) : null}
        </div>
      </div>
      <div className="p-3 sm:p-4">{children}</div>
    </div>
  )
}

/** แถบ legend รวม — สีปฏิทิน + สถานะ PM */
export function SchedulingLegendRow({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        'scheduling-legend-row flex flex-col gap-3 rounded-card border border-app/60 bg-app-subtle/40 p-3 sm:flex-row sm:flex-wrap sm:items-center',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function SchedulingLegendGroup({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 text-xs text-app">
      <span className="shrink-0 font-semibold uppercase tracking-wide text-app-muted">{label}</span>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  )
}

export function SchedulingLegendSwatch({
  color,
  label,
  title,
}: {
  color: string
  label: string
  title?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-app/50 bg-[var(--app-surface)] px-2 py-0.5 shadow-sm',
        APP_INTERACTIVE_MOTION_SUBTLE,
      )}
      title={title}
    >
      <span
        className="size-2.5 shrink-0 rounded-full ring-2 ring-white/80"
        style={{ backgroundColor: color }}
        aria-hidden
      />
      <span>{label}</span>
    </span>
  )
}

type SchedulingPageHeaderProps = {
  title: string
  icon?: LucideIcon
  hints?: string[]
  badge?: ReactNode
  children?: ReactNode
  className?: string
}

/** หัวหน้า scheduling — hero gradient มาตรฐาน (เดียวกับ Dashboard) */
export function SchedulingPageHeader({
  title,
  icon: _icon,
  hints = [],
  badge,
  children,
  className,
}: SchedulingPageHeaderProps) {
  const safeHints = coerceStringArray(hints)
  return (
    <AppPageHero
      className={className}
      title={title}
      meta={
        <>
          {badge ? (
            <div className="mt-2 flex flex-wrap items-center gap-2">{badge}</div>
          ) : null}
          {safeHints.length > 0 ? <AppPageHeroHints hints={safeHints} /> : null}
        </>
      }
      actions={children}
    />
  )
}
