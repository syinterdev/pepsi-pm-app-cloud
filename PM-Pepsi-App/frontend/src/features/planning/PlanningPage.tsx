import { PlanningAssignDialog, type PlanningAssignTarget } from '@/components/planning/PlanningAssignDialog'
import { CanPermission } from '@/components/auth/CanPermission'
import { AppPageSection, AppPageSectionCard, AppPageShell } from '@/components/layout/AppPageShell'
import { WorkOrderDetailDialog } from '@/components/scheduling/WorkOrderDetailDialog'
import { WktypeDisplay } from '@/components/scheduling/WktypeDisplay'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { QueryLoadErrorState } from '@/components/ui/query-load-error'
import { TableSkeletonRows } from '@/components/ui/table-skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { planningItemSchema } from '@/api/schemas'
import { getStoredAuthUser } from '@/features/auth/login-api'
import { fetchPlanning, postPlanningOrderAck } from '@/lib/api-public'
import { formatPlanningHourValue } from '@/lib/planning-available-hours'
import {
  appCssMotionClassWhen,
  PLANNING_ACK_PULSE_ANIMATED,
  PLANNING_ACK_PULSE_STATIC,
} from '@/lib/app-motion'
import { usePlanningAckPulseOnce } from '@/lib/use-planning-ack-pulse'
import { usePlanningRowHighlight } from '@/lib/use-planning-row-highlight'
import { usePermission } from '@/lib/use-permission'
import { cn } from '@/lib/utils'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useReducedMotion } from 'framer-motion'
import { AlertCircle, CheckCircle2, ClipboardList, Loader2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import type { TFunction } from 'i18next'
import type { z } from 'zod'

type PlanningRow = z.infer<typeof planningItemSchema>

function planningStatusMap(t: TFunction<'planning'>) {
  return {
    OPEN: { label: t('status.OPEN'), variant: 'secondary' as const },
    CONF: { label: t('status.CONF'), variant: 'default' as const },
    CLOS: { label: t('status.CLOS'), variant: 'outline' as const },
  }
}

export function PlanningPage() {
  const { t } = useTranslation('planning')
  const { t: tc } = useTranslation('common')
  const qc = useQueryClient()
  const navigate = useNavigate()
  const statusMap = useMemo(() => planningStatusMap(t), [t])
  const authUser = getStoredAuthUser()
  const canRead = usePermission('planning.read')
  const canAssign = usePermission('planning.assign')
  const canIw37n = usePermission('iw37n.read')
  const [planningStatus, setPlanningStatus] = useState<'open' | 'closed'>('open')
  const [detailId, setDetailId] = useState<string | null>(null)
  const [assignTarget, setAssignTarget] = useState<PlanningAssignTarget | null>(null)
  const reduceMotion = useReducedMotion()
  const { highlightRow, highlightId, rowHighlightProps } = usePlanningRowHighlight(!!reduceMotion)
  const q = useQuery({
    queryKey: ['planning', planningStatus],
    queryFn: () => fetchPlanning({ status: planningStatus }),
    enabled: canRead,
    placeholderData: keepPreviousData,
  })
  const myCode = (authUser?.wkctr || authUser?.username || authUser?.idwkctr || '').trim()

  const ackMut = useMutation({
    mutationFn: (idiw37: number) => postPlanningOrderAck(idiw37),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['planning'] })
      toast.success(t('ack.success'))
    },
    onError: (err) => toast.error((err as Error).message || t('ack.failed')),
  })

  const openAssign = (row: PlanningRow) => {
    setAssignTarget({
      idiw37: Number(row.id),
      wkorder: row.wkorder ?? row.id,
      planDate: row.planDate,
      workHours: row.workHours,
      importWkctr: row.importWkctr,
    })
  }

  const rows = q.data ?? []
  const { isPulsing } = usePlanningAckPulseOnce(rows, q.isFetched, planningStatus)

  useEffect(() => {
    if (!highlightId) return
    const row = document.querySelector<HTMLElement>(`[data-planning-row-id="${highlightId}"]`)
    row?.scrollIntoView({ block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' })
  }, [highlightId, reduceMotion])

  if (!canRead) {
    return (
      <AppPageShell title={t('title')} description={t('description')}>
        <EmptyState
          icon={AlertCircle}
          title={t('noAccess')}
          description={
            <>
              {t('noAccessHint')} <code className="text-xs">planning.read</code>
            </>
          }
        />
      </AppPageShell>
    )
  }

  return (
    <>
      <AppPageShell
        title={t('title')}
        description={t('description')}
        hints={[t('hints.openClosed'), t('hints.assign'), t('hints.close'), t('hints.wo')]}
        headerActions={
          <>
            <Badge variant="secondary" className="text-xs">
              {planningStatus === 'open' ? t('badgeOpen') : t('badgeClosed')}
            </Badge>
            <CanPermission permission="planning.read">
              <Button type="button" variant="outline" size="sm" asChild>
                <Link to="/plan-calendar">{t('actions.planCalendar')}</Link>
              </Button>
            </CanPermission>
            <CanPermission permission="work-orders.read">
              <Button type="button" variant="outline" size="sm" asChild>
                <Link to="/work-orders">{t('actions.woConfirm')}</Link>
              </Button>
            </CanPermission>
            <CanPermission permission="iw37n.read">
              <Button type="button" variant="outline" size="sm" asChild>
                <Link to="/iw37n">{t('actions.iw37n')}</Link>
              </Button>
            </CanPermission>
          </>
        }
      >
        <AppPageSection index={0}>
          <AppPageSectionCard
            icon={ClipboardList}
            title={t('list.title')}
            description={t('list.description')}
            badge={
              <Badge variant="secondary" className="text-[10px]">
                {planningStatus === 'open' ? t('badgeOpen') : t('badgeClosed')}
              </Badge>
            }
            actions={
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={planningStatus === 'open' ? 'default' : 'outline'}
                  onClick={() => setPlanningStatus('open')}
                >
                  {t('list.openJobs')}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={planningStatus === 'closed' ? 'default' : 'outline'}
                  onClick={() => setPlanningStatus('closed')}
                >
                  {t('list.closedJobs')}
                </Button>
              </div>
            }
            bodyClassName="space-y-3"
          >
            {q.isLoading && !q.data ? (
              <div
                className="app-table-shell max-h-[min(70vh,720px)] overflow-auto"
                aria-busy="true"
                aria-label={t('list.loading')}
              >
                <Table embedded stickyHeader zebra>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('table.wo')}</TableHead>
                      <TableHead>{t('table.type')}</TableHead>
                      <TableHead>{t('table.detail')}</TableHead>
                      <TableHead>{t('table.lineFl')}</TableHead>
                      <TableHead>{t('table.plan')}</TableHead>
                      <TableHead>{t('table.hours')}</TableHead>
                      <TableHead>{t('table.moved')}</TableHead>
                      {planningStatus === 'closed' ? (
                        <TableHead>{t('table.closedDate')}</TableHead>
                      ) : null}
                      <TableHead>{t('table.status')}</TableHead>
                      {planningStatus === 'open' ? (
                        <TableHead>{t('table.ack')}</TableHead>
                      ) : null}
                      <TableHead>{t('table.owner')}</TableHead>
                      <TableHead className="text-right">{t('table.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableSkeletonRows rows={10} columns={11} narrowFirstColumn />
                  </TableBody>
                </Table>
              </div>
            ) : q.isError ? (
              <QueryLoadErrorState
                title={t('list.loadFailed')}
                error={q.error}
                action={{ label: tc('actions.retry'), onClick: () => void q.refetch() }}
              />
            ) : rows.length === 0 ? (
              <EmptyState
                icon={ClipboardList}
                title={planningStatus === 'open' ? t('list.emptyOpen') : t('list.emptyClosed')}
                description={
                  planningStatus === 'open' ? t('list.emptyOpenHint') : t('list.emptyClosedHint')
                }
                action={
                  planningStatus === 'open'
                    ? canIw37n
                      ? { label: t('list.goIw37n'), onClick: () => navigate('/iw37n') }
                      : undefined
                    : { label: t('list.showOpenJobs'), onClick: () => setPlanningStatus('open') }
                }
              />
            ) : (
              <>
                <p className="text-caption">
                  {t('list.showing', { count: rows.length.toLocaleString() })}
                  {q.isFetching ? t('list.updating') : ''}
                </p>
                <div className="app-table-shell max-h-[min(70vh,720px)] overflow-auto">
                  <Table embedded stickyHeader zebra>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('table.wo')}</TableHead>
                    <TableHead>{t('table.type')}</TableHead>
                    <TableHead>{t('table.detail')}</TableHead>
                    <TableHead>{t('table.lineFl')}</TableHead>
                    <TableHead>{t('table.plan')}</TableHead>
                    <TableHead>{t('table.hours')}</TableHead>
                    <TableHead>{t('table.moved')}</TableHead>
                    {planningStatus === 'closed' ? (
                      <TableHead>{t('table.closedDate')}</TableHead>
                    ) : null}
                    <TableHead>{t('table.status')}</TableHead>
                    {planningStatus === 'open' ? (
                      <TableHead>{t('table.ack')}</TableHead>
                    ) : null}
                    <TableHead>{t('table.owner')}</TableHead>
                    <TableHead className="text-right">{t('table.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((p) => {
                    const st = statusMap[p.status] ?? { label: p.status, variant: 'outline' as const }
                    const hl = rowHighlightProps(p.id)
                    return (
                      <TableRow
                        key={p.id}
                        data-planning-row-id={hl['data-planning-row-id']}
                        data-planning-row-highlight={hl['data-planning-row-highlight']}
                        className={cn(hl.className)}
                      >
                        <TableCell>
                          <Link
                            to={`/work-orders/${p.id}`}
                            className="font-mono text-body-sm text-[var(--brand-pepsi-blue)] hover:underline"
                            title={t('table.viewInList')}
                          >
                            {p.wkorder ?? p.id}
                          </Link>
                        </TableCell>
                        <TableCell className="text-body-sm">
                          {p.wktype ? <WktypeDisplay code={p.wktype} /> : '—'}
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-body-sm">{p.planName}</TableCell>
                        <TableCell className="text-body-sm">{p.line}</TableCell>
                        <TableCell className="whitespace-nowrap text-body-sm">{p.planDate ?? '—'}</TableCell>
                        <TableCell className="whitespace-nowrap text-body-sm tabular-nums">
                          {p.workHours != null && p.workHours > 0
                            ? `${formatPlanningHourValue(p.workHours)} ${t('table.hoursUnit')}`
                            : '—'}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-body-sm">{p.movedDate ?? '—'}</TableCell>
                        {planningStatus === 'closed' ? (
                          <TableCell className="whitespace-nowrap text-body-sm">
                            {p.closedDate ?? '—'}
                          </TableCell>
                        ) : null}
                        <TableCell>
                          <Badge variant={st.variant}>{st.label}</Badge>
                        </TableCell>
                        {planningStatus === 'open' ? (
                          <TableCell>
                            {p.ackStatus === 'acknowledged' ? (
                              <Badge className="app-tone-success-fill text-badge">
                                <CheckCircle2 className="mr-1 size-3" />
                                {t('ack.acknowledged')}
                              </Badge>
                            ) : p.ackStatus === 'pending' ? (
                              <div
                                className={cn(
                                  'flex flex-wrap items-center gap-1.5',
                                  appCssMotionClassWhen(
                                    isPulsing(p.id),
                                    reduceMotion,
                                    PLANNING_ACK_PULSE_ANIMATED,
                                    PLANNING_ACK_PULSE_STATIC,
                                  ),
                                )}
                              >
                                <Badge variant="outline" className="app-tone-warning-badge">
                                  {t('ack.pending')}
                                </Badge>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  disabled={ackMut.isPending}
                                  onClick={() => ackMut.mutate(Number(p.id))}
                                >
                                  {ackMut.isPending ? (
                                    <Loader2 className="mr-1 size-3.5 animate-spin" />
                                  ) : null}
                                  {t('ack.acknowledge')}
                                </Button>
                              </div>
                            ) : (
                              <span className="text-caption text-app-muted">—</span>
                            )}
                          </TableCell>
                        ) : null}
                        <TableCell className="text-body-sm">{p.owner || '—'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-wrap justify-end gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => setDetailId(p.id)}
                              title={
                                planningStatus === 'open'
                                  ? t('row.closeTabOpen')
                                  : t('row.closeTabClosed')
                              }
                            >
                              {planningStatus === 'open'
                                ? t('row.recordClose')
                                : t('row.viewClose')}
                            </Button>
                            {planningStatus === 'open' ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="default"
                                disabled={!canAssign}
                                onClick={() => openAssign(p)}
                                title={
                                  !canAssign
                                    ? t('row.assignNoPermission')
                                    : p.status === 'CONF'
                                      ? t('row.assignTitleUpdate')
                                      : t('row.assignTitleNew')
                                }
                              >
                                {t('row.assign')}
                              </Button>
                            ) : null}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
              </>
            )}
          </AppPageSectionCard>
        </AppPageSection>
      </AppPageShell>

      <PlanningAssignDialog
        target={assignTarget}
        onClose={() => setAssignTarget(null)}
        myCode={myCode}
        onAssignSuccess={(idiw37) => highlightRow(idiw37)}
      />

      <WorkOrderDetailDialog
        orderId={detailId}
        initialTab="confirm"
        onOpenChange={(open) => {
          if (!open) setDetailId(null)
        }}
      />
    </>
  )
}
