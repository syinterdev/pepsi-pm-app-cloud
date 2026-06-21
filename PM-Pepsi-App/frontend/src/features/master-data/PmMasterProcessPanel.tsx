import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { MasterDataPanelSkeleton } from '@/features/master-data/master-data-panel-ui'
import { importTasklists } from '@/lib/master-data-api'
import { useMasterDataPermissions } from '@/lib/master-data-permissions'
import { useI18nFormat } from '@/lib/use-i18n-format'
import {
  PM_MASTER_DEFAULT_FILES,
  type PmMasterDiscipline,
  type PmMasterProcessRow,
  parsePmMasterProcessWorkbook,
  pmMasterRowsToTasklistImport,
} from '@/lib/pm-master-process'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ClipboardList, Upload } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

const ALL_SHEETS = '__all__'

type PmMasterProcessPanelProps = {
  discipline: PmMasterDiscipline
}

export function PmMasterProcessPanel({ discipline }: PmMasterProcessPanelProps) {
  const { t } = useTranslation('masterData')
  const { bcp47 } = useI18nFormat()
  const { canWrite } = useMasterDataPermissions()
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [rows, setRows] = useState<PmMasterProcessRow[]>([])
  const [sheets, setSheets] = useState<string[]>([])
  const [sheetFilter, setSheetFilter] = useState(ALL_SHEETS)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [fileName, setFileName] = useState('')

  const filtered = useMemo(() => {
    let list = rows
    if (sheetFilter !== ALL_SHEETS) list = list.filter((r) => r.sheet === sheetFilter)
    const q = search.trim().toLowerCase()
    if (!q) return list
    return list.filter((r) =>
      [r.zone, r.machineList, r.mntplan, r.tasklist, r.legacy, r.machine, r.pmlist, r.sheet]
        .join(' ')
        .toLowerCase()
        .includes(q),
    )
  }, [rows, sheetFilter, search])

  const preview = filtered.slice(0, 200)

  const onPickFile = async (file: File | null) => {
    if (!file) return
    setLoading(true)
    setFileName(file.name)
    try {
      const parsed = await parsePmMasterProcessWorkbook(file)
      setSheets(parsed.sheets)
      setRows(parsed.rows)
      setSheetFilter(ALL_SHEETS)
      toast.success(
        t('pmMaster.loaded', {
          rows: parsed.rows.length.toLocaleString(bcp47),
          sheets: parsed.sheets.length,
        }),
      )
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('pmMaster.readFailed'))
      setRows([])
      setSheets([])
    } finally {
      setLoading(false)
    }
  }

  const importMut = useMutation({
    mutationFn: async () => {
      const payload = pmMasterRowsToTasklistImport(
        sheetFilter === ALL_SHEETS ? rows : rows.filter((r) => r.sheet === sheetFilter),
        discipline,
      )
      if (payload.length === 0) throw new Error(t('pmMaster.noImportRows'))
      return importTasklists(payload)
    },
    onSuccess: async (res) => {
      toast.success(
        t('pmMaster.imported', {
          inserted: res.inserted,
          updated: res.updated,
          skipped: res.skipped,
        }),
      )
      await qc.invalidateQueries({ queryKey: ['master-data', 'tasklist'] })
    },
    onError: (err) => toast.error((err as Error).message),
  })

  if (loading) return <MasterDataPanelSkeleton />

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3 rounded-xl border border-app/60 bg-app-subtle/30 p-3">
        <div className="space-y-1">
          <p className="text-body-sm font-semibold text-app">
            {t('pmMaster.title', { discipline })}
          </p>
          <p className="text-xs text-app-muted">
            {PM_MASTER_DEFAULT_FILES[discipline]}
            {fileName ? ` · ${fileName}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.xlsm,.xlsb"
            className="hidden"
            onChange={(e) => void onPickFile(e.target.files?.[0] ?? null)}
          />
          <Button type="button" size="sm" variant="outline" className="gap-2" onClick={() => fileRef.current?.click()}>
            <Upload className="size-4" aria-hidden />
            {t('pmMaster.loadExcel')}
          </Button>
          {canWrite && rows.length > 0 ? (
            <Button
              type="button"
              size="sm"
              className="gap-2"
              disabled={importMut.isPending}
              onClick={() => importMut.mutate()}
            >
              {importMut.isPending ? t('pmMaster.importing') : t('pmMaster.importBtn')}
            </Button>
          ) : null}
        </div>
      </div>

      {rows.length > 0 ? (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-[10rem] space-y-1.5">
              <Label htmlFor={`pm-sheet-${discipline}`} className="text-xs font-semibold text-app-muted">
                {t('pmMaster.sheet')}
              </Label>
              <select
                id={`pm-sheet-${discipline}`}
                className="h-9 w-full rounded-lg border border-app/80 bg-[var(--app-surface)] px-2.5 text-xs shadow-sm"
                value={sheetFilter}
                onChange={(e) => setSheetFilter(e.target.value)}
              >
                <option value={ALL_SHEETS}>{t('pmMaster.allSheets', { count: rows.length })}</option>
                {sheets.map((s) => (
                  <option key={s} value={s}>
                    {s} ({rows.filter((r) => r.sheet === s).length})
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-[12rem] flex-1 space-y-1.5 sm:max-w-md">
              <Label htmlFor={`pm-search-${discipline}`} className="text-xs font-semibold text-app-muted">
                {t('pmMaster.search')}
              </Label>
              <Input
                id={`pm-search-${discipline}`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('pmMaster.searchPlaceholder')}
                className="h-9"
              />
            </div>
            <p className="pb-1 text-xs tabular-nums text-app-muted">
              {t('pmMaster.rowCount', { count: filtered.length.toLocaleString(bcp47) })}
              {preview.length < filtered.length
                ? t('pmMaster.previewShown', { count: preview.length })
                : ''}
            </p>
          </div>

          <div className="app-table-shell max-h-[min(70vh,720px)] overflow-auto rounded-xl border border-app/70">
            <Table embedded stickyHeader zebra className="min-w-[64rem]">
              <TableHeader>
                <TableRow>
                  <TableHead>Zone</TableHead>
                  <TableHead>Machine List</TableHead>
                  <TableHead>Mnt plan</TableHead>
                  <TableHead>Task list</TableHead>
                  <TableHead>Legacy</TableHead>
                  <TableHead>M/C</TableHead>
                  <TableHead>PM list</TableHead>
                  <TableHead className="text-right">days</TableHead>
                  <TableHead className="text-right">Min</TableHead>
                  <TableHead className="text-right">Man</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {preview.map((row, idx) => (
                  <TableRow key={`${row.sheet}-${row.legacy}-${row.pmlist}-${idx}`}>
                    <TableCell className="text-xs font-medium">{row.zone}</TableCell>
                    <TableCell className="max-w-[10rem] truncate text-xs" title={row.machineList}>
                      {row.machineList}
                    </TableCell>
                    <TableCell className="tabular-nums text-xs">{row.mntplan}</TableCell>
                    <TableCell className="tabular-nums text-xs">{row.tasklist}</TableCell>
                    <TableCell className="text-xs">{row.legacy}</TableCell>
                    <TableCell className="max-w-[8rem] truncate text-xs" title={row.machine}>
                      {row.machine}
                    </TableCell>
                    <TableCell className="max-w-[16rem] truncate text-xs" title={row.pmlist}>
                      {row.pmlist}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-xs">{row.pmday ?? '—'}</TableCell>
                    <TableCell className="text-right tabular-nums text-xs">{row.pmmin ?? '—'}</TableCell>
                    <TableCell className="text-right tabular-nums text-xs">{row.pmman ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      ) : (
        <EmptyState
          icon={ClipboardList}
          title={t('pmMaster.emptyTitle')}
          description={t('pmMaster.emptyDesc', { file: PM_MASTER_DEFAULT_FILES[discipline] })}
          action={{ label: t('pmMaster.pickFile'), onClick: () => fileRef.current?.click() }}
        />
      )}
    </div>
  )
}
