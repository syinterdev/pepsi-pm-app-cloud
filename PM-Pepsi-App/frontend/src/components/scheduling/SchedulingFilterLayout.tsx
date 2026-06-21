import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { collapseHintSummary } from '@/lib/collapse-hint'
import { cn } from '@/lib/utils'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ChevronDown, Search, SlidersHorizontal } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

type SchedulingFilterShellProps = {
  title: string
  children: ReactNode
  actions?: ReactNode
  className?: string
  /** ย่อ/ขยายกรอบตัวกรอง — ค่าเริ่มต้นปิดเมื่อเปิดใช้ */
  collapsible?: boolean
  defaultOpen?: boolean
  /** แสดงใต้หัวข้อเมื่อย่อ (เช่น จำนวนเงื่อนไขที่ใช้อยู่) */
  collapsedHint?: ReactNode
}

/** กรอบตัวกรองปฏิทิน / WO / Backlog — layout สากล */
export function SchedulingFilterShell({
  title,
  children,
  actions,
  className,
  collapsible = false,
  defaultOpen = true,
  collapsedHint,
}: SchedulingFilterShellProps) {
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
        'scheduling-filter-shell overflow-hidden rounded-card border border-app/80',
        'bg-gradient-to-b from-[var(--app-surface)] to-[color-mix(in_srgb,var(--app-bg)_28%,var(--app-surface))]',
        'shadow-[var(--app-shadow-card)]',
        className,
      )}
    >
      <div
        className={cn(
          'flex items-center gap-2.5 border-b border-app/50 bg-[color-mix(in_srgb,var(--app-accent)_4%,var(--app-surface))] px-4 py-3',
          collapsible && !isOpen && 'border-b-0',
        )}
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[color-mix(in_srgb,var(--app-accent)_12%,white)] text-[var(--app-accent)]">
          <SlidersHorizontal className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-body-sm font-semibold text-app">{title}</h3>
          {collapsible && !isOpen && collapsedSummary ? (
            <p className="mt-0.5 text-xs text-app-muted">{collapsedSummary}</p>
          ) : null}
        </div>
        {collapsible ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 text-app-muted"
            aria-expanded={isOpen}
            aria-label={
              isOpen ? t('common:actions.hideFilters') : t('common:actions.showFilters')
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
      <AnimatePresence initial={false}>
        {isOpen ? (
          <motion.div
            key="filter-body"
            initial={collapsible && !reducedMotion ? { height: 0, opacity: 0 } : false}
            animate={{ height: 'auto', opacity: 1 }}
            exit={collapsible && !reducedMotion ? { height: 0, opacity: 0 } : undefined}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-4 p-4">{children}</div>
            {actions ? (
              <div className="flex flex-wrap gap-2 border-t border-app/50 bg-app-subtle/30 px-4 py-3">
                {actions}
              </div>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

export function SchedulingFilterGrid({
  className,
  children,
  ...props
}: ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function SchedulingFilterDateRow({
  className,
  children,
  ...props
}: ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'grid gap-3 sm:col-span-2 lg:col-span-3 xl:col-span-4 2xl:col-span-5',
        'sm:grid-cols-2',
        'rounded-button border border-dashed border-app/60 bg-app-subtle/35 p-3',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function FilterDateField({
  id,
  label,
  value,
  onChange,
  className,
}: {
  id: string
  label: string
  value: string
  onChange: (iso: string) => void
  className?: string
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={id} className="text-xs font-semibold tracking-wide text-app-muted">
        {label}
      </Label>
      <DatePicker
        id={id}
        value={value}
        onChange={onChange}
        className="h-10 w-full min-w-0"
      />
    </div>
  )
}

export function FilterSearchField({
  id,
  label,
  value,
  onChange,
  placeholder,
  className,
}: {
  id: string
  label: string
  value: string
  onChange: (next: string) => void
  placeholder?: string
  className?: string
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={id} className="text-xs font-semibold tracking-wide text-app-muted">
        {label}
      </Label>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-app-muted"
          aria-hidden
        />
        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="h-10 border-app/80 bg-[var(--app-surface)] pl-9 shadow-sm transition-shadow focus-visible:shadow-md"
        />
      </div>
    </div>
  )
}
