import { AppCard } from '@/components/layout/AppCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { WoPmPhaseBadge } from '@/components/scheduling/WoPmPhaseBadge'
import {
  fetchConfirmationByWorkOrder,
  fetchConfirmationComments,
  fetchPersonnelCloses,
  fetchWorkOrderDetail,
  fetchWorkOrderModalDetail,
} from '@/lib/api-public'
import { buildWoTechnicianStatusRows } from '@/lib/wo-technician-status'
import { isWorkOrderCloseReady } from '@/lib/work-order-close-ready'
import { useQuery } from '@tanstack/react-query'
import { AlertCircle, ClipboardList } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

type Props = {
  orderId: string | null
  onOpenDetail: () => void
}

export function WoConfirmationTechnicianStatus({ orderId, onOpenDetail }: Props) {
  const { t } = useTranslation('workOrders')

  const detailQ = useQuery({
    queryKey: ['work-order', orderId],
    queryFn: () => fetchWorkOrderDetail(orderId!),
    enabled: Boolean(orderId),
  })

  const modalQ = useQuery({
    queryKey: ['work-order', 'modal-detail', orderId, 'status'],
    queryFn: () => fetchWorkOrderModalDetail(orderId!),
    enabled: Boolean(orderId),
  })

  const d = detailQ.data
  const idiw37 = d ? Number(d.id) : NaN

  const personnelQ = useQuery({
    queryKey: ['confirmation', 'personnel-closes', idiw37],
    queryFn: () => fetchPersonnelCloses(idiw37),
    enabled: Number.isFinite(idiw37),
  })

  const closesQ = useQuery({
    queryKey: ['confirmation', 'by-wkorder', d?.wkorder],
    queryFn: () => fetchConfirmationByWorkOrder(d!.wkorder),
    enabled: Boolean(d?.wkorder),
  })

  const commentsQ = useQuery({
    queryKey: ['confirmation', 'comments', idiw37],
    queryFn: () => fetchConfirmationComments(idiw37),
    enabled: Number.isFinite(idiw37),
  })

  const rows = buildWoTechnicianStatusRows({
    workCenter: d?.workCenter,
    assignees: modalQ.data?.planning.assignees,
    personnelCloses: personnelQ.data,
    supervisorCloses: closesQ.data?.items,
  })

  const commentCount = commentsQ.data?.length ?? 0
  const closeReady = d
    ? isWorkOrderCloseReady({
        commentCount,
        imageAfter: d.confirmQc.imageAfter,
      })
    : false

  const closeHint = useMemo(() => {
    if (!d || closeReady) return null
    if (commentCount < 1) return t('technician.hintNeedComment')
    if (d.confirmQc.imageAfter < 1) {
      return t('technician.hintNeedImages')
    }
    return null
  }, [closeReady, commentCount, d, t])

  if (!orderId) {
    return (
      <EmptyState
        icon={ClipboardList}
        title={t('technician.emptyTitle')}
        description={t('technician.emptyDescription')}
      />
    )
  }

  if (detailQ.isLoading) {
    return (
      <Skeleton className="h-48 w-full rounded-card" aria-label={t('technician.loadingAria')} />
    )
  }

  if (detailQ.isError || !d) {
    return (
      <EmptyState
        icon={AlertCircle}
        title={t('technician.loadFailedTitle')}
        description={
          detailQ.error instanceof Error
            ? detailQ.error.message
            : t('technician.loadFailedFallback')
        }
      />
    )
  }

  const pendingCount = rows.filter((r) => r.status === 'pending').length
  const doneCount = rows.filter((r) => r.status === 'done').length

  return (
    <AppCard pad="compact" className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="text-body-sm font-medium text-app">
            {t('technician.workOrderLabel', { wkorder: d.wkorder })}
          </p>
          <p className="line-clamp-2 text-xs text-app-muted">{d.title}</p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <WoPmPhaseBadge phase={d.pmPhase} syst={d.systemStatus} showSyst />
            {d.workCenter ? (
              <Badge variant="outline" className="font-mono text-xs">
                {d.workCenter}
              </Badge>
            ) : null}
          </div>
        </div>
        <Button type="button" size="sm" onClick={onOpenDetail}>
          {t('technician.openDetailClose')}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        <Badge variant="secondary">
          {t('technician.doneCount', { count: doneCount })}
        </Badge>
        <Badge variant="outline" className="app-tone-warning-badge">
          {t('technician.pendingCount', { count: pendingCount })}
        </Badge>
      </div>

      {closeHint ? (
        <p className="app-tone-warning-callout rounded-card border px-3 py-2 text-xs">
          {closeHint}
          {t('technician.closeHintSuffix')}
        </p>
      ) : null}

      {personnelQ.isLoading || closesQ.isLoading || modalQ.isLoading ? (
        <Skeleton className="h-24 w-full rounded-card" />
      ) : rows.length === 0 ? (
        <p className="text-body-sm text-app-muted">{t('technician.noTechnicians')}</p>
      ) : (
        <div className="app-table-shell overflow-x-auto">
          <Table embedded zebra>
            <TableHeader>
              <TableRow>
                <TableHead>{t('technician.colTechCode')}</TableHead>
                <TableHead>{t('technician.colName')}</TableHead>
                <TableHead>{t('technician.colStatus')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.wkctr}>
                  <TableCell className="font-mono text-xs">{row.wkctr}</TableCell>
                  <TableCell className="text-xs">{row.displayName}</TableCell>
                  <TableCell>
                    <Badge
                      variant={row.status === 'done' ? 'default' : 'outline'}
                      className={
                        row.status === 'done'
                          ? 'app-tone-success-fill'
                          : 'app-tone-warning-badge'
                      }
                    >
                      {row.status === 'done'
                        ? t('technician.statusDone')
                        : t('technician.statusPending')}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </AppCard>
  )
}
