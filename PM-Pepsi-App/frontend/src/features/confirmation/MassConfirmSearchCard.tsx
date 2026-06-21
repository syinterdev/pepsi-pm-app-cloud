import { MassConfirmBar, MASS_CONFIRM_MAX } from '@/components/confirmation/MassConfirmBar'
import {
  MassConfirmExportPanel,
  type MassConfirmBatchResult,
} from '@/components/confirmation/MassConfirmExportPanel'
import {
  FilterSearchField,
  SchedulingFilterShell,
} from '@/components/scheduling/SchedulingFilterLayout'
import {
  SchedulingCalendarPanel,
  SchedulingFilterActions,
  SchedulingSection,
} from '@/components/scheduling/SchedulingPageLayout'
import { WktypeDisplay } from '@/components/scheduling/WktypeDisplay'
import { Badge } from '@/components/ui/badge'
import { QueryLoadErrorState } from '@/components/ui/query-load-error'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { postWorkOrdersSearch } from '@/lib/api-public'
import { cn } from '@/lib/utils'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Info, Layers } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

export function MassConfirmSearchCard({
  collapsible = false,
  defaultOpen = true,
}: {
  collapsible?: boolean
  defaultOpen?: boolean
}) {
  const { t } = useTranslation('confirmation')
  const { t: tc } = useTranslation('common')
  const [q, setQ] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [selected, setSelected] = useState<Set<number>>(() => new Set())
  const [lastBatch, setLastBatch] = useState<MassConfirmBatchResult | null>(null)

  const searchQ = useQuery({
    queryKey: ['work-orders', 'mass-confirm-search', q],
    queryFn: () =>
      postWorkOrdersSearch({
        q: q.trim() || undefined,
        activity: [],
        wktype: [],
        status: ['CRTD', 'REL'],
        wkctr: [],
        team: [],
        functionalloc: [],
        equipment: [],
      }),
    enabled: submitted,
    placeholderData: keepPreviousData,
  })

  const rows = searchQ.data ?? []
  const rowIds = useMemo(() => rows.map((r) => Number(r.id)).filter((n) => Number.isFinite(n)), [rows])
  const allSelected = rowIds.length > 0 && rowIds.every((id) => selected.has(id))
  const selectedCount = selected.size

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set())
      return
    }
    const next = new Set(rowIds.slice(0, MASS_CONFIRM_MAX))
    if (rowIds.length > MASS_CONFIRM_MAX) {
      toast.message(t('massConfirm.selectMaxSap', { max: MASS_CONFIRM_MAX }))
    }
    setSelected(next)
  }

  const toggleOne = (idiw37: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(idiw37)) {
        next.delete(idiw37)
        return next
      }
      if (next.size >= MASS_CONFIRM_MAX) {
        toast.error(t('massConfirm.selectMax', { max: MASS_CONFIRM_MAX }))
        return prev
      }
      next.add(idiw37)
      return next
    })
  }

  const clearSearch = () => {
    setQ('')
    setSubmitted(false)
    setSelected(new Set())
  }

  const onSearch = (e: FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    setSelected(new Set())
  }

  return (
    <SchedulingSection
      icon={Layers}
      title={t('massConfirm.title')}
      collapsible={collapsible}
      defaultOpen={defaultOpen}
      collapsedHint={
        submitted
          ? t('massConfirm.collapsedWithResults', {
              count: rows.length.toLocaleString(),
            })
          : t('massConfirm.collapsedSearch')
      }
      badge={
        <Badge variant="outline" className="app-tone-info-outline-badge text-xs font-normal tabular-nums">
          ≤{MASS_CONFIRM_MAX}
        </Badge>
      }
      bodyClassName="space-y-4"
    >
      <p className="app-tone-info-callout flex gap-2 rounded-xl border px-3 py-2.5 text-xs">
        <Info className="mt-0.5 size-4 shrink-0 opacity-80" aria-hidden />
        <span>{t('massConfirm.sapLimitHint', { max: MASS_CONFIRM_MAX })}</span>
      </p>

      <form onSubmit={onSearch}>
        <SchedulingFilterShell
          title={t('massConfirm.searchTitle')}
          actions={
            <SchedulingFilterActions
              onClear={clearSearch}
              submitLabel={tc('actions.search')}
              clearLabel={t('massConfirm.clear')}
            />
          }
        >
          <div className="max-w-xl">
            <FilterSearchField
              id="mass-q"
              label={t('massConfirm.searchLabel')}
              value={q}
              onChange={setQ}
              placeholder={t('massConfirm.searchPlaceholder')}
            />
          </div>
        </SchedulingFilterShell>
      </form>

      <MassConfirmBar
        selectedIds={[...selected]}
        onClearSelection={() => setSelected(new Set())}
        onBatchDone={(batch) => setLastBatch(batch)}
        onComplete={() => {
          void searchQ.refetch()
          setSelected(new Set())
        }}
      />

      {lastBatch ? (
        <MassConfirmExportPanel batch={lastBatch} onDismiss={() => setLastBatch(null)} />
      ) : null}

      {submitted ? (
        searchQ.isLoading && !searchQ.data ? (
          <Skeleton className="h-40 w-full rounded-card" aria-label={t('massConfirm.loadingSearch')} />
        ) : searchQ.isError ? (
          <QueryLoadErrorState
            title={t('massConfirm.searchFailed')}
            error={searchQ.error}
            action={{ label: tc('actions.retry'), onClick: () => void searchQ.refetch() }}
          />
        ) : (
          <SchedulingCalendarPanel
            title={t('massConfirm.resultsTitle')}
            subtitle={q.trim() ? t('massConfirm.searchSubtitle', { q: q.trim() }) : undefined}
            eventCount={rows.length}
            isRefreshing={searchQ.isFetching && !searchQ.isLoading}
          >
            {selectedCount > 0 ? (
              <p className="mb-2 text-xs text-app-muted tabular-nums">
                {t('massConfirm.tableSelectedHint', {
                  count: selectedCount,
                  max: MASS_CONFIRM_MAX,
                })}
              </p>
            ) : null}
            <div className="app-table-shell overflow-x-auto">
              <Table embedded stickyHeader zebra>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-11">
                      <input
                        type="checkbox"
                        className="size-4 rounded border-app accent-[var(--app-accent)]"
                        aria-label={t('massConfirm.selectAllAria')}
                        checked={allSelected}
                        onChange={toggleAll}
                      />
                    </TableHead>
                    <TableHead>{t('massConfirm.colWo')}</TableHead>
                    <TableHead>{t('massConfirm.colType')}</TableHead>
                    <TableHead>{t('massConfirm.colDate')}</TableHead>
                    <TableHead>{t('massConfirm.colTeam')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-caption">
                        {t('massConfirm.noResults')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.slice(0, 200).map((row) => {
                      const id = Number(row.id)
                      const isSelected = selected.has(id)
                      const selectionFull = !isSelected && selectedCount >= MASS_CONFIRM_MAX
                      return (
                        <TableRow
                          key={row.id}
                          className={cn(
                            isSelected ? 'app-tone-success-row-highlight' : undefined,
                            selectionFull ? 'opacity-60' : undefined,
                          )}
                        >
                          <TableCell className="py-2">
                            <label className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center">
                              <input
                                type="checkbox"
                                className="size-4 rounded border-app accent-[var(--app-accent)]"
                                checked={isSelected}
                                disabled={selectionFull}
                                onChange={() => toggleOne(id)}
                              />
                            </label>
                          </TableCell>
                          <TableCell className="text-xs font-medium tabular-nums">{row.wkorder}</TableCell>
                          <TableCell className="text-xs">
                            <WktypeDisplay code={row.wktype} mat={row.mat} />
                          </TableCell>
                          <TableCell className="text-xs">{row.displayDate}</TableCell>
                          <TableCell className="text-xs">{row.team || '—'}</TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </SchedulingCalendarPanel>
        )
      ) : null}
    </SchedulingSection>
  )
}
