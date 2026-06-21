/**
 * PlanningTechnicianCards — การ์ดช่าง + multi-select + batch assign (P2)
 * รวม PlanningQuickAssign + PlanningMultiAssign
 */
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  formatPlanningAvailableLine,
  type PlanningWorkcenterHours,
} from '@/lib/planning-available-hours'
import {
  matchesPlanningCategoryFilter,
  woTeamToShiftLabel,
  type PlanningCategoryTag,
} from '@/lib/planning-workcenter-tags'
import { APP_GROUP_HOVER_MOTION } from '@/lib/app-motion'
import { cn } from '@/lib/utils'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  Check,
  ChevronDown,
  Expand,
  Loader2,
  Maximize2,
  Minimize2,
  Search,
  X,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { PlanningMultiAssignResult } from '@/components/scheduling/PlanningMultiAssign'

export type PlanningTechnicianCardWorkcenter = PlanningWorkcenterHours

type Props = {
  workcenters: PlanningTechnicianCardWorkcenter[]
  assignedCodes: string[]
  onBatchAssign: (codes: string[]) => Promise<PlanningMultiAssignResult>
  submitting?: boolean
  woTeam?: string | null
  className?: string
}

const CATEGORIES: PlanningCategoryTag[] = ['AA', 'BB', 'EE', 'UT']

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

function technicianLabel(w: PlanningTechnicianCardWorkcenter, noName: string): string {
  const name = (w.displayName ?? '').trim()
  if (!name || name === w.wkctr) return noName
  return name
}

function technicianInitials(w: PlanningTechnicianCardWorkcenter, noName: string): string {
  const name = technicianLabel(w, noName)
  if (name === noName) return w.wkctr.slice(0, 2).toUpperCase()
  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

function categoryLabel(tag: PlanningCategoryTag, t: ReturnType<typeof useTranslation>['t']): string {
  return t(`planning.category${tag}`)
}

function CategoryFilters({
  selected,
  onToggle,
  woTeam,
  t,
}: {
  selected: Set<PlanningCategoryTag>
  onToggle: (tag: PlanningCategoryTag) => void
  woTeam?: string | null
  t: ReturnType<typeof useTranslation>['t']
}) {
  const shiftLabel = woTeamToShiftLabel(woTeam)
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-app-muted">
        {t('planning.categoryTitle')}
      </p>
      <div className="flex flex-wrap gap-3">
        {CATEGORIES.map((tag) => (
          <label
            key={tag}
            className="flex cursor-pointer items-start gap-2 rounded-button border border-app/70 bg-[var(--app-surface)] px-3 py-2 text-body-sm shadow-sm hover:border-[color-mix(in_srgb,var(--app-accent)_30%,var(--app-border))]"
          >
            <input
              type="checkbox"
              checked={selected.has(tag)}
              onChange={() => onToggle(tag)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-[color-mix(in_srgb,var(--app-accent)_80%,black)]"
            />
            <span>
              <span className="font-mono font-semibold text-app">{tag}</span>
              <span className="mt-0.5 block text-xs text-app-muted">{categoryLabel(tag, t)}</span>
            </span>
          </label>
        ))}
      </div>
      {shiftLabel ? (
        <p className="text-xs text-app-muted">
          {t('planning.woTeamShift', { label: shiftLabel })}
        </p>
      ) : null}
    </div>
  )
}

type GridProps = {
  filtered: PlanningTechnicianCardWorkcenter[]
  assignedSet: Set<string>
  selected: Set<string>
  onToggle: (code: string) => void
  submitting: boolean
  reduceMotion: boolean | null
  size: 'compact' | 'expanded' | 'fullscreen'
  noName: string
  t: ReturnType<typeof useTranslation>['t']
}

function TechnicianCardGrid({
  filtered,
  assignedSet,
  selected,
  onToggle,
  submitting,
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
          const checked = selected.has(w.wkctr)
          const disabled = assigned || submitting
          const name = technicianLabel(w, noName)
          const availLine = formatPlanningAvailableLine(w)

          return (
            <motion.li
              key={w.wkctr}
              layout={!reduceMotion}
              variants={reduceMotion ? undefined : cardVariants}
              exit={reduceMotion ? undefined : 'exit'}
            >
              <button
                type="button"
                disabled={disabled}
                onClick={() => onToggle(w.wkctr)}
                className={cn(
                  'group relative flex w-full items-start gap-3 rounded-button border p-3 text-left shadow-sm transition-[border-color,box-shadow,background-color] duration-200',
                  assigned
                    ? 'cursor-default app-surface-panel--success'
                    : checked
                      ? 'border-[color-mix(in_srgb,var(--app-accent)_45%,var(--app-border))] bg-[color-mix(in_srgb,var(--app-accent)_8%,var(--app-surface))] ring-2 ring-[color-mix(in_srgb,var(--app-accent)_20%,transparent)]'
                      : 'border-app/70 app-surface-panel hover:border-[color-mix(in_srgb,var(--app-accent)_35%,var(--app-border))] hover:shadow-md',
                  disabled && !assigned && 'cursor-not-allowed opacity-60',
                )}
              >
                <span
                  className={cn(
                    'flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold tracking-wide',
                    APP_GROUP_HOVER_MOTION,
                    assigned
                      ? 'app-tone-success-fill'
                      : checked
                        ? 'app-tone-info-fill'
                        : 'bg-[color-mix(in_srgb,var(--app-accent)_14%,var(--app-surface))] text-[color-mix(in_srgb,var(--app-accent)_85%,var(--app-text))]',
                  )}
                >
                  {assigned ? (
                    <Check className="size-4" aria-hidden />
                  ) : checked ? (
                    <Check className="size-4" aria-hidden />
                  ) : (
                    technicianInitials(w, noName)
                  )}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-app">{name}</span>
                  <span className="mt-0.5 block font-mono text-xs text-app-muted">{w.wkctr}</span>
                  {availLine ? (
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
                  ) : null}
                </span>

                {assigned ? (
                  <span className="app-tone-success-badge mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                    {t('shared.assigned')}
                  </span>
                ) : null}
              </button>
            </motion.li>
          )
        })}
      </AnimatePresence>
    </motion.ul>
  )
}

export function PlanningTechnicianCards({
  workcenters,
  assignedCodes,
  onBatchAssign,
  submitting = false,
  woTeam,
  className,
}: Props) {
  const { t } = useTranslation(['scheduling', 'common'])
  const reduceMotion = useReducedMotion()
  const noName = t('shared.noName')
  const [open, setOpen] = useState(true)
  const [search, setSearch] = useState('')
  const [tallView, setTallView] = useState(false)
  const [fullscreenOpen, setFullscreenOpen] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState<Set<PlanningCategoryTag>>(new Set())
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [lastResult, setLastResult] = useState<PlanningMultiAssignResult | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const assignedSet = useMemo(() => new Set(assignedCodes.map((c) => c.trim())), [assignedCodes])

  const items = useMemo(
    () => workcenters.filter((w) => w.wkctr.trim().length > 0),
    [workcenters],
  )

  const q = search.trim().toLowerCase()
  const filtered = useMemo(() => {
    return items.filter((w) => {
      if (q) {
        const hit =
          w.wkctr.toLowerCase().includes(q) || (w.displayName ?? '').toLowerCase().includes(q)
        if (!hit) return false
      }
      return matchesPlanningCategoryFilter(w, categoryFilter)
    })
  }, [items, q, categoryFilter])

  const availableCount = items.filter((w) => !assignedSet.has(w.wkctr)).length
  const selectedCount = selected.size
  const gridSize = tallView ? 'expanded' : 'compact'

  function toggleCategory(tag: PlanningCategoryTag) {
    setCategoryFilter((prev) => {
      const next = new Set(prev)
      if (next.has(tag)) next.delete(tag)
      else next.add(tag)
      return next
    })
  }

  function toggleSelect(code: string) {
    if (assignedSet.has(code)) return
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(code)) next.delete(code)
      else next.add(code)
      return next
    })
    setLastResult(null)
    setErrorMsg(null)
  }

  function clearSelection() {
    setSelected(new Set())
    setLastResult(null)
    setErrorMsg(null)
  }

  async function handleBatchAssign() {
    if (submitting || selected.size === 0) return
    setLastResult(null)
    setErrorMsg(null)
    try {
      const codes = Array.from(selected)
      const res = await onBatchAssign(codes)
      setLastResult(res)
      setSelected((prev) => {
        const next = new Set(prev)
        for (const c of res.assigned) next.delete(c)
        for (const c of res.skipped) next.delete(c)
        return next
      })
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : t('filters.genericError'))
    }
  }

  const gridProps = {
    filtered,
    assignedSet,
    selected,
    onToggle: toggleSelect,
    submitting,
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
                <p className="font-medium text-app">{t('planning.cardsTitle')}</p>
                <p className="text-xs text-app-muted">
                  {t('planning.cardsDesc', { count: availableCount })}
                </p>
              </div>
            </button>

            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[color-mix(in_srgb,var(--app-accent)_12%,var(--app-surface))] px-2.5 py-1 text-xs font-medium text-app tabular-nums">
                {t('shared.people', { count: items.length })}
              </span>
              {selectedCount > 0 ? (
                <span className="rounded-full bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white tabular-nums">
                  {t('planning.selectedCount', { count: selectedCount })}
                </span>
              ) : null}
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setOpen(true)
                  setTallView((v) => !v)
                }}
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
              key="planning-cards-body"
              initial={reduceMotion ? false : { height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden border-t border-app/60"
            >
              <div className="space-y-4 p-4">
                <CategoryFilters
                  selected={categoryFilter}
                  onToggle={toggleCategory}
                  woTeam={woTeam}
                  t={t}
                />

                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-app-muted"
                    aria-hidden
                  />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t('planning.searchTech')}
                    className="h-10 pl-9"
                  />
                </div>

                <TechnicianCardGrid {...gridProps} size={gridSize} />

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-app/60 pt-3">
                  <p className="text-xs text-app-muted">
                    {t('planning.stats', {
                      total: items.length,
                      assigned: assignedSet.size,
                      available: availableCount,
                    })}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedCount > 0 ? (
                      <Button type="button" size="sm" variant="ghost" onClick={clearSelection}>
                        {t('planning.clearSelection')}
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleBatchAssign}
                      disabled={submitting || selectedCount === 0}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="size-4 animate-spin" aria-hidden />
                          {t('planning.submitting')}
                        </>
                      ) : (
                        t('planning.assignSelected', { count: selectedCount })
                      )}
                    </Button>
                  </div>
                </div>

                {lastResult ? (
                  <div className="rounded border border-app/70 app-surface-panel p-2 text-xs text-app">
                    <p>
                      {t('planning.resultSummary', {
                        added: lastResult.assigned.length,
                        skipped: lastResult.skipped.length,
                        notFound: lastResult.notFound.length,
                      })}
                    </p>
                  </div>
                ) : null}
                {errorMsg ? <p className="app-tone-danger-text text-xs">{errorMsg}</p> : null}
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
              key="planning-cards-backdrop"
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              aria-label={t('shared.closeExpanded')}
              className="fixed inset-0 z-[100] bg-black/45 backdrop-blur-[2px]"
              onClick={() => setFullscreenOpen(false)}
            />
            <motion.div
              key="planning-cards-fullscreen"
              role="dialog"
              aria-modal="true"
              initial={reduceMotion ? false : { opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              className="fixed inset-3 z-[101] flex flex-col overflow-hidden rounded-dialog border border-app bg-[var(--app-surface)] shadow-app-dialog sm:inset-6"
            >
              <div className="flex shrink-0 items-start justify-between gap-3 border-b border-app/60 px-5 py-4">
                <div>
                  <p className="text-lg font-semibold text-app">{t('planning.cardsTitle')}</p>
                  <p className="mt-1 text-body-sm text-app-muted">
                    {t('planning.fullscreenCardsDesc', {
                      available: availableCount,
                      selected: selectedCount,
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
                <CategoryFilters
                  selected={categoryFilter}
                  onToggle={toggleCategory}
                  woTeam={woTeam}
                  t={t}
                />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('planning.searchTech')}
                  className="h-10"
                />
                <TechnicianCardGrid {...gridProps} size="fullscreen" />
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </>
  )
}
