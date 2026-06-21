import type { WorkOrderTeamCode } from '@/lib/wo-team'
import { ConfirmationImagesPanel } from '@/components/confirmation/ConfirmationImagesPanel'
import { ConfirmQcPanel } from '@/components/confirmation/ConfirmQcPanel'
import { PersonnelClosePanel } from '@/components/confirmation/PersonnelClosePanel'
import { MovePlanDialog } from '@/components/scheduling/MovePlanDialog'
import { WoPmPhaseBadge } from '@/components/scheduling/WoPmPhaseBadge'
import { PlanningTechnicianCards } from '@/components/scheduling/PlanningTechnicianCards'
import { WorkOrderSummaryPanel } from '@/components/scheduling/WorkOrderSummaryPanel'
import type { ConfirmSubTab } from '@/components/scheduling/WorkOrderConfirmPanel'
import { WorkOrderConfirmPanel } from '@/components/scheduling/WorkOrderConfirmPanel'
import { WorkOrderConfirmCommentsSection } from '@/components/scheduling/WorkOrderConfirmCommentsSection'
import { WorkOrderMaterialPanel } from '@/components/scheduling/WorkOrderMaterialPanel'
import { WorkOrderSupervisorCloseSection } from '@/components/scheduling/WorkOrderSupervisorCloseSection'
import { WorkOrderMachinePanel } from '@/components/scheduling/WorkOrderMachinePanel'
import { WorkOrderPmCommentSection } from '@/components/scheduling/WorkOrderPmCommentSection'
import { WorkOrderTaskListPanel } from '@/components/scheduling/WorkOrderTaskListPanel'
import { WorkOrderWorkflowSteps } from '@/components/scheduling/WorkOrderWorkflowSteps'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { QueryLoadErrorState } from '@/components/ui/query-load-error'
import { Skeleton } from '@/components/ui/skeleton'
import {
  SchedulingWoTabsList,
  WoModalTabFade,
  woTabTriggerClass,
} from '@/components/scheduling/SchedulingWoTabs'
import { Tabs, TabsContent, TabsTrigger } from '@/components/ui/tabs'
import {
  deleteConfirmationClose,
  deleteConfirmationComment,
  fetchConfirmationByWorkOrder,
  fetchPersonnelCloses,
  fetchConfirmationComments,
  fetchConfirmationImages,
  fetchWorkOrderModalDetail,
  fetchWorkOrderDetail,
  deleteWorkOrderPlanning,
  deleteWorkOrderPlanningAssignee,
  postConfirmationClose,
  postConfirmationComment,
  postPlanningOrderAck,
  postWorkOrderPlanningBatch,
  putWorkOrderPlanning,
  putWorkOrderTeam,
  putConfirmationComment,
} from '@/lib/api-public'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  isWorkOrderCloseReady,
  workOrderCloseReadyMessage,
} from '@/lib/work-order-close-ready'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Loader2, Maximize2, Minimize2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { usePermission } from '@/lib/use-permission'
import { cn } from '@/lib/utils'

type WorkOrderDetailDialogProps = {
  orderId: string | null
  onOpenChange: (open: boolean) => void
  contextDate?: string
  initialTab?: 'work-order' | 'task-list' | 'machine' | 'planning' | 'material' | 'confirm'
  /** ปฏิทิน — 3 แท็บ Task / Planning / Close WO ตามสไลด์ลูกค้า */
  tabLayout?: 'full' | 'assigned'
}

type MainTab = NonNullable<WorkOrderDetailDialogProps['initialTab']>

const OPEN_WO_SYST = new Set(['CRTD', 'REL'])

function isClosedWorkOrderStatus(systemStatus: string | undefined): boolean {
  const s = (systemStatus ?? '').trim().toUpperCase()
  return s.length > 0 && !OPEN_WO_SYST.has(s)
}

function isoToDdMmYyyy(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim())
  if (!m) return iso
  return `${m[3]}.${m[2]}.${m[1]}`
}

function epochToIsoDate(sec: number): string {
  const d = new Date(sec * 1000)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function epochToTime(sec: number): string {
  const d = new Date(sec * 1000)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function WoModalTabSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('space-y-3', className)}
      role="status"
      aria-busy="true"
      aria-live="polite"
    >
      <Skeleton className="h-20 w-full rounded-card" />
      <Skeleton className="h-32 w-full rounded-card" />
      <Skeleton className="h-10 w-3/4 max-w-sm rounded-button" />
      <Skeleton className="h-10 w-full rounded-button" />
    </div>
  )
}

export function WorkOrderDetailDialog({
  orderId,
  onOpenChange,
  contextDate,
  initialTab = 'work-order',
  tabLayout = 'full',
}: WorkOrderDetailDialogProps) {
  const { t } = useTranslation(['scheduling', 'common'])
  const open = Boolean(orderId)
  const assignedLayout = tabLayout === 'assigned'
  const canPlan = usePermission('planning.assign')
  const planningEditable = canPlan
  const canEditTeam = usePermission('work-orders.write')
  const [moveOpen, setMoveOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<MainTab>(initialTab)
  const [confirmTab, setConfirmTab] = useState<ConfirmSubTab>('close')
  const [closeWkctr, setCloseWkctr] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [startTime, setStartTime] = useState('08:00')
  const [endTime, setEndTime] = useState('17:00')
  const [newComment, setNewComment] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingText, setEditingText] = useState('')
  const [planComment, setPlanComment] = useState('')
  const [dialogExpanded, setDialogExpanded] = useState(false)
  const wasOpenRef = useRef(false)

  const qc = useQueryClient()

  const detailQ = useQuery({
    queryKey: ['work-order', orderId],
    queryFn: () => fetchWorkOrderDetail(orderId!),
    enabled: open,
  })

  const d = detailQ.data
  const idiw37 = useMemo(() => (d?.id ? Number(d.id) : null), [d?.id])
  const modalDate = useMemo(() => contextDate || d?.plannedDate || '', [contextDate, d?.plannedDate])

  const modalQ = useQuery({
    queryKey: ['work-order', 'modal-detail', orderId, modalDate],
    queryFn: () => fetchWorkOrderModalDetail(orderId!, modalDate || undefined),
    enabled: open,
  })

  const personAssignees = useMemo(
    () =>
      (modalQ.data?.planning?.assignees ?? []).filter(
        (a) => a.pwteam !== 'G' && a.kind === 'person',
      ),
    [modalQ.data?.planning?.assignees],
  )
  const groupAssignees = useMemo(
    () =>
      (modalQ.data?.planning?.assignees ?? []).filter(
        (a) => a.pwteam === 'G' || a.kind === 'group',
      ),
    [modalQ.data?.planning?.assignees],
  )

  const closeWoAccess = modalQ.data?.planning.closeWoAccess
  const canShowCloseWoTab = assignedLayout && Boolean(closeWoAccess?.canView)
  const assignedCloseCanWrite = Boolean(closeWoAccess?.canWrite)
  const showPendingAckBanner =
    assignedLayout && closeWoAccess?.reason === 'pending_ack'
  const canAckMyAssignment =
    assignedLayout &&
    closeWoAccess?.reason === 'pending_ack' &&
    closeWoAccess.myAssignment?.ackStatus === 'pending' &&
    typeof idiw37 === 'number'

  const closesQ = useQuery({
    queryKey: ['confirmation', 'by-wkorder', d?.wkorder],
    queryFn: () => fetchConfirmationByWorkOrder(d!.wkorder),
    enabled: open && Boolean(d?.wkorder),
  })

  const personnelQ = useQuery({
    queryKey: ['confirmation', 'personnel-closes', idiw37],
    queryFn: () => fetchPersonnelCloses(idiw37!),
    enabled: open && typeof idiw37 === 'number' && Number.isFinite(idiw37),
  })

  const commentsQ = useQuery({
    queryKey: ['confirmation', 'comments', idiw37],
    queryFn: () => fetchConfirmationComments(idiw37!),
    enabled: open && typeof idiw37 === 'number' && Number.isFinite(idiw37),
  })

  const loadConfirmAssets =
    open &&
    typeof idiw37 === 'number' &&
    Number.isFinite(idiw37) &&
    activeTab === 'confirm'

  const imagesQ = useQuery({
    queryKey: ['confirmation', 'images', idiw37],
    queryFn: () => fetchConfirmationImages(idiw37!),
    enabled: loadConfirmAssets,
  })

  const imageAfterCount = useMemo(() => {
    if (imagesQ.data?.length) {
      return imagesQ.data.filter((img) => img.phase === 'after').length
    }
    return d?.confirmQc?.imageAfter ?? 0
  }, [imagesQ.data, d?.confirmQc?.imageAfter])

  const closeReadyInput = useMemo(
    () => ({
      commentCount: commentsQ.data?.length ?? 0,
      imageAfter: imageAfterCount,
    }),
    [commentsQ.data?.length, imageAfterCount],
  )

  const closeBlockedMessage = workOrderCloseReadyMessage(closeReadyInput)
  const canCloseWorkOrder = isWorkOrderCloseReady(closeReadyInput)

  const personnelCount = personnelQ.data?.length ?? 0
  const supervisorCloseCount = closesQ.data?.items?.length ?? 0
  const imageCount =
    imagesQ.data?.length ?? d?.confirmQc?.imageCount ?? 0
  const confirmWorkflowDone = d?.confirmQc?.status === 'approved'
  const showPostCloseReview = useMemo(
    () =>
      confirmWorkflowDone ||
      isClosedWorkOrderStatus(d?.systemStatus) ||
      personnelCount > 0 ||
      supervisorCloseCount > 0 ||
      imageCount > 0,
    [
      confirmWorkflowDone,
      d?.systemStatus,
      personnelCount,
      supervisorCloseCount,
      imageCount,
    ],
  )

  const confirmTabPending = useMemo(
    () =>
      typeof idiw37 === 'number' &&
      Number.isFinite(idiw37) &&
      ((closesQ.isLoading && !closesQ.data) ||
        (personnelQ.isLoading && !personnelQ.data) ||
        (commentsQ.isLoading && !commentsQ.data)),
    [
      idiw37,
      closesQ.isLoading,
      closesQ.data,
      personnelQ.isLoading,
      personnelQ.data,
      commentsQ.isLoading,
      commentsQ.data,
    ],
  )

  const openConfirmSubview = (sub: ConfirmSubTab) => {
    setActiveTab('confirm')
    setConfirmTab(sub)
  }

  const addCloseMut = useMutation({
    mutationFn: async () =>
      postConfirmationClose({
        idiw37: Number(d!.id),
        wkctr: closeWkctr || d!.workCenter,
        startD: isoToDdMmYyyy(startDate),
        startT: startTime,
        endD: isoToDdMmYyyy(endDate),
        endT: endTime,
      }),
    onSuccess: async () => {
      toast.success(t('woDialog.toastCloseSaved'))
      await qc.invalidateQueries({ queryKey: ['confirmation', 'by-wkorder', d?.wkorder] })
      await qc.invalidateQueries({ queryKey: ['work-order', orderId] })
    },
    onError: (e: Error) => toast.error(e.message || t('woDialog.toastCloseFailed')),
  })

  const delCloseMut = useMutation({
    mutationFn: (idclose: number) => deleteConfirmationClose(idclose),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['confirmation', 'by-wkorder', d?.wkorder] })
    },
  })

  const addCommentMut = useMutation({
    mutationFn: () => postConfirmationComment(idiw37!, newComment),
    onSuccess: async () => {
      setNewComment('')
      await qc.invalidateQueries({ queryKey: ['confirmation', 'comments', idiw37] })
    },
  })

  const saveCommentMut = useMutation({
    mutationFn: () => putConfirmationComment(editingId!, editingText),
    onSuccess: async () => {
      setEditingId(null)
      setEditingText('')
      await qc.invalidateQueries({ queryKey: ['confirmation', 'comments', idiw37] })
    },
  })

  const delCommentMut = useMutation({
    mutationFn: (idcom: number) => deleteConfirmationComment(idcom),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['confirmation', 'comments', idiw37] })
    },
  })

  const assignPlanMut = useMutation({
    mutationFn: (args: { mode: 'P' | 'G'; code: string }) =>
      putWorkOrderPlanning(orderId!, { mode: args.mode, code: args.code, comment: planComment.trim() || undefined }),
    onSuccess: async (_data, args) => {
      setPlanComment('')
      toast.success(
        args.mode === 'G' ? t('woDialog.toastAssignGroupOk') : t('woDialog.toastAssignPersonOk'),
      )
      await qc.invalidateQueries({ queryKey: ['work-order', 'modal-detail', orderId] })
      await qc.invalidateQueries({ queryKey: ['work-order', orderId] })
      await qc.invalidateQueries({ queryKey: ['plan-calendar'] })
      await qc.invalidateQueries({ queryKey: ['planning'] })
      await qc.invalidateQueries({ queryKey: ['calendar'] })
    },
    onError: (e: Error) => toast.error(e.message || t('woDialog.toastAssignFailed')),
  })

  const teamMut = useMutation({
    mutationFn: (team: WorkOrderTeamCode) => putWorkOrderTeam(orderId!, team),
    onSuccess: async (_data, team) => {
      toast.success(t('woDialog.toastTeamOk', { team }))
      await qc.invalidateQueries({ queryKey: ['work-order', orderId] })
      await qc.invalidateQueries({ queryKey: ['work-orders', 'search'] })
      await qc.invalidateQueries({ queryKey: ['work-orders', 'filter-detail'] })
      await qc.invalidateQueries({ queryKey: ['plan-calendar'] })
      await qc.invalidateQueries({ queryKey: ['backlog'] })
      await qc.invalidateQueries({ queryKey: ['calendar'] })
    },
    onError: (e: Error) => toast.error(e.message || t('woDialog.toastTeamFailed')),
  })

  const deletePlanMut = useMutation({
    mutationFn: () => deleteWorkOrderPlanning(orderId!),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['work-order', 'modal-detail', orderId] })
      await qc.invalidateQueries({ queryKey: ['work-order', orderId] })
      await qc.invalidateQueries({ queryKey: ['plan-calendar'] })
      await qc.invalidateQueries({ queryKey: ['calendar'] })
    },
  })

  const removeAssigneeMut = useMutation({
    mutationFn: (wkctr: string) => deleteWorkOrderPlanningAssignee(orderId!, wkctr),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['work-order', 'modal-detail', orderId] })
      await qc.invalidateQueries({ queryKey: ['work-order', orderId] })
      await qc.invalidateQueries({ queryKey: ['plan-calendar'] })
      await qc.invalidateQueries({ queryKey: ['calendar'] })
    },
  })

  const batchAssignMut = useMutation({
    mutationFn: (codes: string[]) =>
      postWorkOrderPlanningBatch(orderId!, {
        wkctrs: codes,
        comment: planComment.trim() || undefined,
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['work-order', 'modal-detail', orderId] })
      await qc.invalidateQueries({ queryKey: ['work-order', orderId] })
      await qc.invalidateQueries({ queryKey: ['plan-calendar'] })
      await qc.invalidateQueries({ queryKey: ['planning'] })
      await qc.invalidateQueries({ queryKey: ['calendar'] })
    },
  })

  const ackMut = useMutation({
    mutationFn: () => postPlanningOrderAck(idiw37!),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['work-order', 'modal-detail', orderId] })
      await qc.invalidateQueries({ queryKey: ['planning'] })
      await qc.invalidateQueries({ queryKey: ['plan-calendar'] })
      await qc.invalidateQueries({ queryKey: ['calendar'] })
      toast.success(t('woDialog.ackSuccess'))
    },
    onError: (err) => toast.error((err as Error).message || t('woDialog.ackFailed')),
  })

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      setActiveTab(initialTab)
      setConfirmTab('close')
    }
    if (!open) {
      setDialogExpanded(false)
    }
    wasOpenRef.current = open
  }, [open, orderId, initialTab])

  useEffect(() => {
    if (assignedLayout && activeTab === 'confirm' && !canShowCloseWoTab) {
      setActiveTab('task-list')
    }
  }, [assignedLayout, activeTab, canShowCloseWoTab])

  useEffect(() => {
    if (!d) return
    if (!closeWkctr) setCloseWkctr(d.workCenter)
  }, [d, closeWkctr])

  function applyPersonnelToSupervisorClose(row: {
    wkctr: string
    cstdate: number
    cendate: number
  }) {
    setCloseWkctr(row.wkctr)
    setStartDate(epochToIsoDate(row.cstdate))
    setStartTime(epochToTime(row.cstdate))
    setEndDate(epochToIsoDate(row.cendate))
    setEndTime(epochToTime(row.cendate))
    setConfirmTab('close')
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          size={dialogExpanded ? 'full' : 'lg'}
          className={cn(
            'flex flex-col gap-0 overflow-hidden p-0 transition-[width,max-width,max-height] duration-200',
            'max-sm:fixed max-sm:inset-0 max-sm:h-[100dvh] max-sm:max-h-[100dvh] max-sm:w-full max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-none',
            'sm:max-h-[min(92dvh,900px)]',
          )}
        >
          <button
            type="button"
            aria-label={dialogExpanded ? t('shared.collapseDialog') : t('shared.expandDialog')}
            title={dialogExpanded ? t('shared.collapseDialog') : t('shared.expandDialog')}
            onClick={() => setDialogExpanded((v) => !v)}
            className="absolute right-11 top-4 z-10 inline-flex items-center gap-1 rounded-button border border-app/70 bg-[var(--app-surface)] px-2 py-1 text-xs font-medium text-app shadow-sm transition-colors hover:bg-app-subtle"
          >
            {dialogExpanded ? (
              <>
                <Minimize2 className="size-3.5" aria-hidden />
                {t('shared.collapse')}
              </>
            ) : (
              <>
                <Maximize2 className="size-3.5" aria-hidden />
                {t('shared.expand')}
              </>
            )}
          </button>
          <div className="shrink-0 space-y-3 border-b border-app bg-gradient-to-b from-[color-mix(in_srgb,var(--app-accent)_4%,var(--app-surface))] to-[var(--app-surface)] px-4 pb-3 pt-6 sm:px-6">
            <DialogHeader className="space-y-1 text-left">
              <DialogTitle className="pr-28 text-left">
                {d ? (
                  assignedLayout ? (
                    <span className="font-mono text-lg">
                      {t('woDialog.titleWithWkorder', { wkorder: d.wkorder })}
                    </span>
                  ) : (
                    <span className="flex flex-wrap items-center gap-2">
                      <span>{d.title}</span>
                      <WoPmPhaseBadge phase={d.pmPhase} syst={d.status} showSyst />
                      {d.team ? (
                        <Badge variant="secondary">{t('shared.teamBadge', { team: d.team })}</Badge>
                      ) : null}
                    </span>
                  )
                ) : detailQ.isLoading ? (
                  <Skeleton className="h-6 w-56 max-w-full" />
                ) : (
                  t('woDialog.title')
                )}
              </DialogTitle>
              <DialogDescription className="sr-only">
                {d ? t('woDialog.titleWithWkorder', { wkorder: d.wkorder }) : t('woDialog.title')}
              </DialogDescription>
            </DialogHeader>

            {detailQ.isLoading && !d && !assignedLayout ? (
              <Skeleton className="h-10 w-full max-w-lg rounded-card" />
            ) : d?.workflow && !assignedLayout ? (
              <WorkOrderWorkflowSteps
                steps={d.workflow.steps}
                suffix={d.workflow.suffix}
                compact
              />
            ) : null}
          </div>

          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {showPostCloseReview && d && !assignedLayout ? (
            <div className="shrink-0 border-b border-app/60 px-4 py-3 sm:px-6">
              <div className="app-tone-success-banner rounded-card border p-3 shadow-sm">
                <p className="app-tone-success-label mb-2 text-xs font-semibold uppercase tracking-wide">
                  {t('woDialog.postCloseReview')}
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="h-auto flex-col gap-1 py-2.5 shadow-sm"
                    onClick={() => openConfirmSubview('personnel-close')}
                  >
                    <span className="text-lg font-bold tabular-nums">{personnelCount}</span>
                    <span className="text-xs">{t('woDialog.personnelTime')}</span>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="h-auto flex-col gap-1 py-2.5 shadow-sm"
                    onClick={() => openConfirmSubview('close')}
                  >
                    <span className="text-lg font-bold tabular-nums">{supervisorCloseCount}</span>
                    <span className="text-xs">{t('woDialog.closeTime')}</span>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="h-auto flex-col gap-1 py-2.5 shadow-sm"
                    onClick={() => openConfirmSubview('images')}
                  >
                    <span className="text-lg font-bold tabular-nums">{imageCount}</span>
                    <span className="text-xs">{t('woDialog.closeImages')}</span>
                  </Button>
                  <Button type="button" size="sm" variant="outline" className="h-auto py-2.5 shadow-sm" asChild>
                    <Link
                      to="/confirmation"
                      state={{ wkorder: d.wkorder }}
                      onClick={() => onOpenChange(false)}
                    >
                      {t('woDialog.exportConfirmation')}
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          ) : null}

          {detailQ.isError && !d ? (
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
              <QueryLoadErrorState
                title={t('woDialog.loadFailed')}
                error={detailQ.error}
                action={{
                  label: t('common:actions.retry'),
                  onClick: () => void detailQ.refetch(),
                }}
              />
            </div>
          ) : (
            <Tabs
              key={orderId}
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as MainTab)}
              className="flex min-h-0 min-w-0 w-full max-w-full flex-1 flex-col"
            >
              <div className="z-10 shrink-0 border-b border-app/70 bg-[var(--app-surface)] px-4 py-2 sm:px-6">
                <SchedulingWoTabsList activeValue={activeTab}>
                {assignedLayout ? (
                  <>
                    <TabsTrigger value="task-list" className={woTabTriggerClass}>
                      {t('woDialog.tabTask')}
                    </TabsTrigger>
                    <TabsTrigger value="planning" className={woTabTriggerClass}>
                      {t('woDialog.tabPlanning')}
                    </TabsTrigger>
                    {canShowCloseWoTab ? (
                      <TabsTrigger value="confirm" className={woTabTriggerClass}>
                        {t('woDialog.tabCloseWo')}
                      </TabsTrigger>
                    ) : null}
                  </>
                ) : (
                  <>
                <TabsTrigger value="work-order" className={woTabTriggerClass}>
                  {t('woDialog.tabWorkOrder')}
                </TabsTrigger>
                <TabsTrigger value="task-list" className={woTabTriggerClass}>
                  {t('woDialog.tabTaskList')}
                </TabsTrigger>
                <TabsTrigger value="machine" className={woTabTriggerClass}>
                  {t('woDialog.tabMachine')}
                </TabsTrigger>
                {canPlan ? (
                  <TabsTrigger value="planning" className={woTabTriggerClass}>
                    {t('woDialog.tabPlanning')}
                  </TabsTrigger>
                ) : null}
                <TabsTrigger value="material" className={woTabTriggerClass}>
                  {t('woDialog.tabMaterial')}
                </TabsTrigger>
                <TabsTrigger value="confirm" className={cn(woTabTriggerClass, 'gap-2')}>
                  {t('woDialog.tabConfirm')}
                  {showPostCloseReview ? (
                    <Badge variant="secondary" className="h-5 px-2 text-badge">
                      {imageCount > 0
                        ? t('shared.imagesCount', { count: imageCount })
                        : t('shared.closedBadge')}
                    </Badge>
                  ) : null}
                </TabsTrigger>
                  </>
                )}
                </SchedulingWoTabsList>
              </div>

              <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 sm:px-6">
              <TabsContent value="work-order" className="mt-0">
                <WoModalTabFade>
                  {detailQ.isLoading && !d ? (
                    <WoModalTabSkeleton />
                  ) : d ? (
                    <WorkOrderSummaryPanel
                      order={d}
                      teamPending={teamMut.isPending}
                      canEditTeam={canEditTeam}
                      onTeamChange={(team) => teamMut.mutate(team)}
                      onMovePlan={d.canMovePlan ? () => setMoveOpen(true) : undefined}
                    />
                  ) : null}
                </WoModalTabFade>
              </TabsContent>

              <TabsContent value="task-list" className="mt-0">
                <WoModalTabFade>
                  {modalQ.isLoading && !modalQ.data ? (
                    <WoModalTabSkeleton />
                  ) : modalQ.isError ? (
                    <QueryLoadErrorState
                      title={t('woDialog.tabLoadFailed')}
                      error={modalQ.error}
                      action={{ label: t('common:actions.retry'), onClick: () => void modalQ.refetch() }}
                    />
                  ) : modalQ.data ? (
                    <div className="space-y-4">
                      {showPendingAckBanner ? (
                        <div className="app-tone-info-callout rounded-card border px-3 py-2 text-body-sm">
                          <p>{t('woDialog.closeWoLockedPendingAck')}</p>
                        </div>
                      ) : null}
                      {!assignedLayout && orderId ? (
                        <WorkOrderPmCommentSection
                          orderId={orderId}
                          wkorderLabel={d?.wkorder}
                          pmExecution={modalQ.data.pmExecution}
                          onSaved={() => void modalQ.refetch()}
                        />
                      ) : null}
                      <WorkOrderTaskListPanel
                        taskList={modalQ.data.taskList}
                        plannerLayout={assignedLayout}
                        woContext={
                          assignedLayout && d
                            ? {
                                wkorder: d.wkorder,
                                plannedDate: modalDate ? isoToDdMmYyyy(modalDate) : '',
                                status: d.status,
                                mntplan: modalQ.data.taskList.mntplan,
                              }
                            : null
                        }
                        canAssign={canPlan}
                        onGoPlanning={() => setActiveTab('planning')}
                        orderId={assignedLayout ? undefined : (orderId ?? undefined)}
                        pmExecution={assignedLayout ? undefined : modalQ.data.pmExecution}
                        showMeasurements={!assignedLayout}
                        onPmSaved={() => void modalQ.refetch()}
                      />
                      {assignedLayout && orderId ? (
                        <WorkOrderPmCommentSection
                          orderId={orderId}
                          wkorderLabel={d?.wkorder}
                          pmExecution={modalQ.data.pmExecution}
                          onSaved={() => void modalQ.refetch()}
                        />
                      ) : null}
                    </div>
                  ) : null}
                </WoModalTabFade>
              </TabsContent>

              <TabsContent value="machine" className="mt-0">
                <WoModalTabFade>
                  {modalQ.isLoading && !modalQ.data ? (
                    <WoModalTabSkeleton />
                  ) : modalQ.isError ? (
                    <QueryLoadErrorState
                      title={t('woDialog.tabLoadFailed')}
                      error={modalQ.error}
                      action={{ label: t('common:actions.retry'), onClick: () => void modalQ.refetch() }}
                    />
                  ) : modalQ.data ? (
                    <WorkOrderMachinePanel
                      machine={modalQ.data.machine}
                      referenceDate={modalQ.data.date}
                    />
                  ) : null}
                </WoModalTabFade>
              </TabsContent>

              <TabsContent value="planning" className="mt-0 space-y-3 text-body-sm">
                <WoModalTabFade>
                {detailQ.isLoading && !d ? (
                  <WoModalTabSkeleton />
                ) : null}
                {d && assignedLayout && !canPlan ? (
                  <p className="app-tone-warning-callout rounded-card border px-3 py-2 text-body-sm">
                    {t('woDialog.readOnlyPlanning')}
                  </p>
                ) : null}
                {canAckMyAssignment ? (
                  <div className="app-tone-info-callout rounded-card border px-3 py-2 text-body-sm">
                    <p>{t('woDialog.closeWoLockedPendingAck')}</p>
                    <Button
                      type="button"
                      size="sm"
                      className="mt-2"
                      disabled={ackMut.isPending}
                      onClick={() => ackMut.mutate()}
                    >
                      {ackMut.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                      ) : null}
                      {t('woDialog.acknowledgeAssignment')}
                    </Button>
                  </div>
                ) : null}
                {d && modalQ.data?.date ? (
                  <p className="app-tone-info-callout rounded-card border px-3 py-2 text-xs">
                    {t('woDialog.availableHour', { date: modalQ.data.date })}
                  </p>
                ) : null}
                {d && !canPlan && !assignedLayout ? (
                  <p className="text-app-muted">{t('woDialog.noPlanPermission')}</p>
                ) : d ? (
                  <>
                    <div className="rounded-card border border-app bg-[var(--app-surface)] p-3">
                      <p className="font-medium text-app">{t('woDialog.planningWork')}</p>
                      {planningEditable ? (
                        <div className="mt-3 space-y-2">
                          <Label htmlFor="plan-comment">{t('shared.comment')}</Label>
                          <Input
                            id="plan-comment"
                            value={planComment}
                            onChange={(e) => setPlanComment(e.target.value)}
                          />
                        </div>
                      ) : planComment.trim() ? (
                        <p className="mt-2 text-body-sm text-app-muted">
                          {t('shared.notesPrefix')} {planComment}
                        </p>
                      ) : null}
                    </div>

                    {d.movePlan ? (
                      <div className="app-tone-warning-callout rounded-card border p-3">
                        <p className="app-tone-warning-strong font-medium">{t('woDialog.planMoved')}</p>
                        <p>{t('woDialog.movedDate', { date: d.movePlan.movedDate })}</p>
                        <p>{t('woDialog.moveCount', { count: d.movePlan.moveCount })}</p>
                        <p>
                          {t('woDialog.moveReason', {
                            code: d.movePlan.reasonCode,
                            name: d.movePlan.reasonName,
                          })}
                        </p>
                        <p>{t('woDialog.movedByWc', { wkctr: d.movePlan.movedByWkctr })}</p>
                      </div>
                    ) : (
                      <p className="text-app-muted">{t('woDialog.noPlanMove')}</p>
                    )}

                    {d.canMovePlan && planningEditable ? (
                      <Button type="button" variant="outline" onClick={() => setMoveOpen(true)}>
                        {t('woDialog.movePlanButton')}
                      </Button>
                    ) : null}

                    {modalQ.isLoading && !modalQ.data ? (
                      <WoModalTabSkeleton />
                    ) : modalQ.isError ? (
                      <QueryLoadErrorState
                        title={t('woDialog.tabLoadFailed')}
                        error={modalQ.error}
                        action={{
                          label: t('common:actions.retry'),
                          onClick: () => void modalQ.refetch(),
                        }}
                      />
                    ) : modalQ.data ? (
                      <>
                        <div className="space-y-4">
                          <div className="app-tone-success-panel rounded-card border p-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="app-tone-success-strong font-medium">
                                  {t('woDialog.individualAssignees')}
                                </p>
                                {personAssignees.length > 0 ? (
                                  <Badge variant="outline" className="text-badge">
                                    {t('woDialog.ackSummary', {
                                      acked: personAssignees.filter(
                                        (a) => a.ackStatus === 'acknowledged',
                                      ).length,
                                      total: personAssignees.length,
                                    })}
                                  </Badge>
                                ) : null}
                              </div>
                              {modalQ.data.planning.assignees.length > 0 && planningEditable ? (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => deletePlanMut.mutate()}
                                  disabled={deletePlanMut.isPending}
                                >
                                  {t('shared.removeAll')}
                                </Button>
                              ) : null}
                            </div>
                            {personAssignees.length === 0 ? (
                              <p className="app-tone-success-label mt-2 text-body-sm">
                                {t('woDialog.noIndividualAssign')}
                              </p>
                            ) : (
                              <div className="app-tone-success-stat mt-3 overflow-auto rounded-button border app-surface-panel">
                                <table className="min-w-full text-body-sm">
                                  <thead className="app-tone-success-table-head">
                                    <tr>
                                      <th className="px-3 py-2 text-left">{t('woDialog.techCode')}</th>
                                      <th className="px-3 py-2 text-left">{t('woDialog.fullName')}</th>
                                      <th className="px-3 py-2 text-left">{t('woDialog.workGroup')}</th>
                                      <th className="px-3 py-2 text-left">{t('woDialog.position')}</th>
                                      <th className="px-3 py-2 text-left">{t('woDialog.ackStatus')}</th>
                                      {planningEditable ? (
                                        <th className="px-3 py-2 text-center">{t('shared.action')}</th>
                                      ) : null}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {personAssignees.map((a) => (
                                      <tr key={`${a.code}-${a.idplanw ?? ''}`} className="border-t">
                                        <td className="px-3 py-2 font-mono">{a.code}</td>
                                        <td className="px-3 py-2">{a.displayName}</td>
                                        <td className="px-3 py-2">{a.wkctrtype || '—'}</td>
                                        <td className="px-3 py-2">{a.position || '—'}</td>
                                        <td className="px-3 py-2">
                                          {a.ackStatus === 'acknowledged' ? (
                                            <Badge className="app-tone-success-fill text-badge">
                                              {t('woDialog.ackDone')}
                                            </Badge>
                                          ) : a.ackStatus === 'pending' ? (
                                            <Badge variant="outline" className="app-tone-warning-badge text-badge">
                                              {t('woDialog.ackPending')}
                                            </Badge>
                                          ) : (
                                            '—'
                                          )}
                                        </td>
                                        {planningEditable ? (
                                          <td className="px-3 py-2 text-center">
                                            <Button
                                              type="button"
                                              size="sm"
                                              variant="outline"
                                              onClick={() => removeAssigneeMut.mutate(a.code)}
                                              disabled={removeAssigneeMut.isPending}
                                            >
                                              {t('shared.delete')}
                                            </Button>
                                          </td>
                                        ) : null}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>

                          <div className="rounded-card border border-app bg-[var(--app-surface)] p-3">
                            <p className="font-medium text-app">{t('woDialog.groupAssignees')}</p>
                            {groupAssignees.length === 0 ? (
                              <p className="mt-2 text-caption">{t('woDialog.noGroupAssign')}</p>
                            ) : (
                              <div className="mt-3 overflow-auto rounded-button border border-app">
                                <table className="min-w-full text-body-sm">
                                  <thead className="bg-app-subtle text-app">
                                    <tr>
                                      <th className="px-3 py-2 text-left">{t('woDialog.techCode')}</th>
                                      <th className="px-3 py-2 text-left">{t('woDialog.fullName')}</th>
                                      {planningEditable ? (
                                        <th className="px-3 py-2 text-center">{t('shared.action')}</th>
                                      ) : null}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {groupAssignees.map((a) => (
                                      <tr key={`g-${a.code}-${a.idplanw ?? ''}`} className="border-t">
                                        <td className="px-3 py-2 font-mono">{a.code}</td>
                                        <td className="px-3 py-2">{a.displayName}</td>
                                        {planningEditable ? (
                                          <td className="px-3 py-2 text-center">
                                            <Button
                                              type="button"
                                              size="sm"
                                              variant="outline"
                                              onClick={() => removeAssigneeMut.mutate(a.code)}
                                              disabled={removeAssigneeMut.isPending}
                                            >
                                              {t('shared.delete')}
                                            </Button>
                                          </td>
                                        ) : null}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        </div>

                        {planningEditable ? (
                          <>
                        <PlanningTechnicianCards
                          workcenters={modalQ.data.planning.workcenters}
                          assignedCodes={personAssignees.map((a) => a.code)}
                          woTeam={d.team}
                          submitting={batchAssignMut.isPending}
                          onBatchAssign={async (codes) => {
                            const res = await batchAssignMut.mutateAsync(codes)
                            return {
                              assigned: res.assigned,
                              skipped: res.skipped,
                              notFound: res.notFound,
                            }
                          }}
                        />

                        <div className="rounded-card border border-app bg-[var(--app-surface)] p-3">
                          <p className="font-medium text-app">{t('woDialog.planningGroup')}</p>
                          <div className="mt-3 overflow-auto rounded-button border border-app">
                            <table className="min-w-full text-body-sm">
                              <thead className="bg-app-subtle text-app">
                                <tr>
                                  <th className="px-3 py-2 text-left">{t('woDialog.groupCode')}</th>
                                  <th className="px-3 py-2 text-left">{t('woDialog.groupName')}</th>
                                  <th className="px-3 py-2 text-center">{t('shared.action')}</th>
                                </tr>
                              </thead>
                              <tbody>
                                {modalQ.data.planning.groups.map((g) => (
                                  <tr key={g.wkctrgroup} className="border-t">
                                    <td className="px-3 py-2">{g.wkctrgroup}</td>
                                    <td className="px-3 py-2">{g.wkctrdescription}</td>
                                    <td className="px-3 py-2 text-center">
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() => assignPlanMut.mutate({ mode: 'G', code: g.wkctrgroup })}
                                        disabled={assignPlanMut.isPending}
                                      >
                                        {t('woDialog.add')}
                                      </Button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                          </>
                        ) : null}
                      </>
                    ) : null}
                  </>
                ) : null}
                </WoModalTabFade>
              </TabsContent>

              <TabsContent value="material" className="mt-0">
                <WoModalTabFade>
                  {modalQ.isLoading && !modalQ.data ? (
                    <WoModalTabSkeleton />
                  ) : modalQ.isError ? (
                    <QueryLoadErrorState
                      title={t('woDialog.tabLoadFailed')}
                      error={modalQ.error}
                      action={{ label: t('common:actions.retry'), onClick: () => void modalQ.refetch() }}
                    />
                  ) : modalQ.data ? (
                    <WorkOrderMaterialPanel materials={modalQ.data.materials} />
                  ) : null}
                </WoModalTabFade>
              </TabsContent>

              <TabsContent value="confirm" className="mt-0">
                <WoModalTabFade>
                {detailQ.isLoading && !d ? (
                  <WoModalTabSkeleton />
                ) : !d ? null : confirmTabPending ? (
                  <WoModalTabSkeleton />
                ) : assignedLayout ? (
                  <div className="space-y-4">
                    {!assignedCloseCanWrite ? (
                      <p className="app-tone-warning-callout rounded-card border px-3 py-2 text-body-sm">
                        {t('woDialog.readOnlyCloseWo')}
                      </p>
                    ) : null}
                    <PersonnelClosePanel
                      idiw37={idiw37}
                      enabled={open && typeof idiw37 === 'number'}
                      closeBlockedMessage={closeBlockedMessage}
                      canWrite={assignedCloseCanWrite}
                      onAppliedToSupervisor={applyPersonnelToSupervisorClose}
                      onChanged={() => {
                        void qc.invalidateQueries({ queryKey: ['work-order', orderId] })
                      }}
                    />
                    {typeof idiw37 === 'number' ? (
                      <ConfirmationImagesPanel
                        idiw37={idiw37}
                        enabled={open && activeTab === 'confirm'}
                        readOnly={!assignedCloseCanWrite}
                      />
                    ) : null}
                    <WorkOrderSupervisorCloseSection
                      readOnly={!assignedCloseCanWrite}
                      closeWkctr={closeWkctr}
                      onCloseWkctrChange={setCloseWkctr}
                      startDate={startDate}
                      onStartDateChange={setStartDate}
                      startTime={startTime}
                      onStartTimeChange={setStartTime}
                      endDate={endDate}
                      onEndDateChange={setEndDate}
                      endTime={endTime}
                      onEndTimeChange={setEndTime}
                      onSubmit={() => {
                        if (!canCloseWorkOrder) {
                          toast.error(
                            closeBlockedMessage ?? t('woDialog.closeBlockedDefault'),
                          )
                          return
                        }
                        addCloseMut.mutate()
                      }}
                      submitPending={addCloseMut.isPending}
                      submitDisabled={
                        !assignedCloseCanWrite ||
                        !startDate ||
                        !endDate ||
                        !startTime ||
                        !endTime ||
                        !canCloseWorkOrder
                      }
                      isLoading={closesQ.isLoading}
                      isError={closesQ.isError}
                      error={(closesQ.error as Error) ?? null}
                      items={closesQ.data?.items ?? []}
                      onDelete={(idclose) => delCloseMut.mutate(idclose)}
                      deletePending={delCloseMut.isPending}
                    />
                  </div>
                ) : (
                <WorkOrderConfirmPanel
                  confirmQc={d.confirmQc}
                  personnelCount={personnelCount}
                  supervisorCloseCount={supervisorCloseCount}
                  imageCount={imageCount}
                  confirmTab={confirmTab}
                  onConfirmTabChange={setConfirmTab}
                  qcPanel={
                    <ConfirmQcPanel
                      idiw37={idiw37}
                      wkorder={d.wkorder}
                      initialQc={d.confirmQc}
                      enabled={open && typeof idiw37 === 'number'}
                      onQcChange={() => {
                        void detailQ.refetch()
                      }}
                    />
                  }
                  personnelClosePanel={
                    <PersonnelClosePanel
                      idiw37={idiw37}
                      enabled={open && typeof idiw37 === 'number'}
                      closeBlockedMessage={closeBlockedMessage}
                      onAppliedToSupervisor={applyPersonnelToSupervisorClose}
                      onChanged={() => {
                        void qc.invalidateQueries({ queryKey: ['work-order', orderId] })
                      }}
                    />
                  }
                  supervisorClosePanel={
                    <WorkOrderSupervisorCloseSection
                      closeWkctr={closeWkctr}
                      onCloseWkctrChange={setCloseWkctr}
                      startDate={startDate}
                      onStartDateChange={setStartDate}
                      startTime={startTime}
                      onStartTimeChange={setStartTime}
                      endDate={endDate}
                      onEndDateChange={setEndDate}
                      endTime={endTime}
                      onEndTimeChange={setEndTime}
                      onSubmit={() => {
                        if (!canCloseWorkOrder) {
                          toast.error(
                            closeBlockedMessage ?? t('woDialog.closeBlockedDefault'),
                          )
                          setConfirmTab('comments')
                          return
                        }
                        addCloseMut.mutate()
                      }}
                      submitPending={addCloseMut.isPending}
                      submitDisabled={
                        !startDate ||
                        !endDate ||
                        !startTime ||
                        !endTime ||
                        !canCloseWorkOrder
                      }
                      isLoading={closesQ.isLoading}
                      isError={closesQ.isError}
                      error={(closesQ.error as Error) ?? null}
                      items={closesQ.data?.items ?? []}
                      onDelete={(idclose) => delCloseMut.mutate(idclose)}
                      deletePending={delCloseMut.isPending}
                    />
                  }
                  imagesPanel={
                    <ConfirmationImagesPanel
                      idiw37={idiw37}
                      enabled={loadConfirmAssets && confirmTab === 'images'}
                    />
                  }
                  commentsPanel={
                    <WorkOrderConfirmCommentsSection
                      newComment={newComment}
                      onNewCommentChange={setNewComment}
                      onAdd={() => addCommentMut.mutate()}
                      addPending={addCommentMut.isPending}
                      editingId={editingId}
                      editingText={editingText}
                      onEditingTextChange={setEditingText}
                      onStartEdit={(idcom, text) => {
                        setEditingId(idcom)
                        setEditingText(text)
                      }}
                      onCancelEdit={() => {
                        setEditingId(null)
                        setEditingText('')
                      }}
                      onSaveEdit={() => saveCommentMut.mutate()}
                      savePending={saveCommentMut.isPending}
                      isLoading={commentsQ.isLoading}
                      isError={commentsQ.isError}
                      error={(commentsQ.error as Error) ?? null}
                      items={commentsQ.data ?? []}
                      onDelete={(idcom) => delCommentMut.mutate(idcom)}
                      deletePending={delCommentMut.isPending}
                    />
                  }
                />
                )}
                </WoModalTabFade>
              </TabsContent>
              </div>
            </Tabs>
          )}
          </div>
        </DialogContent>
      </Dialog>

      {d && orderId ? (
        <MovePlanDialog
          open={moveOpen}
          onOpenChange={setMoveOpen}
          idiw37={d.id}
          wkorder={d.wkorder}
          defaultDate={d.movePlan?.movedDate || d.plannedDate}
          onSuccess={() => {
            void detailQ.refetch()
          }}
        />
      ) : null}
    </>
  )
}
