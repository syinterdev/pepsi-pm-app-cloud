import { QueryLoadErrorState } from '@/components/ui/query-load-error'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { TableSkeletonRows } from '@/components/ui/table-skeleton'
import { useTranslation } from 'react-i18next'

export function MasterDataPanelSkeleton({ columns = 5, rows = 8 }: { columns?: number; rows?: number }) {
  return (
    <div className="space-y-2" aria-busy="true">
      <Skeleton className="h-9 w-40 rounded-card" />
      <div className="app-table-shell overflow-x-auto">
        <Table embedded stickyHeader zebra>
          <TableHeader>
            <TableRow>
              {Array.from({ length: columns }, (_, i) => (
                <TableHead key={i}>
                  <Skeleton className="h-4 w-16" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableSkeletonRows rows={rows} columns={columns} />
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export function MasterDataPanelError({
  error,
  onRetry,
}: {
  error: unknown
  onRetry?: () => void
}) {
  const { t } = useTranslation('masterData')
  const message = error instanceof Error ? error.message : String(error)
  return (
    <QueryLoadErrorState
      title={t('panel.loadFailed')}
      error={error}
      description={message}
      action={onRetry ? { label: t('panel.retry'), onClick: onRetry } : undefined}
    />
  )
}

export function MasterDataPanelEmpty({ description }: { description?: string }) {
  const { t } = useTranslation('masterData')
  return (
    <EmptyState
      title={t('panel.empty')}
      description={description ?? t('panel.emptyHint')}
    />
  )
}
