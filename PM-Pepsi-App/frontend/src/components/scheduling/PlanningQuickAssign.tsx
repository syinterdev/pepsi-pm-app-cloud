import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatPlanningAvailableLine, type PlanningWorkcenterHours } from '@/lib/planning-available-hours'
import { APP_GROUP_HOVER_MOTION } from '@/lib/app-motion'
import { cn } from '@/lib/utils'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Check, ChevronDown, Expand, Loader2, Maximize2, Minimize2, Search, UserPlus, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

export type PlanningQuickAssignWorkcenter = PlanningWorkcenterHours

type Props = {
  workcenters: PlanningQuickAssignWorkcenter[]
  assignedCodes: string[]
  onAssign: (code: string) => void
  submitting?: boolean
  assigningCode?: string | null
  className?: string
}

const listVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.03, delayChildren: 0.04 },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.96 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] as const },
  },
  exit: { opacity: 0, scale: 0.94, transition: { duration: 0.14 } },
}

function technicianLabel(w: PlanningQuickAssignWorkcenter, noName: string): string {
  const name = (w.displayName ?? '').trim()
  if (!name || name === w.wkctr) return noName
  return name
}

function technicianInitials(w: PlanningQuickAssignWorkcenter, noName: string): string {
  const name = technicianLabel(w, noName)
  if (name === noName) return w.wkctr.slice(0, 2).toUpperCase()
  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

type GridProps = {
  filtered: PlanningQuickAssignWorkcenter[]
  assignedSet: Set<string>
  submitting: boolean
  assigningCode: string | null
  onAssign: (code: string) => void
  reduceMotion: boolean | null
  size: 'compact' | 'expanded' | 'fullscreen'
  noName: string
  t: ReturnType<typeof useTranslation>['t']
}

function TechnicianAssignGrid({
  filtered,
  assignedSet,
  submitting,
  assigningCode,
  onAssign,
  reduceMotion,
  size,
  noName,
  t,
}: GridProps) {
  if (filtered.length === 0) {
    return (
      <p className="rounded-button border border-dashed border-app px-3 py-6 text-center text-caption text-app-muted">
        {t('planning.noTechMatch')}
      </p>
    )
  }

  return (
    <motion.ul
      layout={!reduceMotion}
      variants={reduceMotion ? undefined : listVariants}
      initial={reduceMotion ? false : 'hidden'}
      animate="show"
      className={cn(
        'grid gap-2 overflow-auto pr-1',
        size === 'compact' && 'max-h-72 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
        size === 'expanded' && 'max-h-[min(70vh,720px)] grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
        size === 'fullscreen' &&
          'min-h-0 flex-1 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
      )}
    >
      <AnimatePresence mode="popLayout">
        {filtered.map((w) => {
          const assigned = assignedSet.has(w.wkctr)
          const pending = submitting && assigningCode === w.wkctr
          const disabled = assigned || (submitting && !pending)
          const name = technicianLabel(w, noName)

          return (
            <motion.li
              key={w.wkctr}
              layout={!reduceMotion}
              variants={reduceMotion ? undefined : cardVariants}
              exit={reduceMotion ? undefined : 'exit'}
            >
              <motion.button
                type="button"
                disabled={disabled}
                onClick={() => onAssign(w.wkctr)}
                whileHover={
                  reduceMotion || disabled
                    ? undefined
                    : { y: -2, scale: 1.01, transition: { duration: 0.16 } }
                }
                whileTap={
                  reduceMotion || disabled ? undefined : { scale: 0.98, transition: { duration: 0.1 } }
                }
                className={cn(
                  'group relative flex w-full items-start gap-3 rounded-button border p-3 text-left shadow-sm transition-[border-color,box-shadow,background-color] duration-200',
                  assigned
                    ? 'cursor-default app-surface-panel--success'
                    : 'border-app/70 app-surface-panel hover:border-[color-mix(in_srgb,var(--app-accent)_35%,var(--app-border))] hover:shadow-md',
                  pending && 'ring-2 ring-[color-mix(in_srgb,var(--app-accent)_25%,transparent)]',
                  disabled && !assigned && 'cursor-not-allowed opacity-60',
                )}
              >
                <span
                  className={cn(
                    'flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold tracking-wide',
                    APP_GROUP_HOVER_MOTION,
                    assigned
                      ? 'app-tone-success-fill'
                      : 'bg-[color-mix(in_srgb,var(--app-accent)_14%,var(--app-surface))] text-[color-mix(in_srgb,var(--app-accent)_85%,var(--app-text))]',
                  )}
                >
                  {pending ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                  ) : assigned ? (
                    <Check className="size-4" aria-hidden />
                  ) : (
                    technicianInitials(w, noName)
                  )}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-app">{name}</span>
                  <span className="mt-0.5 block font-mono text-xs text-app-muted">{w.wkctr}</span>
                  {(() => {
                    const availLine = formatPlanningAvailableLine(w)
                    return availLine ? (
                      <span
                        className={cn(
                          'mt-1 block text-[10px] font-medium leading-tight',
                          w.availableHours != null && w.availableHours <= 0
                            ? 'app-tone-danger-text'
                            : 'app-tone-info-strong',
                        )}
                      >
                        {availLine}
                      </span>
                    ) : null
                  })()}
                </span>

                {!assigned ? (
                  <UserPlus
                    className="mt-0.5 size-4 shrink-0 text-app-muted opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                    aria-hidden
                  />
                ) : (
                  <span className="app-tone-success-badge mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                    {t('shared.assigned')}
                  </span>
                )}
              </motion.button>
            </motion.li>
          )
        })}
      </AnimatePresence>
    </motion.ul>
  )
}

function SearchField({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  className?: string
}) {
  return (
    <div className={cn('relative', className)}>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-app-muted"
        aria-hidden
      />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 pl-9"
      />
    </div>
  )
}

export function PlanningQuickAssign({
  workcenters,
  assignedCodes,
  onAssign,
  submitting = false,
  assigningCode = null,
  className,
}: Props) {
  const { t } = useTranslation(['scheduling', 'common'])
  const reduceMotion = useReducedMotion()
  const noName = t('shared.noName')
  const [open, setOpen] = useState(true)
  const [search, setSearch] = useState('')
  const [tallView, setTallView] = useState(false)
  const [fullscreenOpen, setFullscreenOpen] = useState(false)

  const assignedSet = useMemo(() => new Set(assignedCodes.map((c) => c.trim())), [assignedCodes])

  const items = useMemo(
    () => workcenters.filter((w) => w.wkctr.trim().length > 0),
    [workcenters],
  )

  const q = search.trim().toLowerCase()
  const filtered = useMemo(() => {
    if (!q) return items
    return items.filter(
      (w) =>
        w.wkctr.toLowerCase().includes(q) ||
        (w.displayName ?? '').toLowerCase().includes(q),
    )
  }, [items, q])

  const availableCount = items.length - assignedSet.size
  const gridSize = tallView ? 'expanded' : 'compact'

  const gridProps = {
    filtered,
    assignedSet,
    submitting,
    assigningCode,
    onAssign,
    reduceMotion,
    noName,
    t,
  }

  return (
    <>
      <div
        className={cn(
          'overflow-hidden rounded-card border border-app/80 bg-[var(--app-surface)] shadow-sm',
          className,
        )}
      >
        <div className="border-b border-app/60 px-4 py-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="flex min-w-0 flex-1 items-start gap-2 text-left transition-colors hover:opacity-90"
            >
              <ChevronDown
                className={cn(
                  'mt-0.5 size-4 shrink-0 text-app-muted transition-transform duration-200',
                  open && 'rotate-180',
                )}
                aria-hidden
              />
              <div className="min-w-0">
                <p className="font-medium text-app">{t('planning.quickTitle')}</p>
                <p className="text-xs text-app-muted">
                  {t('planning.quickDesc', { count: availableCount })}
                </p>
              </div>
            </button>

            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[color-mix(in_srgb,var(--app-accent)_12%,var(--app-surface))] px-2.5 py-1 text-xs font-medium text-app tabular-nums">
                {t('shared.people', { count: items.length })}
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setOpen(true)
                  setTallView((v) => !v)
                }}
                className={cn(tallView && 'border-[color-mix(in_srgb,var(--app-accent)_40%,var(--app-border))] bg-[color-mix(in_srgb,var(--app-accent)_8%,var(--app-surface))]')}
              >
                {tallView ? (
                  <>
                    <Minimize2 className="size-3.5" aria-hidden />
                    {t('shared.collapse')}
                  </>
                ) : (
                  <>
                    <Maximize2 className="size-3.5" aria-hidden />
                    {t('shared.expand')}
                  </>
                )}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setOpen(true)
                  setFullscreenOpen(true)
                }}
              >
                <Expand className="size-3.5" aria-hidden />
                {t('shared.fullscreen')}
              </Button>
            </div>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {open ? (
            <motion.div
              key="quick-assign-body"
              initial={reduceMotion ? false : { height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden border-t border-app/60"
            >
              <div className="space-y-3 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <SearchField
                    value={search}
                    onChange={setSearch}
                    placeholder={t('planning.searchTech')}
                    className="min-w-[220px] flex-1"
                  />
                  {!tallView ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="shrink-0 text-[color-mix(in_srgb,var(--app-accent)_80%,black)]"
                      onClick={() => setTallView(true)}
                    >
                      <Maximize2 className="size-3.5" aria-hidden />
                      {t('planning.expandArea')}
                    </Button>
                  ) : null}
                </div>
                <TechnicianAssignGrid {...gridProps} size={gridSize} />
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {fullscreenOpen ? (
          <>
            <motion.button
              type="button"
              key="quick-assign-backdrop"
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              aria-label={t('shared.closeExpanded')}
              className="fixed inset-0 z-[100] bg-black/45 backdrop-blur-[2px]"
              onClick={() => setFullscreenOpen(false)}
            />
            <motion.div
              key="quick-assign-fullscreen"
              role="dialog"
              aria-modal="true"
              aria-labelledby="quick-assign-fullscreen-title"
              initial={reduceMotion ? false : { opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-3 z-[101] flex flex-col overflow-hidden rounded-dialog border border-app bg-[var(--app-surface)] shadow-app-dialog sm:inset-6"
            >
              <div className="flex shrink-0 items-start justify-between gap-3 border-b border-app/60 px-5 py-4">
                <div>
                  <p id="quick-assign-fullscreen-title" className="text-lg font-semibold text-app">
                    {t('planning.quickTitle')}
                  </p>
                  <p className="mt-1 text-body-sm text-app-muted">
                    {t('planning.fullscreenDesc', {
                      available: availableCount,
                      assigned: assignedSet.size,
                    })}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label={t('common:actions.close')}
                  onClick={() => setFullscreenOpen(false)}
                  className="rounded-button p-2 text-app-muted transition-colors hover:bg-app-subtle hover:text-app"
                >
                  <X className="size-4" aria-hidden />
                </button>
              </div>
              <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-4">
                <SearchField
                  value={search}
                  onChange={setSearch}
                  placeholder={t('planning.searchTech')}
                />
                <TechnicianAssignGrid {...gridProps} size="fullscreen" />
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </>
  )
}
