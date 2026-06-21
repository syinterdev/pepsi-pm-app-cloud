import { ReportExportButton } from '@/components/reports/ReportExportButton'
import {
  ConfirmationSapTable,
  ConfirmationSapTableHeaderRow,
  confirmationRowMatchesSearch,
} from '@/components/confirmation/ConfirmationSapTable'
import { FilterSearchField } from '@/components/scheduling/SchedulingFilterLayout'
import {
  SchedulingCalendarPanel,
  SchedulingPageSection,
} from '@/components/scheduling/SchedulingPageLayout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { QueryLoadErrorState } from '@/components/ui/query-load-error'
import { Label } from '@/components/ui/label'
import { TableSkeletonRows } from '@/components/ui/table-skeleton'
import {
  Table,
  TableBody,
  TableHeader,
} from '@/components/ui/table'
import {
  confirmationSapCsvFilename,
  fetchConfirmationExport,
  fetchConfirmationExportCsv,
  fetchConfirmationExportXlsx,
} from '@/lib/api-public'
import {
  listKpiStaggerItemMotion,
  listKpiStaggerRootMotion,
} from '@/lib/list-kpi-stagger'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { motion, useReducedMotion } from 'framer-motion'
import { ChevronLeft, ChevronRight, ClipboardList, RotateCcw } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

const PAGE_SIZES = [25, 50, 100, 200] as const

export type ConfirmationExportTablePanelProps = {
  enabled?: boolean
  canExport?: boolean
  sectionIndex?: number
  className?: string
}

export function ConfirmationExportTablePanel({
  enabled = true,
  canExport = true,
  sectionIndex = 0,
  className,
}: ConfirmationExportTablePanelProps) {
  const { t } = useTranslation('confirmation')
  const { t: tc } = useTranslation('common')
  const reduceMotion = useReducedMotion()
  const [search, setSearch] = useState('')
  const [pageSize, setPageSize] = useState<number>(50)
  const [page, setPage] = useState(1)
  const [exporting, setExporting] = useState<'xlsx' | 'csv' | null>(null)

  const exportQ = useQuery({
    queryKey: ['confirmation', 'export', 'preview'],
    queryFn: fetchConfirmationExport,
    staleTime: 30_000,
    enabled,
    placeholderData: keepPreviousData,
  })

  const items = exportQ.data?.items ?? []
  const scope = exportQ.data?.scope
  const actorWkctr = exportQ.data?.actorWkctr ?? ''

  const filtered = useMemo(
    () => items.filter((row) => confirmationRowMatchesSearch(row, search)),
    [items, search],
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const pageStart = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1
  const pageEnd = Math.min(safePage * pageSize, filtered.length)
  const pageRows = useMemo(
    () => filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filtered, safePage, pageSize],
  )

  const onDownload = async (format: 'xlsx' | 'csv') => {
    if (!canExport) {
      toast.error(t('export.noExportPermission'))
      return
    }
    setExporting(format)
    try {
      const blob =
        format === 'xlsx'
          ? await fetchConfirmationExportXlsx()
          : await fetchConfirmationExportCsv()
      const name =
        format === 'xlsx' ? 'Export_Confirm.xlsx' : confirmationSapCsvFilename()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = name
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      toast.success(format === 'xlsx' ? t('export.downloadExcelDone') : t('export.downloadCsvDone'))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('export.exportFailed'))
    } finally {
      setExporting(null)
    }
  }

  const scopeBadge =
    scope === 'ALL' ? (
      <Badge variant="secondary" className="text-xs font-normal">
        {t('export.scopeAll')}
      </Badge>
    ) : actorWkctr ? (
      <Badge variant="outline" className="text-xs font-normal tabular-nums">
        {actorWkctr}
      </Badge>
    ) : null

  return (
    <SchedulingPageSection index={sectionIndex} className={className}>
      <SchedulingCalendarPanel
        title={t('export.title')}
        eventCount={items.length}
        isRefreshing={exportQ.isFetching && !exportQ.isLoading}
      >
        <div className="space-y-4">
          <motion.div
            className="flex flex-wrap items-end justify-between gap-3"
            {...listKpiStaggerRootMotion(reduceMotion)}
          >
            <motion.div
              className="flex flex-wrap items-center gap-2"
              {...listKpiStaggerItemMotion(reduceMotion)}
            >
              {scopeBadge}
              {canExport ? (
                <>
                  <ReportExportButton
                    format="xlsx"
                    label={t('export.exportToExcel')}
                    loading={exporting === 'xlsx'}
                    loadingLabel={t('export.exporting')}
                    disabled={exporting != null || exportQ.isFetching || items.length === 0}
                    onClick={() => void onDownload('xlsx')}
                  />
                  <ReportExportButton
                    format="csv"
                    label={t('export.csv')}
                    variant="outline"
                    loading={exporting === 'csv'}
                    loadingLabel={t('export.exporting')}
                    disabled={exporting != null || exportQ.isFetching || items.length === 0}
                    onClick={() => void onDownload('csv')}
                  />
                </>
              ) : null}
            </motion.div>
          </motion.div>

          <div className="flex flex-col gap-3 rounded-xl border border-app/60 bg-app-subtle/30 p-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-wrap items-center gap-2 text-xs text-app-muted">
              <Label htmlFor="export-page-size" className="font-medium text-app-muted">
                {t('export.show')}
              </Label>
              <select
                id="export-page-size"
                className="h-9 rounded-lg border border-app/80 bg-[var(--app-surface)] px-2.5 text-xs shadow-sm"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setPage(1)
                }}
              >
                {PAGE_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
              <span>{t('export.items')}</span>
            </div>
            <div className="w-full sm:max-w-xs">
              <FilterSearchField
                id="export-search"
                label={t('export.search')}
                value={search}
                onChange={(v) => {
                  setSearch(v)
                  setPage(1)
                }}
                placeholder={t('export.searchPlaceholder')}
              />
            </div>
          </div>

          {exportQ.isLoading && !exportQ.data ? (
            <div
              className="overflow-x-auto rounded-xl border border-app/70 shadow-sm"
              aria-busy="true"
              aria-label={t('export.loadingTable')}
            >
              <Table embedded stickyHeader className="min-w-[56rem]">
                <TableHeader>
                  <ConfirmationSapTableHeaderRow />
                </TableHeader>
                <TableBody>
                  <TableSkeletonRows rows={10} columns={9} />
                </TableBody>
              </Table>
            </div>
          ) : exportQ.isError ? (
            <QueryLoadErrorState
              title={t('export.loadFailed')}
              error={exportQ.error}
              action={{ label: tc('actions.retry'), onClick: () => void exportQ.refetch() }}
            />
          ) : items.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title={t('export.noData')}
              action={{ label: t('export.refresh'), onClick: () => void exportQ.refetch() }}
            />
          ) : (
            <>
              <ConfirmationSapTable rows={pageRows} emptyMessage={t('export.noResults')} />

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-app/40 pt-3 text-xs text-app-muted">
                <p className="tabular-nums">
                  {pageStart.toLocaleString()}–{pageEnd.toLocaleString()} /{' '}
                  {filtered.length.toLocaleString()}
                </p>
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1 px-2.5"
                    disabled={safePage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="size-3.5" aria-hidden />
                    {t('export.prevPage')}
                  </Button>
                  <span className="min-w-[4rem] text-center tabular-nums">
                    {safePage} / {totalPages}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1 px-2.5"
                    disabled={safePage >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    {t('export.nextPage')}
                    <ChevronRight className="size-3.5" aria-hidden />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    disabled={exportQ.isFetching}
                    aria-label={t('export.refreshAria')}
                    onClick={() => exportQ.refetch()}
                  >
                    <RotateCcw className="size-3.5" aria-hidden />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </SchedulingCalendarPanel>
    </SchedulingPageSection>
  )
}
