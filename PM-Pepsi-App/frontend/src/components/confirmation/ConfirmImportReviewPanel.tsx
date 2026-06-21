import type { ConfirmationImportPreviewResponse } from '@/api/schemas'
import { ImportReviewActionBadge } from '@/components/integration/ImportReviewActionBadge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

type RowFilter = 'all' | 'error' | 'skipped' | 'ok'

type ConfirmImportReviewPanelProps = {
  preview: ConfirmationImportPreviewResponse
  onCommit: () => void
  onCancel: () => void
  committing?: boolean
}

export function ConfirmImportReviewPanel({
  preview,
  onCommit,
  onCancel,
  committing = false,
}: ConfirmImportReviewPanelProps) {
  const { t } = useTranslation('confirmation')
  const { t: tc } = useTranslation('common')
  const [filter, setFilter] = useState<RowFilter>('all')

  const filteredRows = useMemo(() => {
    if (filter === 'all') return preview.rows
    if (filter === 'error') return preview.rows.filter((r) => r.action === 'error')
    if (filter === 'skipped') return preview.rows.filter((r) => r.action === 'skipped')
    return preview.rows.filter((r) => r.action === 'inserted' || r.action === 'updated')
  }, [preview.rows, filter])

  const canCommit = preview.inserted + preview.updated > 0

  const filterLabels: Record<RowFilter, string> = {
    all: t('importReview.filterAll'),
    ok: t('importReview.filterOk'),
    skipped: t('importReview.filterSkipped'),
    error: t('importReview.filterError'),
  }

  return (
    <div className="app-tone-warning-review mt-4 space-y-4 rounded-card border p-4">
      <div>
        <h4 className="app-tone-warning-strong text-body-sm font-semibold">{t('importReview.title')}</h4>
        <p className="app-tone-warning-label mt-1 text-xs">
          {t('importReview.summaryMeta', {
            fileName: preview.fileName,
            layout: preview.layout,
            parseOk: preview.parseOk,
            matchWoInDb: preview.matchWoInDb,
          })}
        </p>
        <p className="app-tone-warning-label mt-1 text-xs">
          {t('importReview.summaryCounts', {
            inserted: preview.inserted,
            updated: preview.updated,
            skipped: preview.skipped,
            errors: preview.errors,
          })}
        </p>
      </div>

      {preview.matchWoInDb === 0 && preview.parseOk > 0 ? (
        <div
          role="alert"
          className="app-tone-danger-callout rounded-button border px-3 py-2 text-body-sm"
        >
          <p className="font-medium">{t('importReview.noOrderMatchTitle')}</p>
          <p className="mt-1 text-xs opacity-90">{t('importReview.noOrderMatchDesc')}</p>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {(['all', 'ok', 'skipped', 'error'] as const).map((key) => (
          <Button
            key={key}
            type="button"
            size="sm"
            variant={filter === key ? 'default' : 'outline'}
            onClick={() => setFilter(key)}
          >
            {filterLabels[key]}
          </Button>
        ))}
      </div>

      <div className="app-table-shell max-h-72 overflow-auto">
        <Table embedded stickyHeader zebra>
          <TableHeader>
            <TableRow>
              <TableHead>{t('importReview.colNo')}</TableHead>
              <TableHead>{t('import.colOrder')}</TableHead>
              <TableHead>{t('import.colConfirm')}</TableHead>
              <TableHead>{t('import.colWkctr')}</TableHead>
              <TableHead>{t('importReview.colResult')}</TableHead>
              <TableHead>{t('importReview.colMessage')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.slice(0, 200).map((r) => (
              <TableRow key={`${r.rowNo}-${r.wkorder}-${r.confirmation}`}>
                <TableCell className="tabular-nums">{r.rowNo}</TableCell>
                <TableCell className="font-mono text-xs">{r.wkorder}</TableCell>
                <TableCell className="font-mono text-xs">{r.confirmation}</TableCell>
                <TableCell className="font-mono text-xs">{r.wkctr}</TableCell>
                <TableCell>
                  <ImportReviewActionBadge action={r.action} />
                </TableCell>
                <TableCell className="max-w-[240px] truncate text-xs">{r.message}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" disabled={!canCommit || committing} onClick={onCommit}>
          {committing ? t('importReview.committing') : t('importReview.confirmImport')}
        </Button>
        <Button type="button" variant="outline" disabled={committing} onClick={onCancel}>
          {tc('actions.cancel')}
        </Button>
      </div>
    </div>
  )
}
