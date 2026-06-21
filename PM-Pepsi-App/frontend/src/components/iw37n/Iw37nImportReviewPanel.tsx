import type { Iw37nImportPreviewResponse, Iw37nImportSummary } from '@/api/schemas'
import { ImportReviewActionBadge } from '@/components/integration/ImportReviewActionBadge'
import { Badge } from '@/components/ui/badge'
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
import { Link } from 'react-router-dom'

export type Iw37nImportRow = Iw37nImportPreviewResponse['rows'][number]

type RowFilter = 'all' | 'error' | 'skipped' | 'ok'

function duplicateBatchRef(
  t: (key: string, opts?: Record<string, unknown>) => string,
  batchId: string | null,
): string {
  return batchId ? t('review.duplicateRef', { id: batchId }) : ''
}

type Iw37nImportReviewPanelProps = {
  summary: Iw37nImportSummary
  rows: Iw37nImportRow[]
  onCommit: () => void
  onCancel: () => void
  committing?: boolean
}

export function Iw37nImportReviewPanel({
  summary,
  rows,
  onCommit,
  onCancel,
  committing = false,
}: Iw37nImportReviewPanelProps) {
  const { t } = useTranslation('integration')
  const [filter, setFilter] = useState<RowFilter>('all')

  const filteredRows = useMemo(() => {
    if (filter === 'all') return rows
    if (filter === 'error') return rows.filter((r) => r.action === 'error')
    if (filter === 'skipped') return rows.filter((r) => r.action === 'skipped')
    return rows.filter((r) => r.action === 'inserted' || r.action === 'updated')
  }, [rows, filter])

  const canCommit = summary.inserted + summary.updated > 0

  return (
    <div className="app-tone-warning-review mt-4 space-y-4 rounded-card border p-4">
      <div>
        <h4 className="app-tone-warning-strong text-body-sm font-semibold">{t('review.title')}</h4>
        <p className="app-tone-warning-label mt-1 text-xs">
          {t('review.rowSummary', {
            fileName: summary.fileName,
            total: summary.totalRows,
            sha: summary.sha256.slice(0, 12),
          })}{' '}
          <Badge variant="secondary" className="ml-1 text-xs">
            {summary.wouldStatus}
          </Badge>
        </p>
      </div>

      {summary.isDuplicate ? (
        <div role="alert" className="app-tone-info-callout rounded-button border px-3 py-2 text-body-sm">
          <p className="font-medium text-app">
            {t('review.duplicateTitle', {
              batchRef: duplicateBatchRef(t, summary.duplicateOfBatchId),
            })}
          </p>
          <p className="mt-1 text-xs text-app-muted">{t('review.duplicateHint')}</p>
          {summary.duplicateOfBatchId ? (
            <Link
              to="/iw37n"
              className="mt-2 inline-block text-xs font-medium text-[var(--app-accent)] underline"
            >
              {t('review.openIw37n', { id: summary.duplicateOfBatchId })}
            </Link>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label={t('review.statInserted')} value={summary.inserted} tone="success" />
        <Stat label={t('review.statUpdated')} value={summary.updated} tone="info" />
        <Stat label={t('review.statSkipped')} value={summary.skipped} tone="default" />
        <Stat label={t('review.statErrors')} value={summary.errors} tone="danger" />
        <Stat label={t('review.statTotal')} value={summary.totalRows} tone="default" />
      </div>

      {summary.errorGroups.length > 0 ? (
        <div className="app-tone-danger-callout rounded-button border px-3 py-2">
          <p className="text-xs font-medium">
            {t('review.errorSummary', { count: summary.errors })}
          </p>
          <ul className="mt-1 max-h-32 space-y-1 overflow-y-auto text-xs opacity-90">
            {summary.errorGroups.map((g) => (
              <li key={g.message}>
                <span className="font-mono tabular-nums">{g.count}×</span> {g.message}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {(
          [
            ['all', t('review.filterAll', { count: rows.length })],
            ['error', t('review.filterError', { count: summary.errors })],
            ['skipped', t('review.filterSkipped', { count: summary.skipped })],
            [
              'ok',
              t('review.filterOk', { count: summary.inserted + summary.updated }),
            ],
          ] as const
        ).map(([key, label]) => (
          <Button
            key={key}
            type="button"
            size="sm"
            variant={filter === key ? 'default' : 'outline'}
            onClick={() => setFilter(key)}
          >
            {label}
          </Button>
        ))}
      </div>

      <div className="app-table-shell max-h-[min(50vh,420px)] overflow-auto">
        <Table embedded stickyHeader zebra>
          <TableHeader>
            <TableRow>
              <TableHead className="w-14 text-center">{t('review.table.row')}</TableHead>
              <TableHead>{t('review.table.action')}</TableHead>
              <TableHead>{t('review.table.wkorder')}</TableHead>
              <TableHead>{t('review.table.wktype')}</TableHead>
              <TableHead>{t('review.table.message')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-caption">
                  {t('review.filterEmpty')}
                </TableCell>
              </TableRow>
            ) : (
              filteredRows.map((r) => (
                <TableRow key={r.rowNo}>
                  <TableCell className="text-center tabular-nums">{r.rowNo}</TableCell>
                  <TableCell>
                    <ImportReviewActionBadge action={r.action} />
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {r.wkorder}/{r.opac}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{r.wktype}</TableCell>
                  <TableCell className="max-w-[320px] truncate text-xs" title={r.message}>
                    {r.message}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="app-tone-warning-review-divider flex flex-wrap gap-2 border-t pt-3">
        <Button type="button" disabled={!canCommit || committing} onClick={onCommit}>
          {committing ? t('review.committing') : t('review.commit')}
        </Button>
        <Button type="button" variant="outline" disabled={committing} onClick={onCancel}>
          {t('review.cancel')}
        </Button>
        {summary.isDuplicate ? (
          <p className="app-tone-warning-label self-center text-xs font-medium">
            {t('review.cannotCommitDuplicate')}
          </p>
        ) : !canCommit ? (
          <p className="app-tone-warning-label self-center text-xs">{t('review.cannotCommitNoRows')}</p>
        ) : null}
      </div>
    </div>
  )
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: 'success' | 'info' | 'danger' | 'default'
}) {
  const bg =
    tone === 'success'
      ? 'app-tone-success rounded-button px-3 py-2'
      : tone === 'info'
        ? 'app-tone-info rounded-button px-3 py-2'
        : tone === 'danger'
          ? 'app-tone-danger rounded-button px-3 py-2'
          : 'bg-app-muted text-app rounded-button px-3 py-2'
  return (
    <div className={bg}>
      <div className="text-xs opacity-80">{label}</div>
      <div className="text-lg font-semibold tabular-nums">{value}</div>
    </div>
  )
}
