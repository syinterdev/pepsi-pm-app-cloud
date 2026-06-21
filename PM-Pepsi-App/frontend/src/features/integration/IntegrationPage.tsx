import type { ConfirmationImportPreviewResponse, Iw37nImportPreviewResponse } from '@/api/schemas'
import { hintsFromT } from '@/lib/i18n-hints'
import { CanPermission } from '@/components/auth/CanPermission'
import { ConfirmImportReviewPanel } from '@/components/confirmation/ConfirmImportReviewPanel'
import { IntegrationJobStatusBadge } from '@/components/integration/IntegrationJobStatusBadge'
import { Iw37nImportReviewPanel } from '@/components/iw37n/Iw37nImportReviewPanel'
import { ReportExportButton } from '@/components/reports/ReportExportButton'
import { AppCard } from '@/components/layout/AppCard'
import { AppPageSection, AppPageSectionCard, AppPageShell } from '@/components/layout/AppPageShell'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  confirmationSapCsvFilename,
  fetchConfirmationExport,
  fetchConfirmationExportCsv,
  fetchConfirmationExportXlsx,
  fetchIntegrationJobs,
  fetchIntegrationStatus,
  fetchIw37nBatchCsv,
  fetchIw37nBatches,
  postConfirmationImport,
  postConfirmationImportPreview,
  postIntegrationJobsRun,
  postIw37nImport,
  postIw37nImportPreview,
} from '@/lib/api-public'
import { useAnyPermission, usePermission } from '@/lib/use-permission'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertCircle, ArrowLeftRight, BookOpen, ClipboardCheck, FolderSync } from 'lucide-react'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import type { TFunction } from 'i18next'

function duplicateToastMsg(t: TFunction<'integration'>, batchId: string | null): string {
  return t('toast.duplicateSha', {
    batchRef: batchId ? t('toast.duplicateShaRef', { id: batchId }) : '',
  })
}

function downloadBlob(blob: Blob, fileName: string) {
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

export function IntegrationPage() {
  const { t } = useTranslation('integration')
  const canIw37n = useAnyPermission(['iw37n.read', 'integration.admin'])
  const canImport = usePermission('iw37n.import')
  const canConfirm = usePermission('confirmation.read')
  const canConfirmImport = usePermission('confirmation.import')
  const canRunScan =
    usePermission('iw37n.import') ||
    usePermission('confirmation.import') ||
    usePermission('integration.admin')

  if (!canIw37n) {
    return (
      <AppPageShell title={t('title')} description={t('description')}>
        <EmptyState
          icon={AlertCircle}
          title={t('noAccessTitle')}
          description={
            <>
              {t('noAccessDesc')}{' '}
              <code className="text-xs">iw37n.read</code> ·{' '}
              <code className="text-xs">integration.admin</code>
            </>
          }
        />
      </AppPageShell>
    )
  }

  return (
    <AppPageShell
      title={t('title')}
      description={t('description')}
      hints={hintsFromT(t, 'hints')}
      headerActions={
        <>
          <Badge variant="secondary" className="gap-1 text-xs">
            <ArrowLeftRight className="size-3.5" aria-hidden />
            {t('badgeCsv')}
          </Badge>
          <CanPermission permission="iw37n.read">
            <Button type="button" variant="outline" size="sm" asChild>
              <Link to="/iw37n">{t('linkIw37n')}</Link>
            </Button>
          </CanPermission>
          <CanPermission permission="confirmation.read">
            <Button type="button" variant="outline" size="sm" asChild>
              <Link to="/confirmation">{t('linkConfirm')}</Link>
            </Button>
          </CanPermission>
          <CanPermission permission="planning.read">
            <Button type="button" variant="outline" size="sm" asChild>
              <Link to="/planning">{t('linkPlanning')}</Link>
            </Button>
          </CanPermission>
        </>
      }
    >
        <AppPageSection index={0}>
          <AppPageSectionCard
            icon={FolderSync}
            title={t('cardTitle')}
            description={t('cardDescription')}
            bodyClassName="!p-0"
          >
        <Tabs defaultValue="iw37n" className="space-y-4 p-4">
          <TabsList className="flex h-auto flex-wrap gap-1 rounded-lg border border-app/60 bg-app-subtle/40 p-1 shadow-sm">
            <TabsTrigger value="iw37n">{t('tabs.iw37n')}</TabsTrigger>
            {canConfirmImport ? (
              <TabsTrigger value="confirm-in">{t('tabs.confirmIn')}</TabsTrigger>
            ) : null}
            {canConfirm ? <TabsTrigger value="confirm">{t('tabs.confirmOut')}</TabsTrigger> : null}
            <TabsTrigger value="jobs">{t('tabs.jobs')}</TabsTrigger>
            <TabsTrigger value="guide">{t('tabs.guide')}</TabsTrigger>
          </TabsList>

          <TabsContent value="iw37n">
            <IntegrationIw37nTab canImport={canImport} />
          </TabsContent>

          {canConfirmImport ? (
            <TabsContent value="confirm-in">
              <IntegrationConfirmInTab />
            </TabsContent>
          ) : null}

          {canConfirm ? (
            <TabsContent value="confirm">
              <IntegrationConfirmTab />
            </TabsContent>
          ) : null}

          <TabsContent value="jobs">
            <IntegrationJobsTab canRunScan={canRunScan} />
          </TabsContent>

          <TabsContent value="guide">
            <IntegrationGuideTab />
          </TabsContent>
        </Tabs>
          </AppPageSectionCard>
        </AppPageSection>
    </AppPageShell>
  )
}

function IntegrationIw37nTab({ canImport }: { canImport: boolean }) {
  const { t } = useTranslation('integration')
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [importPreview, setImportPreview] = useState<Iw37nImportPreviewResponse | null>(null)
  const batchesQ = useQuery({
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
      } else {
        toast.message(t('toast.previewReady'))
      }
    },
    onError: () => toast.error(t('toast.genericFailed')),
  })

  const importMut = useMutation({
    mutationFn: postIw37nImport,
    onSuccess: (data) => {
      const batch = data.batch
      const inserted = data.rows.filter((r) => r.action === 'inserted').length
      const updated = data.rows.filter((r) => r.action === 'updated').length
      const skipped = data.rows.filter((r) => r.action === 'skipped').length
      if (batch.isDuplicate && batch.duplicateOfBatchId) {
        toast.warning(duplicateToastMsg(t, batch.duplicateOfBatchId), { duration: 8000 })
      } else if (inserted + updated === 0) {
        toast.warning(
          t('toast.importNoChanges', { fileName: batch.fileName, skipped }),
          { duration: 10_000 },
        )
      } else {
        toast.success(
          t('toast.importSuccess', {
            inserted,
            updated,
            skippedPart:
              skipped > 0 ? t('toast.importSkippedPart', { skipped }) : '',
            batchId: batch.id,
          }),
        )
      }
      setImportPreview(null)
      setPendingFile(null)
      void qc.invalidateQueries({ queryKey: ['iw37n-batches'] })
      void qc.invalidateQueries({ queryKey: ['integration', 'status'] })
      if (fileRef.current) fileRef.current.value = ''
    },
    onError: () => toast.error(t('toast.genericFailed')),
  })

  const onPreview = () => {
    const file = fileRef.current?.files?.[0]
    if (!file) {
      toast.error(t('toast.selectFile'))
      return
    }
    setPendingFile(file)
    setImportPreview(null)
    previewMut.mutate(file)
  }

  const onCommit = () => {
    if (importPreview?.summary.isDuplicate) {
      toast.error(duplicateToastMsg(t, importPreview.summary.duplicateOfBatchId))
      return
    }
    const file = pendingFile ?? fileRef.current?.files?.[0]
    if (!file) {
      toast.error(t('toast.selectFileAgain'))
      return
    }
    importMut.mutate(file)
  }

  const onBatchCsv = async (batchId: string) => {
    try {
      const blob = await fetchIw37nBatchCsv(batchId)
      downloadBlob(blob, `iw37n-import-batch-${batchId}.csv`)
    } catch {
      toast.error(t('toast.downloadFailed'))
    }
  }

  const items = (batchesQ.data ?? []).slice(0, 15)

  return (
    <div className="space-y-4">
      <AppCard pad="compact">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-body-sm font-semibold text-app">{t('iw37n.uploadTitle')}</h3>
            <p className="mt-1 text-xs text-app-muted">{t('iw37n.uploadHint')}</p>
            <p className="mt-2 text-xs text-app-muted">
              {t('iw37n.confirmNoteBefore')}
              <strong>{t('iw37n.confirmNoteStrong')}</strong>
              {t('iw37n.confirmNoteAfter')}
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" asChild>
            <Link to="/iw37n">{t('iw37n.fullPageLink')}</Link>
          </Button>
        </div>
        {canImport ? (
          <>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
              <Input
                ref={fileRef}
                type="file"
                accept=".xls,.xlsx,.csv"
                className="max-w-md"
                onChange={() => {
                  setImportPreview(null)
                  setPendingFile(fileRef.current?.files?.[0] ?? null)
                }}
              />
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                disabled={previewMut.isPending || importMut.isPending}
                onClick={onPreview}
              >
                <ClipboardCheck className="size-4" />
                {previewMut.isPending ? t('iw37n.previewing') : t('iw37n.preview')}
              </Button>
            </div>
            {importPreview ? (
              <Iw37nImportReviewPanel
                summary={importPreview.summary}
                rows={importPreview.rows}
                committing={importMut.isPending}
                onCommit={onCommit}
                onCancel={() => {
                  setImportPreview(null)
                  setPendingFile(null)
                  if (fileRef.current) fileRef.current.value = ''
                }}
              />
            ) : null}
          </>
        ) : (
          <p className="mt-3 text-xs text-app-muted">
            {t('iw37n.needImportPerm')} <code className="text-xs">iw37n.import</code>
          </p>
        )}
      </AppCard>

      <AppCard pad="compact">
        <h3 className="text-body-sm font-semibold text-app">{t('iw37n.historyTitle')}</h3>
        {batchesQ.isError ? (
          <EmptyState
            className="mt-4"
            icon={AlertCircle}
            title={t('iw37n.historyLoadFailed')}
            description={t('iw37n.historyLoadFailedDesc')}
            action={{ label: t('iw37n.retry'), onClick: () => void batchesQ.refetch() }}
          />
        ) : (
        <div className="app-table-shell mt-3 overflow-x-auto">
          <Table embedded stickyHeader zebra>
            <TableHeader>
              <TableRow>
                <TableHead>{t('iw37n.table.id')}</TableHead>
                <TableHead>{t('iw37n.table.file')}</TableHead>
                <TableHead>{t('iw37n.table.when')}</TableHead>
                <TableHead>{t('iw37n.table.rows')}</TableHead>
                <TableHead>{t('iw37n.table.status')}</TableHead>
                <TableHead className="text-right">{t('iw37n.table.report')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batchesQ.isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={`sk-${i}`}>
                    <TableCell colSpan={6}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="p-0">
                    <EmptyState
                      className="py-10"
                      title={t('iw37n.emptyBatches')}
                      description={t('iw37n.emptyBatchesHint')}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                items.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="tabular-nums">#{b.id}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{b.fileName}</TableCell>
                    <TableCell className="text-xs text-app-muted">
                      {new Date(b.importedAt).toLocaleString('th-TH')}
                    </TableCell>
                    <TableCell className="tabular-nums">{b.rows}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={b.status === 'OK' ? 'secondary' : 'outline'}>
                          {b.status}
                        </Badge>
                        {b.isDuplicate ? (
                          <Badge variant="outline" className="text-xs">
                            {t('iw37n.duplicate')}
                          </Badge>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {b.isDuplicate && b.duplicateOfBatchId ? (
                          <Button type="button" size="sm" variant="outline" asChild>
                            <Link to="/iw37n">{t('iw37n.batchLink', { id: b.duplicateOfBatchId })}</Link>
                          </Button>
                        ) : null}
                        <ReportExportButton
                          label={t('iw37n.downloadLog')}
                          onClick={() => void onBatchCsv(b.id)}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        )}
      </AppCard>
    </div>
  )
}

function IntegrationConfirmInTab() {
  const { t } = useTranslation('integration')
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [importPreview, setImportPreview] = useState<ConfirmationImportPreviewResponse | null>(null)
  const statusQ = useQuery({
    queryKey: ['integration', 'status'],
    queryFn: fetchIntegrationStatus,
    staleTime: 15_000,
    retry: false,
    placeholderData: keepPreviousData,
  })

  const previewMut = useMutation({
    mutationFn: postConfirmationImportPreview,
    onSuccess: (data) => {
      setImportPreview(data)
      if (data.matchWoInDb === 0 && data.parseOk > 0) {
        toast.warning(t('confirmIn.noWoMatch'), { duration: 10_000 })
      } else {
        toast.message(t('toast.confirmPreviewReady'))
      }
    },
    onError: () => toast.error(t('toast.genericFailed')),
  })

  const importMut = useMutation({
    mutationFn: postConfirmationImport,
    onSuccess: (data) => {
      toast.success(
        t('toast.confirmImportSuccess', {
          fileName: data.fileName,
          inserted: data.inserted,
          updated: data.updated,
          skipped: data.skipped,
          errors: data.errors,
        }),
      )
      setImportPreview(null)
      setPendingFile(null)
      void qc.invalidateQueries({ queryKey: ['integration', 'status'] })
      if (fileRef.current) fileRef.current.value = ''
    },
    onError: () => toast.error(t('toast.genericFailed')),
  })

  const onPreview = () => {
    const file = fileRef.current?.files?.[0]
    if (!file) {
      toast.error(t('toast.selectFile'))
      return
    }
    setPendingFile(file)
    setImportPreview(null)
    previewMut.mutate(file)
  }

  const onCommit = () => {
    if (!pendingFile) {
      toast.error(t('confirmIn.noFile'))
      return
    }
    importMut.mutate(pendingFile)
  }

  const pending = statusQ.data?.pendingConfirmFiles ?? []
  const inboundDir = statusQ.data?.inboundConfirmDir

  return (
    <div className="space-y-4">
      <AppCard pad="compact">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-body-sm font-semibold text-app">{t('confirmIn.title')}</h3>
            <p className="mt-1 text-xs text-app-muted">
              {t('confirmIn.hint')}{' '}
              <code className="text-code">inbound/confirm</code> {t('confirmIn.hintFolder')}
            </p>
            <p className="mt-1 text-xs app-tone-warning-label">{t('confirmIn.zb02Warning')}</p>
            {inboundDir ? (
              <p className="mt-2 break-all text-xs text-app-muted">{inboundDir}</p>
            ) : null}
            {pending.length > 0 ? (
              <p className="mt-1 text-xs app-tone-warning-label">
                {t('confirmIn.pendingScan', { count: pending.length })}
              </p>
            ) : null}
          </div>
          <Button type="button" variant="outline" size="sm" asChild>
            <Link to="/confirmation">{t('confirmIn.pageLink')}</Link>
          </Button>
        </div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <Input ref={fileRef} type="file" accept=".xls,.xlsx,.csv" className="max-w-md" />
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            disabled={previewMut.isPending || importMut.isPending}
            onClick={onPreview}
          >
            {previewMut.isPending ? t('confirmIn.previewing') : t('confirmIn.preview')}
          </Button>
        </div>
        {importPreview ? (
          <ConfirmImportReviewPanel
            preview={importPreview}
            committing={importMut.isPending}
            onCommit={onCommit}
            onCancel={() => {
              setImportPreview(null)
              setPendingFile(null)
            }}
          />
        ) : null}
        {statusQ.isError ? (
          <p className="mt-3 text-xs app-tone-warning-label">{t('confirmIn.folderStatusFailed')}</p>
        ) : null}
      </AppCard>
    </div>
  )
}

function IntegrationConfirmTab() {
  const { t } = useTranslation('integration')
  const [exporting, setExporting] = useState<'xlsx' | 'csv' | null>(null)
  const exportQ = useQuery({
    queryKey: ['confirmation', 'export', 'preview'],
    queryFn: fetchConfirmationExport,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  })

  const onDownload = async (format: 'xlsx' | 'csv') => {
    setExporting(format)
    try {
      const blob =
        format === 'xlsx'
          ? await fetchConfirmationExportXlsx()
          : await fetchConfirmationExportCsv()
      downloadBlob(
        blob,
        format === 'xlsx' ? 'Export_Confirm.xlsx' : confirmationSapCsvFilename(),
      )
    } catch {
      toast.error(t('toast.exportFailed'))
    } finally {
      setExporting(null)
    }
  }

  const items = exportQ.data?.items ?? []
  const preview = items.slice(0, 20)
  const scope = exportQ.data?.scope

  return (
    <div className="space-y-4">
      <AppCard pad="compact">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-body-sm font-semibold text-app">{t('confirmOut.title')}</h3>
            <p className="mt-1 text-xs text-app-muted">
              {t('confirmOut.scopePrefix')}
              {scope === 'ALL'
                ? t('confirmOut.scopeAll')
                : scope === 'OWN'
                  ? t('confirmOut.scopeOwn')
                  : ''}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" asChild>
              <Link to="/confirmation">{t('confirmOut.viewExport')}</Link>
            </Button>
            <ReportExportButton
              format="xlsx"
              label={t('confirmOut.exportExcel')}
              loading={exporting === 'xlsx'}
              loadingLabel={t('confirmOut.exporting')}
              disabled={exporting != null || items.length === 0}
              onClick={() => void onDownload('xlsx')}
            />
            <ReportExportButton
              format="csv"
              label={t('confirmOut.exportCsv')}
              variant="default"
              loading={exporting === 'csv'}
              loadingLabel={t('confirmOut.exporting')}
              disabled={exporting != null || items.length === 0}
              onClick={() => void onDownload('csv')}
            />
          </div>
        </div>
        <p className="mt-2 text-xs text-app-muted">
          {exportQ.isLoading && !exportQ.data
            ? t('confirmOut.loading')
            : exportQ.isError
              ? t('confirmOut.loadFailed')
              : t('confirmOut.rowSummary', { total: items.length, preview: preview.length })}
        </p>
        {exportQ.isError ? (
          <div className="mt-3">
            <Button type="button" variant="outline" size="sm" onClick={() => void exportQ.refetch()}>
              {t('confirmOut.retry')}
            </Button>
          </div>
        ) : null}
      </AppCard>

      <div className="app-table-shell overflow-x-auto">
        <Table embedded stickyHeader zebra>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10 text-right">{t('confirmOut.table.no')}</TableHead>
              <TableHead>{t('confirmOut.table.order')}</TableHead>
              <TableHead>{t('confirmOut.table.op')}</TableHead>
              <TableHead>{t('confirmOut.table.wrkCtr')}</TableHead>
              <TableHead className="text-right">{t('confirmOut.table.actWork')}</TableHead>
              <TableHead>{t('confirmOut.table.start')}</TableHead>
              <TableHead>{t('confirmOut.table.end')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {exportQ.isLoading && !exportQ.data ? (
              <TableSkeletonRows rows={6} columns={7} />
            ) : preview.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="p-0">
                    <div className="flex flex-col items-center gap-3 py-6">
                      <EmptyState
                        className="border-0 bg-transparent py-4"
                        title={t('confirmOut.emptyTitle')}
                        description={t('confirmOut.emptyDesc')}
                      />
                      <Button type="button" variant="outline" size="sm" asChild>
                        <Link to="/confirmation">{t('confirmOut.goExport')}</Link>
                      </Button>
                    </div>
                </TableCell>
              </TableRow>
            ) : (
              preview.map((row) => (
                <TableRow key={`${row.wkorder}-${row.opac}-${row.no}`}>
                  <TableCell className="text-right tabular-nums">{row.no}</TableCell>
                  <TableCell className="tabular-nums">{row.wkorder}</TableCell>
                  <TableCell className="tabular-nums">{row.opac}</TableCell>
                  <TableCell>{row.wkctr}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.timewk}</TableCell>
                  <TableCell className="tabular-nums text-xs">
                    {row.startDateExe} {row.startExecute}
                  </TableCell>
                  <TableCell className="tabular-nums text-xs">
                    {row.endDateExe} {row.endExecute}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function IntegrationJobsTab({ canRunScan }: { canRunScan: boolean }) {
  const { t } = useTranslation('integration')
  const qc = useQueryClient()
  const statusQ = useQuery({
    queryKey: ['integration', 'status'],
    queryFn: fetchIntegrationStatus,
    staleTime: 10_000,
    retry: false,
    placeholderData: keepPreviousData,
  })
  const jobsQ = useQuery({
    queryKey: ['integration', 'jobs'],
    queryFn: () => fetchIntegrationJobs(30),
    staleTime: 10_000,
    retry: false,
    placeholderData: keepPreviousData,
  })

  const scanMut = useMutation({
    mutationFn: postIntegrationJobsRun,
    onSuccess: async (data) => {
      await qc.invalidateQueries({ queryKey: ['integration'] })
      await qc.invalidateQueries({ queryKey: ['iw37n-batches'] })
      const s = data.job.summary as {
        filesProcessed?: number
        filesFound?: number
        iw37n?: { filesProcessed?: number; filesFound?: number }
        confirm?: { filesProcessed?: number; filesFound?: number }
      }
      const iw = s.iw37n
      const cf = s.confirm
      toast.success(
        t('toast.scanFolderDoneIntegration', {
          status: data.job.status,
          iwProcessed: iw?.filesProcessed ?? 0,
          iwFound: iw?.filesFound ?? 0,
          cfProcessed: cf?.filesProcessed ?? 0,
          cfFound: cf?.filesFound ?? 0,
        }),
      )
    },
    onError: () => toast.error(t('toast.scanFailed')),
  })

  const st = statusQ.data

  return (
    <div className="space-y-4">
      <AppCard pad="compact">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-body-sm font-semibold text-app">{t('jobs.folderTitle')}</h3>
            {statusQ.isError ? (
              <p className="mt-2 text-xs app-tone-warning-label">
                {t('jobs.migrationHint')}{' '}
                <code className="text-code">075</code> + <code className="text-code">076</code>
              </p>
            ) : statusQ.isLoading ? (
              <Skeleton className="mt-2 h-4 w-full max-w-lg" />
            ) : st ? (
              <div className="mt-2 space-y-2 text-xs text-app-muted">
                <p className="break-all">
                  <span className="font-medium text-app">{t('jobs.iw37nDir')}</span> {st.inboundIw37nDir}
                  <span className="ml-2">
                    {t('jobs.filesWaiting', { count: st.pendingIw37nFiles.length })}
                  </span>
                </p>
                <p className="break-all">
                  <span className="font-medium text-app">{t('jobs.confirmDir')}</span>{' '}
                  {st.inboundConfirmDir}
                  <span className="ml-2">
                    {t('jobs.filesWaiting', { count: st.pendingConfirmFiles.length })}
                  </span>
                </p>
                <p>
                  {t('jobs.autoScan')}{' '}
                  {st.watchEnabled
                    ? t('jobs.autoScanOn', { minutes: st.watchIntervalMinutes })
                    : t('jobs.autoScanOff')}
                </p>
                {st.lastJob ? (
                  <p>
                    {t('jobs.lastJob', {
                      id: st.lastJob.id,
                      type: st.lastJob.jobType,
                      status: st.lastJob.status,
                      time: new Date(st.lastJob.startedAt).toLocaleString(),
                    })}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
          {canRunScan ? (
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              disabled={scanMut.isPending || statusQ.isError}
              onClick={() => scanMut.mutate()}
            >
              <FolderSync className="size-4" />
              {scanMut.isPending ? t('jobs.scanning') : t('jobs.scanNow')}
            </Button>
          ) : null}
        </div>
        {st && (st.pendingIw37nFiles.length > 0 || st.pendingConfirmFiles.length > 0) ? (
          <ul className="mt-3 list-inside list-disc text-xs text-app-muted">
            {st.pendingIw37nFiles.map((f) => (
              <li key={`iw37n-${f.name}`}>
                {t('jobs.pendingFileIw37n', {
                  name: f.name,
                  sizeKb: Math.round(f.sizeBytes / 1024),
                })}
              </li>
            ))}
            {st.pendingConfirmFiles.map((f) => (
              <li key={`confirm-${f.name}`}>
                {t('jobs.pendingFileConfirm', {
                  name: f.name,
                  sizeKb: Math.round(f.sizeBytes / 1024),
                })}
              </li>
            ))}
          </ul>
        ) : null}
        <p className="mt-3 text-xs text-app-muted">
          {t('jobs.cliHint')}{' '}
          <code className="rounded bg-app-muted px-1">{t('jobs.cliCommand')}</code>{' '}
          {t('jobs.cliBackend')}
        </p>
      </AppCard>

      <AppCard pad="compact">
        <h3 className="text-body-sm font-semibold text-app">{t('jobs.historyTitle')}</h3>
        {jobsQ.isError ? (
          <EmptyState
            className="mt-4"
            icon={AlertCircle}
            title={t('jobs.noTableTitle')}
            description={t('jobs.noTableDesc')}
          />
        ) : (
        <div className="app-table-shell mt-3 overflow-x-auto">
          <Table embedded stickyHeader zebra>
            <TableHeader>
              <TableRow>
                <TableHead>{t('jobs.table.id')}</TableHead>
                <TableHead>{t('jobs.table.type')}</TableHead>
                <TableHead>{t('jobs.table.trigger')}</TableHead>
                <TableHead>{t('jobs.table.status')}</TableHead>
                <TableHead>{t('jobs.table.started')}</TableHead>
                <TableHead>{t('jobs.table.files')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobsQ.isLoading && !jobsQ.data ? (
                <TableSkeletonRows rows={6} columns={6} narrowFirstColumn />
              ) : (jobsQ.data ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="p-0">
                    <EmptyState
                      className="py-10"
                      title={t('jobs.emptyJobs')}
                      description={t('jobs.emptyJobsHint')}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                (jobsQ.data ?? []).map((j) => {
                  const sum = j.summary as {
                    filesFound?: number
                    filesProcessed?: number
                    iw37n?: { filesFound?: number; filesProcessed?: number }
                    confirm?: { filesFound?: number; filesProcessed?: number }
                  }
                  const detail =
                    sum.iw37n || sum.confirm
                      ? t('jobs.jobDetailIw37n', {
                          processed: sum.iw37n?.filesProcessed ?? 0,
                          found: sum.iw37n?.filesFound ?? 0,
                          cfProcessed: sum.confirm?.filesProcessed ?? 0,
                          cfFound: sum.confirm?.filesFound ?? 0,
                        })
                      : sum.filesFound != null
                        ? t('jobs.jobDetailFiles', {
                            processed: sum.filesProcessed ?? 0,
                            found: sum.filesFound,
                          })
                        : ''
                  return (
                    <TableRow key={j.id}>
                      <TableCell className="tabular-nums">#{j.id}</TableCell>
                      <TableCell className="text-xs">{j.jobType}</TableCell>
                      <TableCell className="text-xs">{j.trigger}</TableCell>
                      <TableCell>
                        <IntegrationJobStatusBadge status={j.status} />
                      </TableCell>
                      <TableCell className="text-xs text-app-muted">
                        {new Date(j.startedAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-xs text-app-muted">
                        {j.fileName ?? '—'}
                        {detail ? ` · ${detail}` : ''}
                        {j.batchId ? t('jobs.batchSuffix', { id: j.batchId }) : ''}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
        )}
      </AppCard>
    </div>
  )
}

function IntegrationGuideTab() {
  const { t } = useTranslation('integration')
  return (
    <AppCard pad="default" className="space-y-4 text-body-sm text-app">
      <div className="flex items-center gap-2 text-app">
        <BookOpen className="size-4" />
        <h3 className="font-semibold">{t('guide.title')}</h3>
      </div>

      <section>
        <h4 className="font-medium text-app">{t('guide.iw37nTitle')}</h4>
        <ul className="mt-2 list-inside list-disc space-y-1 text-xs">
          <li>
            {t('guide.iw37nFolder')} <code>{t('guide.iw37nFolderPath')}</code>
          </li>
          <li>
            {t('guide.iw37nName')} <code>{t('guide.iw37nNamePattern')}</code>
          </li>
          <li>{t('guide.iw37nFormat')}</li>
          <li>{t('guide.iw37nUpsert')}</li>
        </ul>
      </section>

      <section>
        <h4 className="font-medium text-app">{t('guide.confirmInTitle')}</h4>
        <ul className="mt-2 list-inside list-disc space-y-1 text-xs">
          <li>
            {t('guide.confirmInFolder')} <code>{t('guide.confirmInFolderPath')}</code>
          </li>
          <li>
            {t('guide.confirmInName')} <code>{t('guide.confirmInNamePattern')}</code>
          </li>
          <li>
            {t('guide.confirmInParser')} <code>{t('guide.confirmInParserFile')}</code>{' '}
            {t('guide.confirmInParserNote')}
          </li>
        </ul>
      </section>

      <section>
        <h4 className="font-medium text-app">{t('guide.confirmOutTitle')}</h4>
        <ul className="mt-2 list-inside list-disc space-y-1 text-xs">
          <li>
            {t('guide.confirmOutDownload')}{' '}
            <Link to="/confirmation">{t('guide.confirmOutLink')}</Link>
          </li>
          <li>
            {t('guide.confirmOutName')} <code>{t('guide.confirmOutNamePattern')}</code>
          </li>
          <li>{t('guide.confirmOutFilter')}</li>
        </ul>
      </section>

      <section>
        <h4 className="font-medium text-app">{t('guide.folderTitle')}</h4>
        <pre className="mt-2 overflow-x-auto rounded-button bg-app-muted p-3 text-xs">
          {t('guide.folderTree')}
        </pre>
      </section>

    </AppCard>
  )
}
