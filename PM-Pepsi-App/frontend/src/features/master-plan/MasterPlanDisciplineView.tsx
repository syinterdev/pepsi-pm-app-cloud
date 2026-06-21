import { Button } from '@/components/ui/button'
import {
  MasterDataPanelError,
  MasterDataPanelSkeleton,
} from '@/features/master-data/master-data-panel-ui'
import { MasterPlanChangeLogPanel } from '@/features/master-plan/MasterPlanChangeLogPanel'
import { MasterPlanSearchBar } from '@/features/master-plan/MasterPlanSearchBar'
import { MasterPlanSheetGrid } from '@/features/master-plan/MasterPlanSheetGrid'
import { MasterPlanSheetPicker } from '@/features/master-plan/MasterPlanSheetPicker'
import { filterMasterPlanRows } from '@/features/master-plan/master-plan-row-filter'
import { WorkOrderDetailDialog } from '@/components/scheduling/WorkOrderDetailDialog'
import {
  fetchMasterPlanSheetRows,
  fetchMasterPlanWorkbook,
  patchMasterPlanRow,
  type MasterPlanDiscipline,
  type MasterPlanSearchItem,
} from '@/lib/master-plan-api'
import { useMasterDataPermissions } from '@/lib/master-data-permissions'
import {
  readLastMasterPlanSheetId,
  writeLastMasterPlanSheetId,
} from '@/lib/master-plan-sheet-pref'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { History } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

const ROWS_PAGE = 2000

type MasterPlanDisciplineViewProps = {
  discipline: MasterPlanDiscipline
  /** Hide duplicate workbook card — use on `/master-plan` where page header shows meta */
  hideWorkbookSummary?: boolean
}

export function MasterPlanDisciplineView({
  discipline,
  hideWorkbookSummary = false,
}: MasterPlanDisciplineViewProps) {
  const { t } = useTranslation('masterData')
  const { canWrite } = useMasterDataPermissions()
  const queryClient = useQueryClient()
  const [activeSheetId, setActiveSheetId] = useState<number | null>(null)
  const [rowLimit, setRowLimit] = useState(ROWS_PAGE)
  const [changelogOpen, setChangelogOpen] = useState(false)
  const [rowSearch, setRowSearch] = useState('')
  const [focusRowId, setFocusRowId] = useState<number | null>(null)
  const [woModalId, setWoModalId] = useState<string | null>(null)

  const workbookQ = useQuery({
    queryKey: ['master-plan', 'workbook', discipline],
    queryFn: () => fetchMasterPlanWorkbook(discipline),
  })

  const sheets = workbookQ.data?.sheets ?? []

  const selectedSheetId = useMemo(() => {
    if (sheets.length === 0) return null
    const ids = new Set(sheets.map((s) => s.id))
    if (activeSheetId != null && ids.has(activeSheetId)) return activeSheetId
    const saved = readLastMasterPlanSheetId(discipline)
    if (saved != null && ids.has(saved)) return saved
    return sheets[0]?.id ?? null
  }, [activeSheetId, discipline, sheets])

  const rowsQ = useQuery({
    queryKey: ['master-plan', 'sheet-rows', discipline, selectedSheetId, rowLimit],
    queryFn: () => fetchMasterPlanSheetRows(selectedSheetId!, discipline, 0, rowLimit),
    enabled: selectedSheetId != null,
  })

  const handleSheetChange = (sheetId: number) => {
    setActiveSheetId(sheetId)
    writeLastMasterPlanSheetId(discipline, sheetId)
    setRowLimit(ROWS_PAGE)
  }

  const loadedRows = rowsQ.data?.rows ?? []
  const filteredRows = useMemo(
    () => filterMasterPlanRows(loadedRows, rowSearch),
    [loadedRows, rowSearch],
  )
  const gridData = rowsQ.data ? { ...rowsQ.data, rows: filteredRows } : null

  const handleLoadMore = () => {
    setRowLimit((prev) => prev + ROWS_PAGE)
  }

  const patchMutation = useMutation({
    mutationFn: ({
      rowId,
      column,
      value,
    }: {
      rowId: number
      column: string
      value: string
    }) => patchMasterPlanRow(rowId, { cells: { [column]: value } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['master-plan', 'sheet-rows', discipline],
      })
      await queryClient.invalidateQueries({
        queryKey: ['master-plan', 'changes'],
      })
      toast.success(t('masterPlan.saveSuccess'))
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : t('masterPlan.saveFailed'))
    },
  })

  const handlePatchCell = useCallback(
    async (rowId: number, column: string, value: string) => {
      await patchMutation.mutateAsync({ rowId, column, value })
    },
    [patchMutation],
  )

  const handleJumpToRow = useCallback(
    (sheetId: number, rowId: number, rowIndex?: number) => {
      setActiveSheetId(sheetId)
      writeLastMasterPlanSheetId(discipline, sheetId)
      if (rowIndex != null && rowIndex > rowLimit) {
        setRowLimit(Math.ceil(rowIndex / ROWS_PAGE) * ROWS_PAGE)
      }
      setFocusRowId(rowId)
    },
    [discipline, rowLimit],
  )

  const handleSearchJump = useCallback(
    (item: MasterPlanSearchItem) => {
      handleJumpToRow(item.sheetId, item.rowId, item.rowIndex)
    },
    [handleJumpToRow],
  )

  if (workbookQ.isLoading && !workbookQ.data) return <MasterDataPanelSkeleton />
  if (workbookQ.isError) {
    return (
      <MasterDataPanelError error={workbookQ.error} onRetry={() => void workbookQ.refetch()} />
    )
  }
  if (!workbookQ.data) {
    return (
      <MasterDataPanelError
        error={new Error(t('masterPlan.notSeeded'))}
        onRetry={() => void workbookQ.refetch()}
      />
    )
  }

  return (
    <div className="space-y-3">
      {!hideWorkbookSummary ? (
        <div className="rounded-xl border border-app/60 bg-app-subtle/30 p-3">
          <p className="text-body-sm font-semibold text-app">
            {t('masterPlan.workbookTitle', { discipline })}
          </p>
          <p className="mt-1 text-xs text-app-muted">
            {workbookQ.data.sourceFilename} · {t('masterPlan.sheetCount', { count: sheets.length })}
          </p>
        </div>
      ) : null}

      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="min-w-0 flex-1">
          <MasterPlanSheetPicker
            sheets={sheets}
            selectedSheetId={selectedSheetId}
            onSelect={handleSheetChange}
          />
        </div>
        <Button
          type="button"
          size="sm"
          className="h-10 shrink-0 gap-2 bg-[#2f5597] px-4 text-sm font-semibold text-white shadow-md ring-2 ring-white/20 hover:bg-[#1f3864] focus-visible:ring-white/40"
          onClick={() => setChangelogOpen(true)}
        >
          <History className="size-4" />
          {t('masterPlan.changelog')}
        </Button>
      </div>

      <MasterPlanSearchBar
        discipline={discipline}
        value={rowSearch}
        onChange={setRowSearch}
        onJumpToResult={handleSearchJump}
        currentSheetMatchCount={filteredRows.length}
        loadedRowCount={loadedRows.length}
      />

      <MasterPlanChangeLogPanel
        discipline={discipline}
        sheets={sheets}
        open={changelogOpen}
        onOpenChange={setChangelogOpen}
        onJumpToRow={handleJumpToRow}
      />

      {rowsQ.isLoading && !rowsQ.data ? (
        <MasterDataPanelSkeleton columns={8} rows={12} />
      ) : rowsQ.isError ? (
        <MasterDataPanelError error={rowsQ.error} onRetry={() => void rowsQ.refetch()} />
      ) : gridData ? (
        <MasterPlanSheetGrid
          data={gridData}
          canWrite={canWrite}
          onPatchCell={canWrite ? handlePatchCell : undefined}
          focusRowId={focusRowId}
          onFocusRowHandled={() => setFocusRowId(null)}
          onOpenWorkOrder={(wkorder) => setWoModalId(wkorder)}
          onLoadMore={rowsQ.data && rowsQ.data.total > loadedRows.length ? handleLoadMore : undefined}
          loadingMore={rowsQ.isFetching && rowLimit > ROWS_PAGE}
          searchQuery={rowSearch}
          loadedRowCount={loadedRows.length}
        />
      ) : null}

      <WorkOrderDetailDialog
        orderId={woModalId}
        onOpenChange={(open) => {
          if (!open) setWoModalId(null)
        }}
        initialTab="task-list"
      />
    </div>
  )
}
