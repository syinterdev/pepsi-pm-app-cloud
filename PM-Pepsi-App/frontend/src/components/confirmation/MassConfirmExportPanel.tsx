import { Badge } from '@/components/ui/badge'
import { ReportExportButton } from '@/components/reports/ReportExportButton'
import { Button } from '@/components/ui/button'
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
import type { MassConfirmExportSummary } from '@/api/schemas'
import {
  confirmationSapCsvFilename,
  fetchConfirmationExportCsv,
  fetchConfirmationExportXlsx,
  fetchMassConfirmExportSummary,
  postConfirmQcApproveBatch,
} from '@/lib/api-public'
import { APP_INTERACTIVE_MOTION } from '@/lib/app-motion'
import { cn } from '@/lib/utils'
import { usePermission } from '@/lib/use-permission'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

export type MassConfirmBatchResult = {
  succeeded: number[]
  failed: { idiw37: number; message: string }[]
}

export type MassConfirmExportPanelProps = {
  batch: MassConfirmBatchResult
  onDismiss?: () => void
}

export function MassConfirmExportPanel({ batch, onDismiss }: MassConfirmExportPanelProps) {
  const { t } = useTranslation('confirmation')
  const { t: tc } = useTranslation('common')
  const qc = useQueryClient()
  const canQc = usePermission('confirmation.import')
  const [exporting, setExporting] = useState<'csv' | 'xlsx' | null>(null)

  const batchComplete = batch.failed.length === 0 && batch.succeeded.length > 0

  const summaryQ = useQuery({
    queryKey: ['confirmation', 'mass-export-summary', batch.succeeded],
    queryFn: () => fetchMassConfirmExportSummary(batch.succeeded),
    enabled: batch.succeeded.length > 0,
  })

  const summary: MassConfirmExportSummary | undefined = summaryQ.data

  const approveMut = useMutation({
    mutationFn: () => postConfirmQcApproveBatch(batch.succeeded),
    onSuccess: async (res) => {
      toast.success(t('massExport.toastQcApproved', { count: res.approved.length }))
      await summaryQ.refetch()
      await qc.invalidateQueries({ queryKey: ['confirmation', 'qc', 'pending'] })
      await qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const downloadExport = async (format: 'csv' | 'xlsx') => {
    if (!summary?.exportable) {
      toast.error(t('massExport.noExportableRows'))
      return
    }
    try {
      setExporting(format)
      const blob =
        format === 'csv'
          ? await fetchConfirmationExportCsv(batch.succeeded)
          : await fetchConfirmationExportXlsx(batch.succeeded)
      downloadBlob(
        blob,
        format === 'csv' ? confirmationSapCsvFilename() : 'Export_Confirm.xlsx',
      )
      toast.success(t('massExport.downloadSuccess', { count: summary.exportable }))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('export.exportFailed'))
    } finally {
      setExporting(null)
    }
  }

  if (batch.succeeded.length === 0) return null

  return (
    <div className="app-tone-info-section space-y-3 rounded-card border p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="flex flex-wrap items-center gap-2 text-body-sm font-semibold text-app">
            {t('massExport.title')}
            {batchComplete ? (
              <Badge variant="default" className="tabular-nums">
                {t('massExport.batchComplete', { count: batch.succeeded.length })}
              </Badge>
            ) : (
              <Badge variant="secondary" className="tabular-nums">
                {t('massExport.batchPartial', {
                  ok: batch.succeeded.length,
                  failed: batch.failed.length,
                })}
              </Badge>
            )}
          </h3>
          <p className="mt-1 text-xs text-app-muted">{t('massExport.stepsHint')}</p>
        </div>
        {onDismiss ? (
          <Button type="button" variant="ghost" size="sm" onClick={onDismiss}>
            {tc('actions.close')}
          </Button>
        ) : null}
      </div>

      {summaryQ.isLoading ? (
        <Skeleton className="h-24 w-full rounded-xl" aria-label={t('massExport.checkingBatch')} />
      ) : summaryQ.isError ? (
        <QueryLoadErrorState
          title={t('massExport.summaryFailed')}
          error={summaryQ.error}
          action={{ label: tc('actions.retry'), onClick: () => void summaryQ.refetch() }}
        />
      ) : summary ? (
        <>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="app-tone-info-chip rounded-lg px-2.5 py-1 tabular-nums">
              {t('massExport.readyExport')}: <strong>{summary.exportable}</strong>
            </span>
            <span className="app-tone-info-chip rounded-lg px-2.5 py-1 tabular-nums">
              {t('massExport.qcPending')}: <strong>{summary.qcPending}</strong>
            </span>
            <span className="app-tone-info-chip rounded-lg px-2.5 py-1 tabular-nums">
              {t('massExport.qcApproved')}: <strong>{summary.qcApproved}</strong>
            </span>
          </div>

          <div className="app-table-shell max-h-48 overflow-auto">
            <Table embedded stickyHeader zebra>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('massExport.colWo')}</TableHead>
                  <TableHead>{t('massExport.colQc')}</TableHead>
                  <TableHead>{t('massExport.colExport')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.items.map((row) => (
                  <TableRow key={row.idiw37}>
                    <TableCell className="text-xs font-medium tabular-nums">{row.wkorder}</TableCell>
                    <TableCell className="text-xs">
                      {row.qcStatus === 'pending'
                        ? t('qc.statusPending')
                        : row.qcStatus === 'approved'
                          ? t('qc.statusApproved')
                          : row.qcStatus === 'rejected'
                            ? t('qc.statusRejected')
                            : '—'}
                    </TableCell>
                    <TableCell className="text-xs">
                      {row.exportable ? t('massExport.exportReady') : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-wrap gap-2">
            {canQc && summary.qcPending > 0 ? (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className={cn('gap-1.5', APP_INTERACTIVE_MOTION)}
                disabled={approveMut.isPending}
                onClick={() => approveMut.mutate()}
              >
                <ShieldCheck className="size-4" aria-hidden />
                {approveMut.isPending
                  ? t('massExport.approvingQc')
                  : t('massExport.approveQcBatch', { count: summary.qcPending })}
              </Button>
            ) : null}
            <ReportExportButton
              format="csv"
              label={t('massExport.confirmOutCsv')}
              loading={exporting === 'csv'}
              disabled={!summary.exportable || exporting != null}
              onClick={() => void downloadExport('csv')}
            />
            <ReportExportButton
              format="xlsx"
              label={t('massExport.excelBatch')}
              loading={exporting === 'xlsx'}
              disabled={!summary.exportable || exporting != null}
              onClick={() => void downloadExport('xlsx')}
            />
            <Button type="button" size="sm" variant="outline" asChild>
              <Link to="/integration">{t('massExport.integrationCenter')}</Link>
            </Button>
          </div>
        </>
      ) : null}

      {batch.failed.length > 0 ? (
        <p className="app-tone-warning-label text-xs">
          {t('massExport.partialCloseFailed', { count: batch.failed.length })}
        </p>
      ) : null}
    </div>
  )
}
