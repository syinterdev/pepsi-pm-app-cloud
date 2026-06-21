import type { Iw37nImportPreviewResponse } from '@/api/schemas'
import { hintsFromT } from '@/lib/i18n-hints'
import { CanPermission } from '@/components/auth/CanPermission'
import { ImportReviewActionBadge } from '@/components/integration/ImportReviewActionBadge'
import { Iw37nImportReviewPanel } from '@/components/iw37n/Iw37nImportReviewPanel'
import { ReportExportButton } from '@/components/reports/ReportExportButton'
import { AppCard } from '@/components/layout/AppCard'
import { AppPageSection, AppPageSectionCard, AppPageShell } from '@/components/layout/AppPageShell'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { QueryLoadErrorState } from '@/components/ui/query-load-error'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { TableSkeletonRows } from '@/components/ui/table-skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  fetchIw37nBatchCsv,
  fetchIw37nBatchRows,
  fetchIntegrationStatus,
  fetchIw37nBatches,
  fetchIw37nItem,
  fetchIw37nItems,
  postIntegrationJobsRun,
  postIw37nImport,
  postIw37nImportPreview,
  putIw37nItem,
} from '@/lib/api-public'
import { formatEpochSecondsToDdMmYyyy } from '@/lib/master-data-api'
import { useAnyPermission, usePermission } from '@/lib/use-permission'
import { cn } from '@/lib/utils'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertCircle,
  ClipboardCheck,
  ClipboardList,
  FolderSync,
  History,
  Pencil,
  Table2,
  Upload,
} from 'lucide-react'
import { useRef, useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import type { TFunction } from 'i18next'

function duplicateToastMsg(t: TFunction<'integration'>, batchId: string | null): string {
  return t('toast.duplicateSha', {
    batchRef: batchId ? t('toast.duplicateShaRef', { id: batchId }) : '',
  })
}

export function Iw37nPage() {
  const { t } = useTranslation('integration')
  const [searchParams] = useSearchParams()
  const canRead = usePermission('iw37n.read')
  const canWrite = usePermission('iw37n.write')
  const canImport = useAnyPermission(['iw37n.import', 'iw37n.write'])
  const canIntegration = usePermission('integration.admin')
  const canRunFolderScan = canImport || canIntegration
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [lastImport, setLastImport] = useState<{
    batchId: string
    fileName: string
    sha256: string
    status: string
    isDuplicate: boolean
    duplicateOfBatchId: string | null
    rows: Array<{
      rowNo: number
      action: 'inserted' | 'updated' | 'skipped' | 'error'
      wkorder: string
      opac: string
      mntplan: string
      wktype: string
      mat: string
      syst: string
      message: string
    }>
  } | null>(null)
  const [batchViewOpen, setBatchViewOpen] = useState(false)
  const [batchViewId, setBatchViewId] = useState<string | null>(null)
  const [batchViewFileName, setBatchViewFileName] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  const openBatchView = (batchId: string, fileName?: string) => {
    setBatchViewId(batchId)
    setBatchViewFileName(fileName ?? null)
    setBatchViewOpen(true)
  }
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [importPreview, setImportPreview] = useState<Iw37nImportPreviewResponse | null>(null)

  const integrationQ = useQuery({
    queryKey: ['integration', 'status'],
    queryFn: fetchIntegrationStatus,
    enabled: canRunFolderScan,
    staleTime: 15_000,
    retry: false,
    placeholderData: keepPreviousData,
  })

  const folderScanMut = useMutation({
    mutationFn: postIntegrationJobsRun,
    onSuccess: async (data) => {
      await qc.invalidateQueries({ queryKey: ['integration', 'status'] })
      await qc.invalidateQueries({ queryKey: ['iw37n', 'batches'] })
      const s = data.job.summary as {
        filesProcessed?: number
        filesFailed?: number
        filesFound?: number
      }
      toast.success(
        t('toast.scanFolderDone', {
          status: data.job.status,
          processed: s.filesProcessed ?? 0,
          found: s.filesFound ?? 0,
        }),
      )
    },
    onError: () => toast.error(t('toast.scanFailed')),
  })

  const downloadBlob = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    a.style.display = 'none'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const downloadCsv = async (batchId: string) => {
    try {
      setExporting(true)
      const blob = await fetchIw37nBatchCsv(batchId)
      downloadBlob(blob, `iw37n-import-batch-${batchId}.csv`)
    } catch {
      toast.error(t('toast.downloadFailed'))
    } finally {
      setExporting(false)
    }
  }

  const downloadXlsx = async (batchId: string, fileNameHint?: string) => {
    try {
      setExporting(true)
      const batchRows = lastImport?.batchId === batchId
        ? lastImport.rows
        : (await fetchIw37nBatchRows(batchId, { limit: 5000, offset: 0 })).items
      if (batchRows.length >= 5000) {
        toast.message(t('iw37nPage.xlsxRowLimit'))
      }
      const XLSX = await import('xlsx')
      const data = batchRows.map((r) => ({
        rowNo: r.rowNo,
        action: r.action,
        wkorder: r.wkorder,
        opac: r.opac,
        mntplan: r.mntplan,
        wktype: r.wktype,
        mat: r.mat,
        syst: r.syst,
        message: r.message,
        createdAt: 'createdAt' in r ? (r.createdAt as string) : '',
      }))
      const ws = XLSX.utils.json_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'import_rows')
      const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
      const blob = new Blob([buf], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const safeName = (fileNameHint || `iw37n-import-batch-${batchId}`).replaceAll(/[\\/:*?"<>|]+/g, '_')
      downloadBlob(blob, `${safeName}.xlsx`)
    } catch {
      toast.error(t('toast.downloadFailed'))
    } finally {
      setExporting(false)
    }
  }

  const batches = useQuery({
    queryKey: ['iw37n-batches'],
    queryFn: fetchIw37nBatches,
    placeholderData: keepPreviousData,
  })

  const previewMut = useMutation({
    mutationFn: postIw37nImportPreview,
    onSuccess: (data) => {
      setImportPreview(data)
      if (data.summary.isDuplicate) {
        toast.warning(duplicateToastMsg(t, data.summary.duplicateOfBatchId), { duration: 8000 })
      } else if (data.summary.totalRows === 0) {
        toast.error(t('iw37nPage.previewNoRows'), { duration: 10_000 })
      } else {
        toast.message(t('iw37nPage.previewChecked'))
      }
    },
    onError: () => toast.error(t('toast.genericFailed')),
  })

  const importMut = useMutation({
    mutationFn: postIw37nImport,
    onSuccess: (data) => {
      const batch = data.batch
      const rows = data.rows
      if (batch.isDuplicate && batch.duplicateOfBatchId) {
        toast.warning(duplicateToastMsg(t, batch.duplicateOfBatchId), { duration: 8000 })
      } else if (batch.rows === 0) {
        toast.error(t('iw37nPage.importBatchEmpty'), { duration: 10_000 })
      } else {
        toast.success(
          t('iw37nPage.importBatchSuccess', {
            fileName: batch.fileName,
            rows: batch.rows,
            status: batch.status,
          }),
          { duration: 12_000 },
        )
      }
      setLastImport({
        batchId: batch.id,
        fileName: batch.fileName,
        sha256: batch.sha256,
        status: batch.status,
        isDuplicate: batch.isDuplicate,
        duplicateOfBatchId: batch.duplicateOfBatchId,
        rows: rows.map((r) => ({
          rowNo: r.rowNo,
          action: r.action,
          wkorder: r.wkorder,
          opac: r.opac,
          mntplan: r.mntplan,
          wktype: r.wktype,
          mat: r.mat,
          syst: r.syst,
          message: r.message,
        })),
      })
      openBatchView(batch.id, batch.fileName)
      setImportPreview(null)
      setPendingFile(null)
      void qc.invalidateQueries({ queryKey: ['iw37n-batches'] })
      void qc.invalidateQueries({ queryKey: ['dashboard'] })
      void qc.invalidateQueries({ queryKey: ['work-orders'] })
      void qc.invalidateQueries({ queryKey: ['calendar'] })
      void qc.invalidateQueries({ queryKey: ['backlog'] })
      if (fileRef.current) fileRef.current.value = ''
    },
    onError: () => {
      toast.error(t('toast.genericFailed'))
    },
  })

  const batchViewRowsQ = useQuery({
    queryKey: ['iw37n-batch-rows', batchViewId],
    queryFn: () => fetchIw37nBatchRows(batchViewId!, { limit: 2000, offset: 0 }),
    enabled: batchViewOpen && Boolean(batchViewId),
    placeholderData: keepPreviousData,
  })
  const batchViewItems = batchViewRowsQ.data?.items ?? []

  const [itemQ, setItemQ] = useState('')
  const [itemOffset, setItemOffset] = useState(0)
  const itemLimit = 100

  useEffect(() => {
    const q = searchParams.get('q')?.trim() ?? ''
    if (q) {
      setItemQ(q)
      setItemOffset(0)
    }
  }, [searchParams])

  const itemsQ = useQuery({
    queryKey: ['iw37n-items', itemQ, itemLimit, itemOffset],
    queryFn: () => fetchIw37nItems({ q: itemQ.trim(), limit: itemLimit, offset: itemOffset }),
    placeholderData: keepPreviousData,
  })

  const parseDdMmYyyyToEpochSeconds = (v: string): number | null => {
    const s = v.trim()
    if (!s) return null
    const m = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(s)
    if (!m) return null
    const dd = Number(m[1])
    const mm = Number(m[2])
    const yyyy = Number(m[3])
    if (!Number.isFinite(dd) || !Number.isFinite(mm) || !Number.isFinite(yyyy)) return null
    const dt = new Date(yyyy, mm - 1, dd, 0, 0, 0, 0)
    const ms = dt.getTime()
    return Number.isFinite(ms) ? Math.floor(ms / 1000) : null
  }

  const parseOptionalNumber = (v: string): number | null => {
    const s = v.trim()
    if (!s) return null
    const n = Number(s)
    return Number.isFinite(n) ? n : null
  }

  const [editOpen, setEditOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editError, setEditError] = useState<string | null>(null)
  const [form, setForm] = useState({
    mntplan: '',
    wkorder: '',
    wktype: '',
    mat: '',
    bscstart: '',
    actfinish: '',
    systemstatus: '',
    opac: '',
    operationshorttext: '',
    ostdescription: '',
    cknow: '',
    wkctr: '',
    work: '',
    actwork: '',
    untime: '',
    equipment: '',
    equdescrip: '',
    functionalloc: '',
    funcdescrip: '',
    team: '',
  })

  const openEdit = async (id: number) => {
    try {
      setEditError(null)
      setEditingId(id)
      setEditOpen(true)
      const item = await fetchIw37nItem(id)
      setForm({
        mntplan: item.mntplan ?? '',
        wkorder: item.wkorder ?? '',
        wktype: item.wktype ?? '',
        mat: item.mat ?? '',
        bscstart: item.bscstart ? formatEpochSecondsToDdMmYyyy(item.bscstart) : '',
        actfinish: item.actfinish ? formatEpochSecondsToDdMmYyyy(item.actfinish) : '',
        systemstatus: item.systemstatus ?? '',
        opac: item.opac ?? '',
        operationshorttext: item.operationshorttext ?? '',
        ostdescription: item.ostdescription ?? '',
        cknow: item.cknow ?? '',
        wkctr: item.wkctr ?? '',
        work: item.work != null ? String(item.work) : '',
        actwork: item.actwork != null ? String(item.actwork) : '',
        untime: item.untime != null ? String(item.untime) : '',
        equipment: item.equipment ?? '',
        equdescrip: item.equdescrip ?? '',
        functionalloc: item.functionalloc ?? '',
        funcdescrip: item.funcdescrip ?? '',
        team: item.team ?? '',
      })
    } catch {
      toast.error(t('iw37nPage.loadItemFailed'))
      setEditOpen(false)
      setEditingId(null)
    }
  }

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!editingId) throw new Error('Invalid id')
      setEditError(null)
      const wkorder = form.wkorder.trim()
      const opac = form.opac.trim()
      if (!wkorder) throw new Error('wkorder is required')
      if (!opac) throw new Error('opac is required')
      const bscstart = parseDdMmYyyyToEpochSeconds(form.bscstart)
      if (form.bscstart.trim() && bscstart == null) throw new Error('Invalid bscstart. Expected DD.MM.YYYY')
      const actfinish = parseDdMmYyyyToEpochSeconds(form.actfinish)
      if (form.actfinish.trim() && actfinish == null) throw new Error('Invalid actfinish. Expected DD.MM.YYYY')
      const payload = {
        mntplan: form.mntplan,
        wkorder,
        wktype: form.wktype,
        mat: form.mat,
        bscstart,
        actfinish,
        systemstatus: form.systemstatus,
        opac,
        operationshorttext: form.operationshorttext,
        ostdescription: form.ostdescription,
        cknow: form.cknow,
        wkctr: form.wkctr,
        work: parseOptionalNumber(form.work),
        actwork: parseOptionalNumber(form.actwork),
        untime: parseOptionalNumber(form.untime),
        equipment: form.equipment,
        equdescrip: form.equdescrip,
        functionalloc: form.functionalloc,
        funcdescrip: form.funcdescrip,
        team: form.team.trim() ? form.team.trim() : null,
      }
      return putIw37nItem(editingId, payload)
    },
    onSuccess: async () => {
      toast.success(t('iw37nPage.saved'))
      setEditOpen(false)
      setEditingId(null)
      await qc.invalidateQueries({ queryKey: ['iw37n-items'] })
      await qc.invalidateQueries({ queryKey: ['work-orders'] })
      await qc.invalidateQueries({ queryKey: ['calendar'] })
      await qc.invalidateQueries({ queryKey: ['backlog'] })
    },
    onError: () => setEditError(t('toast.genericFailed')),
  })

  const pickFile = (): File | null => {
    const f = fileRef.current?.files?.[0] ?? pendingFile
    if (!f) {
      toast.message(t('iw37nPage.pickFileFirst'))
      return null
    }
    setPendingFile(f)
    return f
  }

  const runPreview = () => {
    const f = pickFile()
    if (!f) return
    setImportPreview(null)
    previewMut.mutate(f)
  }

  const runCommit = () => {
    if (importPreview?.summary.isDuplicate) {
      toast.warning(duplicateToastMsg(t, importPreview.summary.duplicateOfBatchId), {
        duration: 8000,
      })
    }
    const f = pendingFile ?? fileRef.current?.files?.[0]
    if (!f) {
      toast.message(t('toast.selectFileAgain'))
      return
    }
    importMut.mutate(f)
  }

  /** นำเข้าทันที (ไม่มีขั้น preview) */
  const runDirectImport = () => {
    const f = pickFile()
    if (!f) return
    setImportPreview(null)
    importMut.mutate(f)
  }

  const cancelPreview = () => {
    setImportPreview(null)
    setPendingFile(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const lastImportSectionIdx = 1
  const itemsSectionIdx = 2
  const batchSectionIdx = 3

  const folderHintText = `${t('iw37nPage.folderHint')} .csv / .xlsx / .xls ${t('iw37nPage.folderHintFiles')} inbound/iw37n ${t('iw37nPage.folderHintScan')} ${integrationQ.data?.watchIntervalMinutes ?? 10} ${t('iw37nPage.folderHintMinutes')}${integrationQ.data?.watchEnabled === false ? ` ${t('iw37nPage.folderWatchOff')}` : ''}`

  const lastImportCollapsedHint = lastImport
    ? t('iw37nPage.lastImportCollapsedSummary', {
        fileName: lastImport.fileName,
        status: lastImport.status,
        count: lastImport.rows.length,
      })
    : t('iw37nPage.lastImportEmpty')

  if (!canRead) {
    return (
      <AppPageShell title={t('iw37nPage.title')} description={t('iw37nPage.description')}>
        <EmptyState
          icon={AlertCircle}
          title={t('iw37nPage.noAccess')}
          description={
            <>
              {t('iw37nPage.noAccessDesc')} <code className="text-xs">iw37n.read</code>
            </>
          }
        />
      </AppPageShell>
    )
  }

  return (
    <AppPageShell
      title={t('iw37nPage.title')}
      description={t('iw37nPage.description')}
      hints={hintsFromT(t, 'iw37nPage.hints')}
      headerActions={
        <>
          <Badge variant="secondary" className="text-xs">
            {t('iw37nPage.badgeSap')}
          </Badge>
          <Button type="button" variant="outline" size="sm" asChild>
            <Link to="/integration">{t('iw37nPage.linkIntegration')}</Link>
          </Button>
          <CanPermission permission="planning.read">
            <Button type="button" variant="outline" size="sm" asChild>
              <Link to="/planning">{t('iw37nPage.linkPlanning')}</Link>
            </Button>
          </CanPermission>
          <CanPermission permission="work-orders.read">
            <Button type="button" variant="outline" size="sm" asChild>
              <Link to="/work-orders">{t('iw37nPage.linkWorkOrders')}</Link>
            </Button>
          </CanPermission>
        </>
      }
    >
      {(canImport || canRunFolderScan) ? (
        <AppPageSection index={0}>
          <AppPageSectionCard
            icon={canImport ? Upload : FolderSync}
            title={t('iw37nPage.importSourcesTitle')}
            description={t('iw37nPage.importSourcesDesc')}
            bodyClassName="space-y-5"
          >
            {canImport ? (
              <div className="space-y-4">
                <div>
                  <p className="text-body-sm font-semibold text-app">{t('iw37nPage.importTitle')}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-app-muted">
                    {t('iw37nPage.importHintBefore')}
                    <strong>{t('iw37nPage.importHintStrong')}</strong>
                    {t('iw37nPage.importHintAfter')}
                  </p>
                </div>
                <p className="text-xs leading-relaxed text-app-muted">
                  {t('iw37nPage.importMasterBefore')}
                  <strong>{t('iw37nPage.importMasterStrong')}</strong>
                  {t('iw37nPage.importMasterMid')}
                  <Link to="/master-plan" className="font-medium underline underline-offset-2">
                    {t('iw37nPage.importMasterLink')}
                  </Link>
                </p>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="flex-1 space-y-1">
                    <label className="text-xs font-medium text-app-muted">
                      {t('iw37nPage.selectFileLabel')}
                    </label>
                    <Input
                      ref={fileRef}
                      type="file"
                      accept=".xls,.xlsx,.xlsm,.csv"
                      onChange={() => {
                        setImportPreview(null)
                        setPendingFile(fileRef.current?.files?.[0] ?? null)
                      }}
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={runDirectImport}
                    disabled={previewMut.isPending || importMut.isPending}
                  >
                    {importMut.isPending ? t('iw37nPage.importing') : t('iw37nPage.importNow')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={runPreview}
                    disabled={previewMut.isPending || importMut.isPending}
                    className="gap-2"
                  >
                    <ClipboardCheck className="size-4" />
                    {previewMut.isPending ? t('iw37nPage.previewing') : t('iw37nPage.preview')}
                  </Button>
                </div>
                {importPreview ? (
                  <Iw37nImportReviewPanel
                    summary={importPreview.summary}
                    rows={importPreview.rows}
                    committing={importMut.isPending}
                    onCommit={runCommit}
                    onCancel={cancelPreview}
                  />
                ) : null}
              </div>
            ) : (
              <p className="text-caption text-app-muted">
                {t('iw37nPage.needImportPerm')} <code className="text-xs">iw37n.import</code>{' '}
                {t('iw37nPage.or')} <code className="text-xs">iw37n.write</code>
              </p>
            )}

            {canRunFolderScan ? (
              <div
                className={cn(
                  'space-y-3',
                  canImport && 'border-t border-app/50 pt-5',
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-body-sm font-semibold text-app">{t('iw37nPage.folderTitle')}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-app-muted">{folderHintText}</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    disabled={folderScanMut.isPending || integrationQ.isError}
                    onClick={() => folderScanMut.mutate()}
                  >
                    <FolderSync className="size-4" />
                    {folderScanMut.isPending ? t('iw37nPage.scanning') : t('iw37nPage.scanNow')}
                  </Button>
                </div>
                {integrationQ.isError ? (
                  <p className="app-tone-warning-label text-xs">
                    {t('iw37nPage.folderNotReady')}{' '}
                    <code className="text-code">075_integration_job.sql</code>
                  </p>
                ) : integrationQ.data ? (
                  <p className="break-all text-xs text-app-muted">
                    {integrationQ.data.inboundIw37nDir}
                    <span className="ml-2 text-app-muted">
                      {t('iw37nPage.folderPending', {
                        count: integrationQ.data.pendingIw37nFiles.length,
                      })}
                    </span>
                  </p>
                ) : integrationQ.isLoading ? (
                  <Skeleton className="h-4 w-full max-w-md" />
                ) : null}
                {integrationQ.data?.lastJob ? (
                  <p className="text-xs text-app-muted">
                    {t('iw37nPage.folderLastJob', {
                      id: integrationQ.data.lastJob.id,
                      status: integrationQ.data.lastJob.status,
                      time: new Date(integrationQ.data.lastJob.startedAt).toLocaleString(),
                    })}
                  </p>
                ) : null}
                {integrationQ.data && integrationQ.data.pendingIw37nFiles.length > 0 ? (
                  <ul className="list-inside list-disc text-xs text-app-muted">
                    {integrationQ.data.pendingIw37nFiles.map((f) => (
                      <li key={f.name}>
                        {t('iw37nPage.folderFileEntry', {
                          name: f.name,
                          sizeKb: Math.round(f.sizeBytes / 1024),
                        })}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}
          </AppPageSectionCard>
        </AppPageSection>
      ) : (
        <AppPageSection index={0}>
          <AppCard pad="compact">
            <p className="text-caption">
              {t('iw37nPage.needImportPerm')} <code className="text-xs">iw37n.import</code>{' '}
              {t('iw37nPage.or')} <code className="text-xs">iw37n.write</code>
            </p>
          </AppCard>
        </AppPageSection>
      )}

      <AppPageSection index={lastImportSectionIdx}>
        <AppPageSectionCard
          key={lastImport?.batchId ?? 'empty'}
          icon={ClipboardList}
          title={t('iw37nPage.lastImportTitle')}
          description={
            lastImport
              ? `${t('iw37nPage.lastImportHintBefore')}${t('iw37nPage.lastImportHintStrong')}${t('iw37nPage.lastImportHintAfter')}`
              : undefined
          }
          collapsible
          defaultOpen={Boolean(lastImport)}
          collapsedHint={lastImportCollapsedHint}
        >
          {lastImport ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-app-muted">
                  {lastImport.fileName} ({lastImport.status}) — SHA {lastImport.sha256.slice(0, 8)}…
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <ReportExportButton
                    format="csv"
                    loading={exporting}
                    disabled={exporting}
                    onClick={() => downloadCsv(lastImport.batchId)}
                  />
                  <ReportExportButton
                    format="xlsx"
                    loading={exporting}
                    disabled={exporting}
                    onClick={() => downloadXlsx(lastImport.batchId, lastImport.fileName)}
                  />
                  {lastImport.isDuplicate ? (
                    <>
                      <Badge variant="outline" className="text-xs">
                        {t('iw37nPage.duplicate')}
                      </Badge>
                      {lastImport.duplicateOfBatchId ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            openBatchView(
                              lastImport.duplicateOfBatchId!,
                              `batch-${lastImport.duplicateOfBatchId}`,
                            )
                          }
                        >
                          {t('iw37nPage.openOriginalBatch')}
                        </Button>
                      ) : null}
                    </>
                  ) : null}
                </div>
              </div>
              <div className="app-table-shell overflow-x-auto">
                <Table embedded stickyHeader zebra>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16 text-center">{t('iw37nPage.table.rowNo')}</TableHead>
                      <TableHead>{t('iw37nPage.table.result')}</TableHead>
                      <TableHead>{t('iw37nPage.table.woOp')}</TableHead>
                      <TableHead>{t('iw37nPage.table.mntplan')}</TableHead>
                      <TableHead>{t('iw37nPage.table.mat')}</TableHead>
                      <TableHead>{t('iw37nPage.table.status')}</TableHead>
                      <TableHead>{t('iw37nPage.table.message')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lastImport.rows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="p-0">
                          <EmptyState
                            className="border-0 bg-transparent py-8"
                            title={t('iw37nPage.lastImportNoRows')}
                          />
                        </TableCell>
                      </TableRow>
                    ) : (
                      lastImport.rows.map((r) => (
                        <TableRow key={r.rowNo}>
                          <TableCell className="text-center tabular-nums">{r.rowNo}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            <ImportReviewActionBadge action={r.action} />
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {r.wkorder} / {r.opac}
                          </TableCell>
                          <TableCell className="font-mono text-xs">{r.mntplan}</TableCell>
                          <TableCell className="font-mono text-xs">{r.mat}</TableCell>
                          <TableCell className="font-mono text-xs">{r.syst}</TableCell>
                          <TableCell className="max-w-[360px] truncate text-xs text-app-muted" title={r.message}>
                            {r.message}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <EmptyState
              className="border-0 bg-transparent py-4"
              title={t('iw37nPage.lastImportEmpty')}
              description={t('iw37nPage.lastImportEmptyHint')}
            />
          )}
        </AppPageSectionCard>
      </AppPageSection>

      <AppPageSection index={itemsSectionIdx}>
        <AppPageSectionCard
          icon={Table2}
          title={t('iw37nPage.itemsTitle')}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Input
                value={itemQ}
                onChange={(e) => {
                  setItemQ(e.target.value)
                  setItemOffset(0)
                }}
                placeholder={t('iw37nPage.searchPlaceholder')}
                className="h-9 w-[220px] sm:w-[260px]"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setItemOffset((x) => Math.max(0, x - itemLimit))}
                disabled={itemOffset === 0}
              >
                {t('iw37nPage.prevPage')}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setItemOffset((x) => x + itemLimit)}
                disabled={(itemsQ.data?.length ?? 0) < itemLimit}
              >
                {t('iw37nPage.nextPage')}
              </Button>
            </div>
          }
          bodyClassName="space-y-4"
        >
          {itemsQ.isLoading && !itemsQ.data ? (
            <div className="app-table-shell overflow-x-auto" aria-busy="true">
              <Table embedded stickyHeader zebra>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20 text-right">{t('iw37nPage.table.id')}</TableHead>
                    <TableHead>{t('iw37nPage.table.order')}</TableHead>
                    <TableHead>{t('iw37nPage.table.opAc')}</TableHead>
                    <TableHead>{t('iw37nPage.table.mntPlan')}</TableHead>
                    <TableHead>{t('iw37nPage.table.type')}</TableHead>
                    <TableHead>{t('iw37nPage.table.bscStart')}</TableHead>
                    <TableHead className="text-right" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableSkeletonRows rows={8} columns={7} narrowFirstColumn />
                </TableBody>
              </Table>
            </div>
          ) : itemsQ.isError ? (
            <QueryLoadErrorState
              title={t('iw37nPage.itemsLoadFailed')}
              error={itemsQ.error}
              description={t('iw37nPage.itemsLoadFailedDesc')}
              action={{ label: t('iw37n.retry'), onClick: () => void itemsQ.refetch() }}
            />
          ) : (
            <div className="app-table-shell overflow-x-auto">
              <Table embedded stickyHeader zebra>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20 text-right">{t('iw37nPage.table.id')}</TableHead>
                    <TableHead>{t('iw37nPage.table.order')}</TableHead>
                    <TableHead>{t('iw37nPage.table.opAc')}</TableHead>
                    <TableHead>{t('iw37nPage.table.mntPlan')}</TableHead>
                    <TableHead>{t('iw37nPage.table.type')}</TableHead>
                    <TableHead>{t('iw37nPage.table.bscStart')}</TableHead>
                    <TableHead className="text-right" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(itemsQ.data?.length ?? 0) === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="p-0">
                        <EmptyState
                          className="border-0 bg-transparent py-10"
                          title={t('iw37nPage.itemsEmpty')}
                          description={
                            itemQ.trim()
                              ? t('iw37nPage.itemsEmptySearch')
                              : t('iw37nPage.itemsEmptyHint')
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ) : (
                    itemsQ.data?.map((it) => (
                      <TableRow key={it.idiw37}>
                        <TableCell className="text-right tabular-nums">{it.idiw37}</TableCell>
                        <TableCell className="font-mono text-xs">{it.wkorder}</TableCell>
                        <TableCell className="font-mono text-xs">{it.opac}</TableCell>
                        <TableCell className="font-mono text-xs">{it.mntplan}</TableCell>
                        <TableCell className="font-mono text-xs">{it.wktype}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {it.bscstart ? formatEpochSecondsToDdMmYyyy(it.bscstart) : ''}
                        </TableCell>
                        <TableCell className="text-right">
                          {canWrite ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => openEdit(it.idiw37)}
                            >
                              <Pencil className="mr-2 size-4" aria-hidden />
                              {t('iw37nPage.edit')}
                            </Button>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </AppPageSectionCard>
      </AppPageSection>

      <AppPageSection index={batchSectionIdx}>
        <AppPageSectionCard
          icon={History}
          title={t('iw37nPage.batchHistoryTitle')}
          bodyClassName="space-y-4"
        >
          {batches.isLoading && !batches.data ? (
            <div className="app-table-shell overflow-x-auto" aria-busy="true">
              <Table embedded stickyHeader zebra>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('iw37nPage.table.file')}</TableHead>
                    <TableHead>{t('iw37nPage.table.date')}</TableHead>
                    <TableHead className="text-right">{t('iw37nPage.table.rows')}</TableHead>
                    <TableHead>{t('iw37nPage.table.sha256')}</TableHead>
                    <TableHead>{t('iw37nPage.table.status')}</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableSkeletonRows rows={6} columns={6} />
                </TableBody>
              </Table>
            </div>
          ) : batches.isError ? (
            <QueryLoadErrorState
              title={t('iw37nPage.batchHistoryLoadFailed')}
              error={batches.error}
              description={t('iw37n.historyLoadFailedDesc')}
              action={{ label: t('iw37n.retry'), onClick: () => void batches.refetch() }}
            />
          ) : (
            <div className="app-table-shell overflow-x-auto">
              <Table embedded stickyHeader zebra>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('iw37nPage.table.file')}</TableHead>
                    <TableHead>{t('iw37nPage.table.date')}</TableHead>
                    <TableHead className="text-right">{t('iw37nPage.table.rows')}</TableHead>
                    <TableHead>{t('iw37nPage.table.sha256')}</TableHead>
                    <TableHead>{t('iw37nPage.table.status')}</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(batches.data?.length ?? 0) === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="p-0">
                        <EmptyState
                          className="border-0 bg-transparent py-10"
                          title={t('iw37nPage.batchHistoryEmpty')}
                          description={t('iw37nPage.batchHistoryEmptyHint')}
                        />
                      </TableCell>
                    </TableRow>
                  ) : (
                    batches.data?.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell className="max-w-[220px] truncate text-body-sm font-medium">
                          {b.fileName}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs">
                          {b.importedAt.slice(0, 19).replace('T', ' ')}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{b.rows}</TableCell>
                        <TableCell className="max-w-[120px] truncate font-mono text-xs text-app-muted">
                          {b.sha256}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge
                              variant={b.status === 'OK' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {b.status}
                            </Badge>
                            {b.isDuplicate ? (
                              <Badge variant="outline" className="text-xs">
                                {t('iw37nPage.duplicate')}
                              </Badge>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <ReportExportButton
                              format="csv"
                              loading={exporting}
                              disabled={exporting}
                              onClick={() => downloadCsv(b.id)}
                            />
                            <ReportExportButton
                              format="xlsx"
                              loading={exporting}
                              disabled={exporting}
                              onClick={() => downloadXlsx(b.id, b.fileName)}
                            />
                            {b.isDuplicate && b.duplicateOfBatchId ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => openBatchView(b.duplicateOfBatchId!, `batch-${b.duplicateOfBatchId}`)}
                              >
                                {t('iw37nPage.originalBatch')}
                              </Button>
                            ) : null}
                            <Button
                              type="button"
                              size="sm"
                              variant={batchViewId === b.id && batchViewOpen ? 'default' : 'outline'}
                              onClick={() => openBatchView(b.id, b.fileName)}
                            >
                              {t('iw37nPage.viewResult')}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </AppPageSectionCard>
      </AppPageSection>

      <Dialog
          open={editOpen}
          onOpenChange={(next) => {
            if (!next) {
              setEditOpen(false)
              setEditingId(null)
              setEditError(null)
            }
          }}
        >
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{t('iw37nPage.editTitle', { id: editingId ?? '' })}</DialogTitle>
            </DialogHeader>

            {editError ? (
              <div className="app-tone-danger-callout rounded-card border px-3 py-2 text-body-sm">
                {editError}
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t('iw37nPage.form.order')}</Label>
                <Input value={form.wkorder} onChange={(e) => setForm((p) => ({ ...p, wkorder: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>{t('iw37nPage.form.opAc')}</Label>
                <Input value={form.opac} onChange={(e) => setForm((p) => ({ ...p, opac: e.target.value }))} />
              </div>

              <div className="space-y-2">
                <Label>{t('iw37nPage.form.mntPlan')}</Label>
                <Input value={form.mntplan} onChange={(e) => setForm((p) => ({ ...p, mntplan: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>{t('iw37nPage.form.type')}</Label>
                <Input value={form.wktype} onChange={(e) => setForm((p) => ({ ...p, wktype: e.target.value }))} />
              </div>

              <div className="space-y-2">
                <Label>{t('iw37nPage.form.mat')}</Label>
                <Input value={form.mat} onChange={(e) => setForm((p) => ({ ...p, mat: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>{t('iw37nPage.form.team')}</Label>
                <Input value={form.team} onChange={(e) => setForm((p) => ({ ...p, team: e.target.value }))} />
              </div>

              <div className="space-y-2">
                <Label>{t('iw37nPage.form.planDate')}</Label>
                <Input value={form.bscstart} onChange={(e) => setForm((p) => ({ ...p, bscstart: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>{t('iw37nPage.form.actFinish')}</Label>
                <Input value={form.actfinish} onChange={(e) => setForm((p) => ({ ...p, actfinish: e.target.value }))} />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label>{t('iw37nPage.form.systemStatus')}</Label>
                <Input value={form.systemstatus} onChange={(e) => setForm((p) => ({ ...p, systemstatus: e.target.value }))} />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label>{t('iw37nPage.form.operationShort')}</Label>
                <Input value={form.operationshorttext} onChange={(e) => setForm((p) => ({ ...p, operationshorttext: e.target.value }))} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>{t('iw37nPage.form.description')}</Label>
                <Input value={form.ostdescription} onChange={(e) => setForm((p) => ({ ...p, ostdescription: e.target.value }))} />
              </div>

              <div className="space-y-2">
                <Label>{t('iw37nPage.form.c')}</Label>
                <Input value={form.cknow} onChange={(e) => setForm((p) => ({ ...p, cknow: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>{t('iw37nPage.form.opWorkCtr')}</Label>
                <Input value={form.wkctr} onChange={(e) => setForm((p) => ({ ...p, wkctr: e.target.value }))} />
              </div>

              <div className="space-y-2">
                <Label>{t('iw37nPage.form.work')}</Label>
                <Input value={form.work} onChange={(e) => setForm((p) => ({ ...p, work: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>{t('iw37nPage.form.actWork')}</Label>
                <Input value={form.actwork} onChange={(e) => setForm((p) => ({ ...p, actwork: e.target.value }))} />
              </div>

              <div className="space-y-2">
                <Label>{t('iw37nPage.form.un')}</Label>
                <Input value={form.untime} onChange={(e) => setForm((p) => ({ ...p, untime: e.target.value }))} />
              </div>
              <div />

              <div className="space-y-2">
                <Label>{t('iw37nPage.form.equipment')}</Label>
                <Input value={form.equipment} onChange={(e) => setForm((p) => ({ ...p, equipment: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>{t('iw37nPage.form.equipmentDesc')}</Label>
                <Input value={form.equdescrip} onChange={(e) => setForm((p) => ({ ...p, equdescrip: e.target.value }))} />
              </div>

              <div className="space-y-2">
                <Label>{t('iw37nPage.form.functionalLoc')}</Label>
                <Input value={form.functionalloc} onChange={(e) => setForm((p) => ({ ...p, functionalloc: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>{t('iw37nPage.form.funcLocDesc')}</Label>
                <Input value={form.funcdescrip} onChange={(e) => setForm((p) => ({ ...p, funcdescrip: e.target.value }))} />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditOpen(false)
                  setEditingId(null)
                  setEditError(null)
                }}
                disabled={saveMut.isPending}
              >
                {t('iw37nPage.form.cancel')}
              </Button>
              <Button type="button" onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
                {saveMut.isPending ? t('iw37nPage.form.saving') : t('iw37nPage.form.save')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

      <Dialog
          open={batchViewOpen}
          onOpenChange={(open) => {
            setBatchViewOpen(open)
            if (!open) {
              setBatchViewId(null)
              setBatchViewFileName(null)
            }
          }}
        >
          <DialogContent className="flex max-h-[85vh] max-w-4xl flex-col gap-4 overflow-hidden">
            <DialogHeader>
              <DialogTitle className="text-left">
                {t('iw37nPage.batchViewTitle', { id: batchViewId ?? '—' })}
                {batchViewFileName ? (
                  <span className="mt-1 block text-xs font-normal text-app-muted">{batchViewFileName}</span>
                ) : null}
              </DialogTitle>
            </DialogHeader>
            {batchViewId ? (
              <div className="flex flex-wrap gap-2">
                <ReportExportButton
                  format="csv"
                  loading={exporting}
                  disabled={exporting}
                  onClick={() => downloadCsv(batchViewId)}
                />
                <ReportExportButton
                  format="xlsx"
                  loading={exporting}
                  disabled={exporting}
                  onClick={() => downloadXlsx(batchViewId, batchViewFileName ?? undefined)}
                />
              </div>
            ) : null}
            <div className="min-h-0 flex-1 overflow-y-auto">
              {batchViewRowsQ.isLoading ? (
                <div className="app-table-shell overflow-x-auto" aria-busy="true">
                  <Table embedded stickyHeader zebra>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16 text-center">{t('iw37nPage.table.rowNo')}</TableHead>
                        <TableHead>{t('iw37nPage.table.result')}</TableHead>
                        <TableHead>{t('iw37nPage.table.woOp')}</TableHead>
                        <TableHead>{t('iw37nPage.table.mntplan')}</TableHead>
                        <TableHead>{t('iw37nPage.table.mat')}</TableHead>
                        <TableHead>{t('iw37nPage.table.status')}</TableHead>
                        <TableHead>{t('iw37nPage.table.message')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableSkeletonRows rows={8} columns={7} narrowFirstColumn />
                    </TableBody>
                  </Table>
                </div>
              ) : batchViewRowsQ.isError ? (
                <p className="text-body-sm text-form-error">{t('iw37nPage.batchViewLoadFailed')}</p>
              ) : batchViewRowsQ.data ? (
                <div className="space-y-2">
                  <p className="text-xs text-app-muted">
                    {t('iw37nPage.batchViewRows', { count: batchViewItems.length })}
                    {batchViewItems.length >= 2000 ? t('iw37nPage.batchViewRowCap') : ''}
                  </p>
                  <div className="app-table-shell overflow-x-auto">
                    <Table embedded stickyHeader zebra>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16 text-center">{t('iw37nPage.table.rowNo')}</TableHead>
                          <TableHead>{t('iw37nPage.table.result')}</TableHead>
                          <TableHead>{t('iw37nPage.table.woOp')}</TableHead>
                          <TableHead>{t('iw37nPage.table.mntplan')}</TableHead>
                          <TableHead>{t('iw37nPage.table.mat')}</TableHead>
                          <TableHead>{t('iw37nPage.table.status')}</TableHead>
                          <TableHead>{t('iw37nPage.table.message')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {batchViewItems.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="p-0">
                              <EmptyState
                                className="border-0 bg-transparent py-8"
                                title={t('iw37nPage.batchViewNoRows')}
                                description={t('iw37nPage.batchViewNoRowsHint')}
                              />
                            </TableCell>
                          </TableRow>
                        ) : (
                          batchViewItems.map((r) => (
                            <TableRow key={`${r.rowNo}-${r.createdAt}`}>
                              <TableCell className="text-center tabular-nums">{r.rowNo}</TableCell>
                              <TableCell className="whitespace-nowrap">
                                <ImportReviewActionBadge action={r.action} />
                              </TableCell>
                              <TableCell className="font-mono text-xs">
                                {r.wkorder} / {r.opac}
                              </TableCell>
                              <TableCell className="font-mono text-xs">{r.mntplan}</TableCell>
                              <TableCell className="font-mono text-xs">{r.mat}</TableCell>
                              <TableCell className="font-mono text-xs">{r.syst}</TableCell>
                              <TableCell
                                className="max-w-[280px] truncate text-xs text-app-muted"
                                title={r.message}
                              >
                                {r.message}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : null}
            </div>
          </DialogContent>
        </Dialog>
    </AppPageShell>
  )
}
