import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { fetchWorkcenters } from '@/lib/api-public'
import { cn } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Building2, ChevronDown } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

type WorkcenterItem = Awaited<ReturnType<typeof fetchWorkcenters>>[number]

function wkctrSortKey(code: string): number {
  if (code.startsWith('PAC')) return 0
  if (code.startsWith('PRO')) return 1
  if (code.startsWith('UTI')) return 2
  return 3
}

function sortWorkcenters(items: WorkcenterItem[]): WorkcenterItem[] {
  return [...items].sort((a, b) => {
    const g = wkctrSortKey(a.wkctr) - wkctrSortKey(b.wkctr)
    if (g !== 0) return g
    return a.wkctr.localeCompare(b.wkctr)
  })
}

type Props = {
  selectedWkctr: string[]
  onWkctrChange: (codes: string[]) => void
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  onStartDateChange: (v: string) => void
  onEndDateChange: (v: string) => void
  onStartTimeChange: (v: string) => void
  onEndTimeChange: (v: string) => void
  defaultOpen?: boolean
}

export function CalendarWorkCenterFilter({
  selectedWkctr,
  onWkctrChange,
  startDate,
  endDate,
  startTime,
  endTime,
  onStartDateChange,
  onEndDateChange,
  onStartTimeChange,
  onEndTimeChange,
  defaultOpen = false,
}: Props) {
  const { t } = useTranslation('scheduling')
  const reduceMotion = useReducedMotion()
  const [open, setOpen] = useState(defaultOpen)

  const workcentersQ = useQuery({
    queryKey: ['workcenters', 'eng'],
    queryFn: fetchWorkcenters,
    staleTime: 300_000,
    enabled: open,
  })

  const sorted = useMemo(
    () => sortWorkcenters(workcentersQ.data ?? []),
    [workcentersQ.data],
  )

  const selectedSet = useMemo(() => new Set(selectedWkctr), [selectedWkctr])

  const toggleWkctr = (code: string) => {
    if (selectedSet.has(code)) {
      onWkctrChange(selectedWkctr.filter((c) => c !== code))
    } else {
      onWkctrChange([...selectedWkctr, code])
    }
  }

  const summary =
    selectedWkctr.length > 0
      ? t('workCenterFilter.selectedCount', { count: selectedWkctr.length })
      : t('workCenterFilter.expandHint')

  return (
    <div className="app-tone-info-section-gradient col-span-full overflow-hidden rounded-xl border shadow-sm">
      <button
        type="button"
        className="flex w-full items-center gap-2 p-3 text-left transition-colors hover:bg-[color-mix(in_srgb,var(--status-info)_8%,var(--app-surface))] sm:p-4"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="app-tone-info-card-index flex size-8 shrink-0 items-center justify-center rounded-lg">
          <Building2 className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-app">{t('workCenterFilter.title')}</p>
          <p className="truncate text-[11px] text-app-muted">{summary}</p>
        </div>
        {selectedWkctr.length > 0 ? (
          <span className="app-tone-info-progress hidden shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold sm:inline">
            {selectedWkctr.length}
          </span>
        ) : null}
        <ChevronDown
          className={cn(
            'app-tone-info-icon size-5 shrink-0 transition-transform duration-200',
            open && 'rotate-180',
          )}
          aria-hidden
        />
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="body"
            initial={reduceMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="app-tone-info-inner space-y-3 border-t px-3 pb-3 pt-3 sm:px-4 sm:pb-4">
              <p className="text-[11px] text-app-muted">{t('workCenterFilter.description')}</p>

              <div className="grid gap-3 lg:grid-cols-2">
                <div className="flex flex-wrap items-center gap-2 rounded-lg border border-app/50 app-surface-panel--soft px-3 py-2">
                  <span className="shrink-0 text-sm font-medium text-app">
                    {t('workCenterFilter.startTime')}
                  </span>
                  <Input
                    value={startDate}
                    onChange={(e) => onStartDateChange(e.target.value)}
                    placeholder="DD.MM.YYYY"
                    className="h-9 w-[7.5rem] tabular-nums"
                    aria-label={t('workCenterFilter.startDateAria')}
                  />
                  <Input
                    value={startTime}
                    onChange={(e) => onStartTimeChange(e.target.value)}
                    placeholder="HH:MM"
                    className="h-9 w-[5.5rem] tabular-nums"
                    aria-label={t('workCenterFilter.startTimeAria')}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2 rounded-lg border border-app/50 app-surface-panel--soft px-3 py-2">
                  <span className="shrink-0 text-sm font-medium text-app">
                    {t('workCenterFilter.endTime')}
                  </span>
                  <Input
                    value={endDate}
                    onChange={(e) => onEndDateChange(e.target.value)}
                    placeholder="DD.MM.YYYY"
                    className="h-9 w-[7.5rem] tabular-nums"
                    aria-label={t('workCenterFilter.endDateAria')}
                  />
                  <Input
                    value={endTime}
                    onChange={(e) => onEndTimeChange(e.target.value)}
                    placeholder="HH:MM"
                    className="h-9 w-[5.5rem] tabular-nums"
                    aria-label={t('workCenterFilter.endTimeAria')}
                  />
                </div>
              </div>

              {workcentersQ.isLoading ? (
                <Skeleton className="h-32 w-full rounded-xl" />
              ) : workcentersQ.isError ? (
                <p className="text-sm text-form-error">{(workcentersQ.error as Error).message}</p>
              ) : (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                  {sorted.map((wc) => {
                    const isSelected = selectedSet.has(wc.wkctr)
                    return (
                      <button
                        key={wc.wkctr}
                        type="button"
                        title={wc.displayName || wc.wkctr}
                        onClick={() => toggleWkctr(wc.wkctr)}
                        className={cn(
                          'rounded-md border px-2 py-2 text-left text-xs transition-all',
                          'app-tone-info-progress border-transparent hover:opacity-90 hover:shadow-md',
                          isSelected &&
                            'shadow-md ring-2 ring-[var(--app-surface)] ring-offset-2 ring-offset-[color-mix(in_srgb,var(--status-info)_70%,var(--app-bg))]',
                        )}
                      >
                        <span className="block font-semibold tabular-nums">{wc.wkctr}</span>
                        {wc.displayName ? (
                          <span className="mt-0.5 block line-clamp-2 text-[10px] leading-tight opacity-95">
                            {wc.displayName}
                          </span>
                        ) : null}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
