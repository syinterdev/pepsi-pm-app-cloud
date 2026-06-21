import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { ConfirmationExportRow } from '@/api/schemas'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'

export const CONFIRMATION_SAP_COLUMN_KEYS = [
  { key: 'wkorder', labelKey: 'export.columns.order' as const },
  { key: 'opac', labelKey: 'export.columns.operation' as const },
  { key: 'wkctr', labelKey: 'export.columns.wrkCtr' as const },
  { key: 'timewk', labelKey: 'export.columns.actWork' as const, align: 'right' as const },
  { key: 'unitc', labelKey: 'export.columns.unit' as const },
  { key: 'startDateExe', labelKey: 'export.columns.startDateExe' as const },
  { key: 'endDateExe', labelKey: 'export.columns.endDateExe' as const },
  { key: 'startExecute', labelKey: 'export.columns.startExecute' as const },
  { key: 'endExecute', labelKey: 'export.columns.endExecute' as const },
] as const

export function formatConfirmationActWork(value: number): string {
  if (!Number.isFinite(value)) return '0.00'
  return value.toFixed(2)
}

export function confirmationRowMatchesSearch(row: ConfirmationExportRow, q: string): boolean {
  const needle = q.trim().toLowerCase()
  if (!needle) return true
  return [
    row.wkorder,
    row.opac,
    row.wkctr,
    row.unitc,
    row.startDateExe,
    row.endDateExe,
    row.startExecute,
    row.endExecute,
    formatConfirmationActWork(row.timewk),
  ].some((part) => part.toLowerCase().includes(needle))
}

export function confirmationRowKey(row: ConfirmationExportRow): string {
  return `${row.wkorder}-${row.opac}-${row.wkctr}-${row.no}`
}

export function ConfirmationSapTableHeaderRow({ showActions = false }: { showActions?: boolean }) {
  const { t } = useTranslation('confirmation')
  return (
    <TableRow className="border-0 bg-[color-mix(in_srgb,var(--app-accent)_88%,var(--app-text))] hover:bg-[color-mix(in_srgb,var(--app-accent)_88%,var(--app-text))]">
      {CONFIRMATION_SAP_COLUMN_KEYS.map((col) => (
        <TableHead
          key={col.key}
          className={cn(
            'whitespace-nowrap text-[11px] font-semibold tracking-wide text-white/95',
            'align' in col && col.align === 'right' ? 'text-right' : undefined,
          )}
        >
          {t(col.labelKey)}
        </TableHead>
      ))}
      {showActions ? (
        <TableHead className="w-32 text-right text-[11px] font-semibold tracking-wide text-white/95">
          {t('review.action')}
        </TableHead>
      ) : null}
    </TableRow>
  )
}

export function ConfirmationSapTableDataRow({
  row,
  index,
  onClick,
  selected,
  action,
}: {
  row: ConfirmationExportRow
  index: number
  onClick?: () => void
  selected?: boolean
  action?: React.ReactNode
}) {
  return (
    <TableRow
      className={cn(
        'border-app/40 transition-colors',
        onClick ? 'cursor-pointer' : undefined,
        selected
          ? 'bg-[color-mix(in_srgb,var(--status-info)_14%,var(--app-surface))]'
          : 'hover:bg-[color-mix(in_srgb,var(--status-info)_8%,var(--app-surface))]',
        !selected && index % 2 === 1 ? 'bg-app-subtle/25' : undefined,
      )}
      onClick={onClick}
    >
      <TableCell className="tabular-nums text-xs font-medium text-app">{row.wkorder}</TableCell>
      <TableCell className="tabular-nums text-xs">{row.opac}</TableCell>
      <TableCell className="tabular-nums text-xs">{row.wkctr}</TableCell>
      <TableCell className="text-right tabular-nums text-xs">
        {formatConfirmationActWork(row.timewk)}
      </TableCell>
      <TableCell className="text-xs">{row.unitc}</TableCell>
      <TableCell className="tabular-nums text-xs">{row.startDateExe}</TableCell>
      <TableCell className="tabular-nums text-xs">{row.endDateExe}</TableCell>
      <TableCell className="tabular-nums text-xs">{row.startExecute}</TableCell>
      <TableCell className="tabular-nums text-xs">{row.endExecute}</TableCell>
      {action != null ? <TableCell className="text-right">{action}</TableCell> : null}
    </TableRow>
  )
}

export type ConfirmationSapTableProps = {
  rows: ConfirmationExportRow[]
  emptyMessage: string
  onRowClick?: (row: ConfirmationExportRow) => void
  selectedKey?: string | null
  renderAction?: (row: ConfirmationExportRow) => React.ReactNode
  minWidthClass?: string
}

export function ConfirmationSapTable({
  rows,
  emptyMessage,
  onRowClick,
  selectedKey,
  renderAction,
  minWidthClass = 'min-w-[56rem]',
}: ConfirmationSapTableProps) {
  const colSpan = CONFIRMATION_SAP_COLUMN_KEYS.length + (renderAction ? 1 : 0)

  return (
    <div className="overflow-x-auto rounded-xl border border-app/70 shadow-sm">
      <Table embedded stickyHeader className={minWidthClass}>
        <TableHeader>
          <ConfirmationSapTableHeaderRow showActions={Boolean(renderAction)} />
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={colSpan} className="py-12 text-center text-xs text-app-muted">
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, index) => (
              <ConfirmationSapTableDataRow
                key={confirmationRowKey(row)}
                row={row}
                index={index}
                selected={selectedKey === confirmationRowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                action={renderAction?.(row)}
              />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
