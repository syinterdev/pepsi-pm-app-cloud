import { CanPermission } from '@/components/auth/CanPermission'
import { AppPageContent } from '@/components/layout/AppPageContent'
import { FilterDetailSummary } from '@/components/scheduling/FilterDetailSummary'
import { FilterMultiSelect } from '@/components/scheduling/FilterMultiSelect'
import { WoConfirmationLegendSection } from '@/components/scheduling/SchedulingLegends'
import {
  FilterDateField,
  FilterSearchField,
  SchedulingFilterDateRow,
  SchedulingFilterGrid,
  SchedulingFilterShell,
} from '@/components/scheduling/SchedulingFilterLayout'
import {
  SchedulingCalendarPanel,
  SchedulingFilterActions,
  SchedulingPageHeader,
  SchedulingPageSection,
  SchedulingPageStack,
  schedulingHeroLinkBtnClass,
  schedulingHeroLinkIconClass,
} from '@/components/scheduling/SchedulingPageLayout'
import { WktypeZdMappingNote } from '@/components/scheduling/WktypeZdMappingNote'
import { WorkOrderAutocomplete } from '@/components/scheduling/WorkOrderAutocomplete'
import { WorkOrderDetailDialog } from '@/components/scheduling/WorkOrderDetailDialog'
import { MassConfirmSearchCard } from '@/features/confirmation/MassConfirmSearchCard'
import { WoConfirmationTable } from '@/components/work-orders/WoConfirmationTable'
import { WoConfirmationTeamBar } from '@/components/work-orders/WoConfirmationTeamBar'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { QueryLoadErrorState } from '@/components/ui/query-load-error'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  fetchWorkOrderFilterOptions,
  patchWorkOrderTeamBatch,
  postWorkOrderFilterDetail,
  postWorkOrdersSearch,
  putWorkOrderTeam,
} from '@/lib/api-public'
import {
  applyPendingTeamToFilterDetail,
  normalizeTeamCode,
  patchRowsTeam,
  type TeamCode,
} from '@/lib/filter-detail-team-live'
import { usePermission } from '@/lib/use-permission'
import { isWorkOrderTeamCode } from '@/lib/wo-team'
import { sortWktypeFilterOptions } from '@/lib/wktype-zd-mapping'
import { zodResolver } from '@hookform/resolvers/zod'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertCircle,
  BadgeCheck,
  CalendarRange,
  CheckCircle2,
  LayoutList,
  Upload,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import type { workOrderFilterDetailResponseSchema, workOrderSearchRowSchema } from '@/api/schemas'
import { z } from 'zod'

type SearchRow = z.infer<typeof workOrderSearchRowSchema>
type FilterDetailData = z.infer<typeof workOrderFilterDetailResponseSchema>

const filterFormSchema = z.object({
  q: z.string(),
  activity: z.array(z.string()),
  wktype: z.array(z.string()),
  status: z.array(z.string()),
  wkctr: z.array(z.string()),
  team: z.array(z.string()),
  functionalloc: z.array(z.string()),
  equipment: z.array(z.string()),
  fromDate: z.string(),
  toDate: z.string(),
})

type FilterForm = z.infer<typeof filterFormSchema>

const emptyFilters = (): FilterForm => ({
  q: '',
  activity: [],
  wktype: [],
  status: [],
  wkctr: [],
  team: [],
  functionalloc: [],
  equipment: [],
  fromDate: '',
  toDate: '',
})

function countActiveWoFilters(f: FilterForm): number {
  const arrayFields: (keyof FilterForm)[] = [
    'activity',
    'wktype',
    'status',
    'wkctr',
    'team',
    'functionalloc',
    'equipment',
  ]
  let n = arrayFields.reduce((sum, key) => sum + (f[key]?.length ?? 0), 0)
  if (f.q.trim()) n += 1
  if (f.fromDate.trim()) n += 1
  if (f.toDate.trim()) n += 1
  return n
}

export function WorkOrdersPage() {
  const { t } = useTranslation('workOrders')
  const { t: ts } = useTranslation('scheduling')
  const { t: tc } = useTranslation('common')
  const { id: routeId } = useParams()
  const queryClient = useQueryClient()
  const [openId, setOpenId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())
  const [pendingTeam, setPendingTeam] = useState<Record<string, TeamCode>>({})

  const canRead = usePermission('work-orders.read')
  const canWrite = usePermission('work-orders.write')
  const canMassConfirm = usePermission('confirmation.write')

  const form = useForm<FilterForm>({
    resolver: zodResolver(filterFormSchema),
    defaultValues: emptyFilters(),
  })

  const [submitted, setSubmitted] = useState<FilterForm>(emptyFilters)

  useEffect(() => {
    if (!routeId) return
    setOpenId(routeId)
    form.setValue('q', routeId)
    setSubmitted((prev) => ({ ...prev, q: routeId }))
  }, [routeId, form])

  const optsQ = useQuery({
    queryKey: ['work-orders', 'filter-options'],
    queryFn: fetchWorkOrderFilterOptions,
    staleTime: 300_000,
    enabled: canRead,
  })

  const wktypeOptions = useMemo(
    () => sortWktypeFilterOptions(optsQ.data?.wktypes ?? []),
    [optsQ.data?.wktypes],
  )

  const submittedKey = useMemo(() => JSON.stringify(submitted), [submitted])
  const searchQueryKey = useMemo(
    () => ['work-orders', 'search', submittedKey] as const,
    [submittedKey],
  )
  const filterDetailQueryKey = useMemo(
    () => ['work-orders', 'filter-detail', submittedKey] as const,
    [submittedKey],
  )

  const searchPayload = useMemo(
    () => ({
      ...submitted,
      q: submitted.q.trim() ? submitted.q.trim() : undefined,
      fromDate: submitted.fromDate.trim() || undefined,
      toDate: submitted.toDate.trim() || undefined,
    }),
    [submitted],
  )

  const listQ = useQuery({
    queryKey: searchQueryKey,
    queryFn: () => postWorkOrdersSearch(searchPayload),
    enabled: canRead,
    placeholderData: keepPreviousData,
  })

  const filterDetailQ = useQuery({
    queryKey: filterDetailQueryKey,
    queryFn: () => postWorkOrderFilterDetail(searchPayload),
    enabled: canRead,
    placeholderData: keepPreviousData,
  })

  const rows = listQ.data ?? []
  const rowIds = useMemo(() => rows.map((r) => r.id), [rows])

  const liveFilterDetail = useMemo(() => {
    if (!filterDetailQ.data) return { data: undefined, hasPendingChanges: false }
    return applyPendingTeamToFilterDetail(filterDetailQ.data, rows, pendingTeam)
  }, [filterDetailQ.data, rows, pendingTeam])

  useEffect(() => {
    setPendingTeam({})
    setSelectedIds(new Set())
  }, [submittedKey])

  useEffect(() => {
    if (!listQ.data) return
    setPendingTeam((prev) => {
      const next = { ...prev }
      const ids = new Set(listQ.data.map((r) => r.id))
      for (const key of Object.keys(next)) {
        if (!ids.has(key)) delete next[key]
      }
      for (const row of listQ.data) {
        if (!(row.id in next)) {
          next[row.id] = normalizeTeamCode(row.team)
        }
      }
      return next
    })
  }, [listQ.data])

  const patchTeamInCaches = useCallback(
    (updates: Map<string, TeamCode>) => {
      queryClient.setQueryData<SearchRow[]>(searchQueryKey, (old) => {
        if (!old) return old
        return patchRowsTeam(old, updates)
      })
      queryClient.setQueryData<FilterDetailData>(filterDetailQueryKey, (old) => {
        if (!old || rows.length === 0) return old
        const patchedRows = patchRowsTeam(rows, updates)
        return applyPendingTeamToFilterDetail(old, patchedRows, {}).data
      })
    },
    [queryClient, searchQueryKey, filterDetailQueryKey, rows],
  )

  const allPageSelected = rowIds.length > 0 && rowIds.every((id) => selectedIds.has(id))

  const toggleSelectAllPage = () => {
    if (allPageSelected) {
      setSelectedIds(new Set())
      return
    }
    setSelectedIds(new Set(rowIds))
  }

  const toggleRowSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const applyTeamToSelected = (team: TeamCode) => {
    setPendingTeam((prev) => {
      const next = { ...prev }
      for (const id of selectedIds) next[id] = team
      return next
    })
  }

  const rowTeamMut = useMutation({
    mutationFn: ({ id, team }: { id: string; team: TeamCode }) =>
      putWorkOrderTeam(id, team),
    onSuccess: async (_data, { id, team }) => {
      if (team) {
        toast.success(t('toastTeam.rowSaved', { team }))
      } else {
        toast.success(t('toastTeam.rowCleared'))
      }
      patchTeamInCaches(new Map([[id, team]]))
      setPendingTeam((prev) => ({ ...prev, [id]: team }))
      void queryClient.invalidateQueries({ queryKey: ['calendar', 'events'] })
      void queryClient.invalidateQueries({ queryKey: ['backlog', 'events'] })
    },
    onError: (e: Error) => toast.error(e.message || t('toastTeam.rowSaveFailed')),
  })

  const setRowPendingTeam = (id: string, team: TeamCode) => {
    setPendingTeam((prev) => ({ ...prev, [id]: team }))
    if (isWorkOrderTeamCode(team) || team === '') {
      rowTeamMut.mutate({ id, team })
    }
  }

  const bulkTeamMut = useMutation({
    mutationFn: async (groups: { team: TeamCode; ids: string[] }[]) => {
      const results = []
      for (const g of groups) {
        if (g.ids.length === 0) continue
        results.push(await patchWorkOrderTeamBatch({ ids: g.ids, team: g.team }))
      }
      return results
    },
    onMutate: async (groups) => {
      const updates = new Map<string, TeamCode>()
      for (const g of groups) {
        for (const id of g.ids) updates.set(id, g.team)
      }
      await queryClient.cancelQueries({ queryKey: searchQueryKey })
      const previousSearch = queryClient.getQueryData(searchQueryKey)
      const previousFilter = queryClient.getQueryData(filterDetailQueryKey)
      patchTeamInCaches(updates)
      return { previousSearch, previousFilter }
    },
    onError: (e: Error, _groups, ctx) => {
      toast.error(e.message)
      if (ctx?.previousSearch !== undefined) {
        queryClient.setQueryData(searchQueryKey, ctx.previousSearch)
      }
      if (ctx?.previousFilter !== undefined) {
        queryClient.setQueryData(filterDetailQueryKey, ctx.previousFilter)
      }
    },
    onSuccess: async (results) => {
      const updated = results.reduce((n, r) => n + r.updated.length, 0)
      const notFound = results.flatMap((r) => r.notFound)
      if (notFound.length > 0) {
        toast.warning(t('teamBulk.partial', { updated, notFound: notFound.length }))
      } else {
        toast.success(t('teamBulk.saved', { count: updated }))
      }
      setSelectedIds(new Set())
      void queryClient.invalidateQueries({ queryKey: searchQueryKey, refetchType: 'none' })
      void queryClient.invalidateQueries({ queryKey: filterDetailQueryKey })
      void queryClient.invalidateQueries({ queryKey: ['calendar', 'events'] })
      void queryClient.invalidateQueries({ queryKey: ['backlog', 'events'] })
    },
  })

  const onBulkSave = () => {
    if (selectedIds.size === 0) {
      toast.error(t('teamBulk.selectRowsFirst'))
      return
    }
    const byTeam = new Map<TeamCode, string[]>()
    for (const id of selectedIds) {
      const team = pendingTeam[id] ?? ''
      const list = byTeam.get(team) ?? []
      list.push(id)
      byTeam.set(team, list)
    }
    const groups = [...byTeam.entries()].map(([team, ids]) => ({ team, ids }))
    bulkTeamMut.mutate(groups)
  }

  const onSearch = form.handleSubmit((data) => {
    setSubmitted(data)
  })

  const clearFilters = () => {
    const empty = emptyFilters()
    form.reset(empty)
    setSubmitted(empty)
  }

  const filterCollapsedHint = useMemo(() => {
    const n = countActiveWoFilters(submitted)
    if (n === 0 && !submitted.q.trim()) return undefined
    if (submitted.q.trim()) {
      return t('search.collapsedHint', { q: submitted.q.trim() })
    }
    return t('filters.activeCount', { count: n })
  }, [submitted, t])

  const listSubtitle = useMemo(() => {
    const count = rows.length
    const q = submitted.q.trim()
    if (q) return t('search.listSubtitleQ', { q, count })
    return t('search.listSubtitle', { count })
  }, [rows.length, submitted.q, t])

  const teamBusy = bulkTeamMut.isPending || rowTeamMut.isPending
  const massConfirmOffset = canMassConfirm ? 1 : 0

  if (!canRead) {
    return (
      <>
        <SchedulingPageHeader title={t('page.title')} icon={CheckCircle2} />
        <AppPageContent>
          <EmptyState
            icon={AlertCircle}
            title={t('page.noAccessTitle')}
            description={
              <>
                {t('page.noAccessDesc')}{' '}
                <code className="text-xs">work-orders.read</code>
              </>
            }
          />
        </AppPageContent>
      </>
    )
  }

  return (
    <>
      <SchedulingPageHeader
        title={t('page.title')}
        icon={CheckCircle2}
        hints={[
          t('page.hintSearchWo'),
          t('page.hintMassConfirm'),
          t('page.hintApproveTeco'),
          t('page.hintPhotos'),
        ]}
      >
        <CanPermission permission="confirmation.read">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={schedulingHeroLinkBtnClass}
            asChild
          >
            <Link to="/confirmation">
              <BadgeCheck className={schedulingHeroLinkIconClass} aria-hidden />
              {t('links.exportConfirmation')}
            </Link>
          </Button>
        </CanPermission>
        <CanPermission permission="calendar.read">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={schedulingHeroLinkBtnClass}
            asChild
          >
            <Link to="/calendar">
              <CalendarRange className={schedulingHeroLinkIconClass} aria-hidden />
              {t('links.workSchedulingCalendar')}
            </Link>
          </Button>
        </CanPermission>
        <CanPermission permission="backlog.read">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={schedulingHeroLinkBtnClass}
            asChild
          >
            <Link to="/backlog">
              <LayoutList className={schedulingHeroLinkIconClass} aria-hidden />
              {t('links.backlog')}
            </Link>
          </Button>
        </CanPermission>
        <CanPermission permission="iw37n.read">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={schedulingHeroLinkBtnClass}
            asChild
          >
            <Link to="/iw37n">
              <Upload className={schedulingHeroLinkIconClass} aria-hidden />
              {t('links.importIw37n')}
            </Link>
          </Button>
        </CanPermission>
      </SchedulingPageHeader>

      <AppPageContent className="scheduling-page pb-8">
        <SchedulingPageStack>
          <SchedulingPageSection index={0}>
            <form onSubmit={onSearch}>
              <SchedulingFilterShell
                title={t('search.filterTitle')}
                collapsible
                defaultOpen={false}
                collapsedHint={filterCollapsedHint}
                actions={
                  <SchedulingFilterActions
                    onClear={clearFilters}
                    submitLabel={tc('actions.search')}
                    clearLabel={t('search.clear')}
                  />
                }
              >
                {optsQ.isLoading ? (
                  <Skeleton
                    className="h-32 w-full rounded-card"
                    aria-label={ts('filters.loading')}
                  />
                ) : optsQ.isError ? (
                  <EmptyState
                    icon={AlertCircle}
                    title={ts('filters.loadFailed')}
                    description={
                      optsQ.error instanceof Error
                        ? optsQ.error.message
                        : ts('filters.genericError')
                    }
                    action={{ label: tc('actions.retry'), onClick: () => void optsQ.refetch() }}
                  />
                ) : (
                  <>
                    <div className="max-w-xl space-y-1.5">
                      <Label
                        htmlFor="wo-quick-q"
                        className="text-xs font-semibold tracking-wide text-app-muted"
                      >
                        {t('search.orderNumberLabel')}
                      </Label>
                      <WorkOrderAutocomplete
                        value={form.watch('q')}
                        showSearchIcon
                        inputClassName="h-10 border-app/80 bg-[var(--app-surface)] shadow-sm transition-shadow focus-visible:shadow-md"
                        onInputChange={(v) => form.setValue('q', v)}
                        onSelect={(item) => {
                          form.setValue('q', item.wkorder)
                          setSubmitted((prev) => ({ ...prev, q: item.wkorder }))
                          setOpenId(item.id)
                        }}
                        placeholder={t('search.placeholder')}
                      />
                    </div>

                    <SchedulingFilterGrid>
                      <Controller
                        name="q"
                        control={form.control}
                        render={({ field }) => (
                          <FilterSearchField
                            id="wo-filter-q"
                            label={t('filters.labels.searchQ')}
                            value={field.value}
                            onChange={field.onChange}
                            placeholder={t('filters.searchQPlaceholder')}
                          />
                        )}
                      />
                      <Controller
                        name="activity"
                        control={form.control}
                        render={({ field }) => (
                          <FilterMultiSelect
                            label={t('filters.labels.activity')}
                            options={optsQ.data?.activities ?? []}
                            value={field.value}
                            onChange={field.onChange}
                          />
                        )}
                      />
                      <Controller
                        name="wktype"
                        control={form.control}
                        render={({ field }) => (
                          <div className="space-y-0">
                            <FilterMultiSelect
                              label={ts('filters.labels.wktype')}
                              options={wktypeOptions}
                              value={field.value}
                              onChange={field.onChange}
                            />
                            <WktypeZdMappingNote />
                          </div>
                        )}
                      />
                      <Controller
                        name="status"
                        control={form.control}
                        render={({ field }) => (
                          <FilterMultiSelect
                            label={ts('filters.labels.woStatus')}
                            options={optsQ.data?.statuses ?? []}
                            value={field.value}
                            onChange={field.onChange}
                          />
                        )}
                      />
                      <Controller
                        name="wkctr"
                        control={form.control}
                        render={({ field }) => (
                          <FilterMultiSelect
                            label={ts('filters.labels.wkctr')}
                            options={optsQ.data?.workcenters ?? []}
                            value={field.value}
                            onChange={field.onChange}
                          />
                        )}
                      />
                      <Controller
                        name="team"
                        control={form.control}
                        render={({ field }) => (
                          <FilterMultiSelect
                            label={ts('filters.team')}
                            options={optsQ.data?.teams ?? []}
                            value={field.value}
                            onChange={field.onChange}
                          />
                        )}
                      />
                      <Controller
                        name="functionalloc"
                        control={form.control}
                        render={({ field }) => (
                          <FilterMultiSelect
                            label={ts('filters.labels.fl')}
                            options={optsQ.data?.functionals ?? []}
                            value={field.value}
                            onChange={field.onChange}
                          />
                        )}
                      />
                    </SchedulingFilterGrid>

                    <details className="rounded-lg border border-dashed border-app/60 bg-app-subtle/30">
                      <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-app">
                        {t('filters.more')}
                      </summary>
                      <div className="space-y-3 border-t border-app/50 p-3">
                        <SchedulingFilterGrid className="sm:grid-cols-2">
                          <Controller
                            name="equipment"
                            control={form.control}
                            render={({ field }) => (
                              <FilterMultiSelect
                                label={t('filters.labels.equipment')}
                                options={optsQ.data?.equipments ?? []}
                                value={field.value}
                                onChange={field.onChange}
                              />
                            )}
                          />
                        </SchedulingFilterGrid>
                        <SchedulingFilterDateRow>
                          <Controller
                            name="fromDate"
                            control={form.control}
                            render={({ field }) => (
                              <FilterDateField
                                id="wo-from-date"
                                label={ts('filters.fromDate')}
                                value={field.value}
                                onChange={field.onChange}
                              />
                            )}
                          />
                          <Controller
                            name="toDate"
                            control={form.control}
                            render={({ field }) => (
                              <FilterDateField
                                id="wo-to-date"
                                label={ts('filters.toDate')}
                                value={field.value}
                                onChange={field.onChange}
                              />
                            )}
                          />
                        </SchedulingFilterDateRow>
                      </div>
                    </details>
                  </>
                )}
              </SchedulingFilterShell>
            </form>
          </SchedulingPageSection>

          {canMassConfirm ? (
            <SchedulingPageSection index={1}>
              <MassConfirmSearchCard collapsible defaultOpen={false} />
            </SchedulingPageSection>
          ) : null}

          <SchedulingPageSection index={1 + massConfirmOffset}>
            <WoConfirmationLegendSection collapsible defaultOpen={false} />
          </SchedulingPageSection>

          <SchedulingPageSection index={2 + massConfirmOffset}>
            <FilterDetailSummary
              title={t('filterSummary.title')}
              subtitle={t('filterSummary.subtitle')}
              data={liveFilterDetail.data}
              isLoading={filterDetailQ.isLoading}
              isError={filterDetailQ.isError}
              error={filterDetailQ.error as Error | null}
              teamOnly
              isLivePreview={liveFilterDetail.hasPendingChanges}
              isRefreshing={filterDetailQ.isFetching && !filterDetailQ.isLoading}
              collapsible
              defaultOpen={false}
            />
          </SchedulingPageSection>

          <SchedulingPageSection index={3 + massConfirmOffset}>
            {listQ.isLoading && !listQ.data ? (
              <SchedulingCalendarPanel
                title={t('search.listTitle')}
                subtitle={listSubtitle}
                eventCount={0}
                isRefreshing={false}
              >
                <WoConfirmationTable rows={[]} isLoading onOpenRow={setOpenId} />
              </SchedulingCalendarPanel>
            ) : listQ.isError ? (
              <QueryLoadErrorState
                title={t('search.loadFailedTitle')}
                error={listQ.error}
                description={
                  listQ.error instanceof Error
                    ? listQ.error.message
                    : t('search.loadFailedFallback')
                }
                action={{ label: tc('actions.retry'), onClick: () => void listQ.refetch() }}
              />
            ) : (
              <SchedulingCalendarPanel
                title={t('search.listTitle')}
                subtitle={listSubtitle}
                eventCount={rows.length}
                isRefreshing={listQ.isFetching && !listQ.isLoading}
              >
                {canWrite && rows.length > 0 ? (
                  <WoConfirmationTeamBar
                    selectedCount={selectedIds.size}
                    totalCount={rows.length}
                    disabled={!canWrite}
                    saving={bulkTeamMut.isPending}
                    onApplyTeam={applyTeamToSelected}
                    onSave={onBulkSave}
                  />
                ) : null}
                <WoConfirmationTable
                  rows={rows}
                  isLoading={false}
                  onOpenRow={setOpenId}
                  team={
                    canWrite
                      ? {
                          canEditTeam: true,
                          selectedIds,
                          pendingTeam,
                          allPageSelected,
                          teamBusy,
                          onToggleSelectAll: toggleSelectAllPage,
                          onToggleRow: toggleRowSelected,
                          onPendingTeamChange: setRowPendingTeam,
                        }
                      : undefined
                  }
                />
              </SchedulingCalendarPanel>
            )}
          </SchedulingPageSection>
        </SchedulingPageStack>
      </AppPageContent>

      <WorkOrderDetailDialog
        orderId={openId}
        initialTab="task-list"
        onOpenChange={(o) => !o && setOpenId(null)}
      />
    </>
  )
}
