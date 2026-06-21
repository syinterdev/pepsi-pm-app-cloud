/**
 * Personnel Confirmation Dashboard
 *
 * - Admin only — ดู % การปิดงานของช่างต่อ WO (อ่าน `view_countpersonelclose`)
 * - Filter: text search + status (ทั้งหมด/ยังไม่เริ่ม/กำลังทำ/เสร็จ)
 * - แต่ละแถวมีปุ่ม Confirm ที่เปิด `WorkOrderDetailDialog` ด้วย `initialTab="confirm"`
 *
 */
import { AppCard } from '@/components/layout/AppCard'
import { hintsFromT } from '@/lib/i18n-hints'
import { AppPageSection, AppPageSectionCard, AppPageShell } from '@/components/layout/AppPageShell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { MassConfirmBar, MASS_CONFIRM_MAX } from '@/components/confirmation/MassConfirmBar'
import { MassConfirmSelectionSummary } from '@/components/confirmation/MassConfirmSelectionSummary'
import { WorkOrderDetailDialog } from '@/components/scheduling/WorkOrderDetailDialog'
import { WktypeDisplay } from '@/components/scheduling/WktypeDisplay'
import { getStoredAuthUser } from '@/features/auth/login-api'
import { fetchPersonnelConfirm } from '@/lib/api-public'
import { useAnyPermission } from '@/lib/use-permission'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import {
  AlertCircle,
  CheckCircle2,
  CircleDashed,
  ClipboardList,
  Filter,
  RefreshCcw,
  Search,
  Users,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

type StatusFilter = 'all' | 'not_started' | 'in_progress' | 'done' | 'qc_pending'

const STATUS_TAB_IDS: StatusFilter[] = [
  'all',
  'qc_pending',
  'not_started',
  'in_progress',
  'done',
]

const STATUS_TAB_LABEL_KEYS: Record<StatusFilter, string> = {
  all: 'confirm.tabs.all',
  qc_pending: 'confirm.tabs.qcPending',
  not_started: 'confirm.tabs.notStarted',
  in_progress: 'confirm.tabs.inProgress',
  done: 'confirm.tabs.done',
}

function QcStatusBadge({ status }: { status: string | null }) {
  const { t } = useTranslation('personnel')
  if (!status) return null
  const map: Record<string, string> = {
    pending: 'app-tone-pill-warning-ring',
    approved: 'app-tone-pill-success-ring',
    rejected: 'app-tone-pill-danger-ring',
  }
  const label =
    status === 'pending'
      ? t('confirm.qc.pending')
      : status === 'approved'
        ? t('confirm.qc.approved')
        : t('confirm.qc.rejected')
  return (
    <span
      className={`inline-flex rounded px-2 py-1 text-badge font-medium ring-1 ${map[status] ?? ''}`}
    >
      {label}
    </span>
  )
}

function ProgressBar({ percent }: { percent: number }) {
  const safe = Math.max(0, Math.min(100, Math.round(percent || 0)))
  const color =
    safe >= 100
      ? 'app-tone-success-fill'
      : safe >= 60
        ? 'app-tone-info-progress'
        : safe > 0
          ? 'app-tone-warning-fill'
          : 'bg-[var(--app-border)]'
  return (
    <div
      className="h-5 w-full overflow-hidden rounded bg-app-muted ring-1 ring-app"
      title={`${safe}%`}
    >
      <div
        className={`flex h-full items-center justify-center text-badge font-medium text-white transition-all ${color}`}
        style={{ width: `${safe}%`, minWidth: safe > 0 ? '1.5rem' : 0 }}
      >
        {safe > 0 ? `${safe}%` : ''}
      </div>
    </div>
  )
}

function SystBadge({ syst }: { syst: string | null }) {
  if (!syst) return <span className="text-xs text-app-muted">—</span>
  const map: Record<string, string> = {
    CRTD: 'app-tone-pill-warning-ring',
    REL: 'app-tone-pill-info-ring',
    TECO: 'app-tone-pill-success-ring',
    COMP: 'bg-app-muted text-app ring-app',
  }
  const cls = map[syst] ?? 'bg-app-muted text-app ring-app'
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-1 text-badge font-medium ring-1 ${cls}`}
    >
      {syst}
    </span>
  )
}

export function PersonnelConfirmPage() {
  const { t } = useTranslation('personnel')
  const { t: tc } = useTranslation('common')
  const navigate = useNavigate()
  const authUser = getStoredAuthUser()
  const canConfirmRead =
    useAnyPermission(['personnel.confirm.read', 'personnel.write']) || authUser?.userst === 'A'

  useEffect(() => {
    if (!canConfirmRead) {
      toast.error(t('confirm.accessDenied'))
      navigate('/personnel', { replace: true })
    }
  }, [canConfirmRead, navigate])

  const [qInput, setQInput] = useState('')
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [detailId, setDetailId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set())

  const listQ = useQuery({
    queryKey: ['personnel', 'confirm', 'list', q, status],
    queryFn: () =>
      fetchPersonnelConfirm({
        q: q || undefined,
        status,
        limit: 500,
      }),
    enabled: canConfirmRead,
    staleTime: 15_000,
    placeholderData: keepPreviousData,
  })

  const items = useMemo(() => listQ.data?.items ?? [], [listQ.data])
  const summary = listQ.data?.summary
  const errorMessage =
    listQ.error instanceof Error ? listQ.error.message : null

  const onSubmitSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setQ(qInput.trim())
    setSelectedIds(new Set())
  }

  const pageIds = useMemo(() => items.map((it) => it.idiw37), [items])
  const allPageSelected =
    pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id))

  const toggleSelectAllPage = () => {
    if (allPageSelected) {
      setSelectedIds(new Set())
      return
    }
    const next = new Set(pageIds.slice(0, MASS_CONFIRM_MAX))
    if (pageIds.length > MASS_CONFIRM_MAX) {
      toast.message(t('confirm.massSelectMax', { max: MASS_CONFIRM_MAX }))
    }
    setSelectedIds(next)
  }

  const toggleSelectRow = (idiw37: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(idiw37)) {
        next.delete(idiw37)
        return next
      }
      if (next.size >= MASS_CONFIRM_MAX) {
        toast.error(t('confirm.massSelectMax', { max: MASS_CONFIRM_MAX }))
        return prev
      }
      next.add(idiw37)
      return next
    })
  }

  const hints = hintsFromT(t, 'confirm.hints')

  if (!canConfirmRead) {
    return (
      <AppPageShell title={t('confirm.title')} description={t('confirm.description')}>
        <EmptyState
          icon={AlertCircle}
          title={t('confirm.accessDenied')}
          description={
            <>
              {tc('rbac.requiresPermission')}{' '}
              <code className="text-xs">personnel.confirm.read</code>
            </>
          }
        />
      </AppPageShell>
    )
  }

  return (
    <AppPageShell
      title={t('confirm.title')}
      description={t('confirm.description')}
      hints={hints}
      headerActions={
        <>
          <Badge variant="secondary" className="text-xs">
            {t('confirm.badgeAdminQc')}
          </Badge>
          <Button asChild variant="outline" size="sm">
            <Link to="/personnel">{t('confirm.nav.dashboard')}</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/admin/users">{t('confirm.nav.manageUsers')}</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/confirmation">{t('confirm.nav.exportConfirmation')}</Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void listQ.refetch()}
            disabled={listQ.isFetching}
          >
            <RefreshCcw className="mr-2 size-3.5" aria-hidden />
            {t('confirm.refresh')}
          </Button>
        </>
      }
    >
      <AppPageSection index={0}>
        <AppPageSectionCard
          icon={ClipboardList}
          title={t('confirm.statsSectionTitle')}
          description={t('confirm.statsSectionDesc')}
        >
          <div className="grid gap-3 sm:grid-cols-4">
            <SummaryCard
              label={t('confirm.summary.totalOpen')}
              value={summary?.totalOpen ?? 0}
              icon={ClipboardList}
              tone="neutral"
              isLoading={listQ.isLoading}
            />
            <SummaryCard
              label={t('confirm.summary.fullyClosed')}
              value={summary?.fullyClosed ?? 0}
              icon={CheckCircle2}
              tone="success"
              isLoading={listQ.isLoading}
            />
            <SummaryCard
              label={t('confirm.summary.inProgress')}
              value={summary?.inProgress ?? 0}
              icon={Users}
              tone="info"
              isLoading={listQ.isLoading}
            />
            <SummaryCard
              label={t('confirm.summary.notStarted')}
              value={summary?.notStarted ?? 0}
              icon={CircleDashed}
              tone="warning"
              isLoading={listQ.isLoading}
            />
          </div>
        </AppPageSectionCard>
      </AppPageSection>

      <AppPageSection index={1}>
        <AppPageSectionCard
          icon={Filter}
          title={t('confirm.filtersSectionTitle')}
          description={t('confirm.filtersSectionDesc')}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <form onSubmit={onSubmitSearch} className="flex flex-1 items-center gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-app-muted" />
                <Input
                  placeholder={t('confirm.search.placeholder')}
                  className="pl-8"
                  value={qInput}
                  onChange={(e) => setQInput(e.target.value)}
                />
              </div>
              <Button type="submit" variant="default" size="sm">
                {tc('actions.search')}
              </Button>
              {q ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setQInput('')
                    setQ('')
                  }}
                >
                  {t('confirm.search.clear')}
                </Button>
              ) : null}
            </form>
            <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
              {STATUS_TAB_IDS.map((tabId) => (
                <Button
                  key={tabId}
                  type="button"
                  size="sm"
                  variant={status === tabId ? 'default' : 'outline'}
                  onClick={() => setStatus(tabId)}
                >
                  {t(STATUS_TAB_LABEL_KEYS[tabId])}
                  {summary
                    ? ` (${
                        tabId === 'all'
                          ? summary.totalOpen
                          : tabId === 'not_started'
                            ? summary.notStarted
                            : tabId === 'in_progress'
                              ? summary.inProgress
                              : tabId === 'qc_pending'
                                ? (summary as { qcPending?: number }).qcPending ?? 0
                                : summary.fullyClosed
                      })`
                    : ''}
                </Button>
              ))}
            </div>
          </div>
        </AppPageSectionCard>
      </AppPageSection>

      <AppPageSection index={2}>
        <MassConfirmSelectionSummary selectedIds={[...selectedIds]} items={items} />

        <MassConfirmBar
          selectedIds={[...selectedIds]}
          onClearSelection={() => setSelectedIds(new Set())}
          onComplete={() => void listQ.refetch()}
        />

        <AppPageSectionCard
          icon={Users}
          title={t('confirm.tableSectionTitle')}
          description={t('confirm.tableSectionDesc')}
          bodyClassName="!p-0"
        >
          {listQ.isLoading && !listQ.data ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded" />
              ))}
            </div>
          ) : errorMessage ? (
            <div className="p-4">
              <EmptyState
                icon={AlertCircle}
                title={t('confirm.table.loadFailed')}
                description={errorMessage}
                action={{ label: tc('actions.retry'), onClick: () => void listQ.refetch() }}
              />
            </div>
          ) : (
            <div className="app-table-shell overflow-x-auto">
            <Table embedded stickyHeader zebra>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <input
                      type="checkbox"
                      aria-label={t('confirm.table.selectAllPage')}
                      checked={allPageSelected}
                      ref={(el) => {
                        if (el) {
                          el.indeterminate =
                            selectedIds.size > 0 && !allPageSelected
                        }
                      }}
                      onChange={toggleSelectAllPage}
                    />
                  </TableHead>
                  <TableHead className="w-[15%]">{t('confirm.table.closePct')}</TableHead>
                  <TableHead>{t('confirm.table.workOrder')}</TableHead>
                  <TableHead>{t('confirm.table.maintPlan')}</TableHead>
                  <TableHead>{t('confirm.table.type')}</TableHead>
                  <TableHead>{t('confirm.table.equipment')}</TableHead>
                  <TableHead>{t('confirm.table.plan')}</TableHead>
                  <TableHead>{t('confirm.table.newPlan')}</TableHead>
                  <TableHead className="text-right">{t('confirm.table.action')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="p-0">
                      <EmptyState
                        className="border-0 bg-transparent py-10"
                        title={t('confirm.table.emptyTitle')}
                        description={t('confirm.table.emptyHint')}
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((it) => (
                    <TableRow
                      key={it.idiw37}
                      className={selectedIds.has(it.idiw37) ? 'app-tone-success-row-selected' : undefined}
                    >
                      <TableCell>
                        <input
                          type="checkbox"
                          aria-label={t('confirm.table.selectRow', { workOrder: it.wkorder })}
                          checked={selectedIds.has(it.idiw37)}
                          onChange={() => toggleSelectRow(it.idiw37)}
                        />
                      </TableCell>
                      <TableCell className="align-middle">
                        <div className="space-y-1">
                          <ProgressBar percent={it.percentClose} />
                          <div className="text-caption tabular-nums">
                            {t('confirm.table.peopleCount', {
                              closed: it.closedCount,
                              planned: it.plannedCount,
                            })}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell title={it.shortText ?? ''}>
                        <button
                          type="button"
                          className={
                            it.wkstcolor
                              ? 'rounded px-2 py-1 text-xs font-medium ring-1 transition hover:brightness-95'
                              : 'rounded px-2 py-1 text-xs font-medium ring-1 ring-[var(--app-border)] bg-[var(--app-surface-muted)] text-[var(--app-text)] transition hover:brightness-95'
                          }
                          style={
                            it.wkstcolor
                              ? {
                                  backgroundColor: it.wkstcolor,
                                  color: 'var(--app-text)',
                                  borderColor: it.wkstcolor,
                                }
                              : undefined
                          }
                          onClick={() => setDetailId(String(it.idiw37))}
                        >
                          {it.wkorder}
                        </button>
                        <div className="mt-1 flex flex-wrap gap-1">
                          <SystBadge syst={it.syst} />
                          <QcStatusBadge status={it.qcStatus} />
                        </div>
                      </TableCell>
                      <TableCell
                        className="max-w-[10rem] truncate text-xs"
                        title={it.mntplan ?? ''}
                      >
                        {it.mntplan ?? '—'}
                      </TableCell>
                      <TableCell className="text-xs">
                        {it.wktype ? <WktypeDisplay code={it.wktype} /> : '—'}
                      </TableCell>
                      <TableCell
                        className="max-w-[16rem] truncate text-xs"
                        title={it.equdescrip ?? ''}
                      >
                        {it.equdescrip ?? '—'}
                      </TableCell>
                      <TableCell className="tabular-nums text-xs">
                        {it.bscStart ?? '—'}
                      </TableCell>
                      <TableCell className="tabular-nums text-xs">
                        {it.cday ?? '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant={it.hasConfirm ? 'default' : 'outline'}
                          onClick={() => setDetailId(String(it.idiw37))}
                        >
                          {it.hasConfirm ? t('confirm.table.viewConfirm') : t('confirm.table.confirm')}
                        </Button>
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

      <WorkOrderDetailDialog
        orderId={detailId}
        initialTab="confirm"
        onOpenChange={(open) => {
          if (!open) {
            setDetailId(null)
            listQ.refetch()
          }
        }}
      />
    </AppPageShell>
  )
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  tone,
  isLoading,
}: {
  label: string
  value: number
  icon: typeof Users
  tone: 'neutral' | 'success' | 'info' | 'warning'
  isLoading: boolean
}) {
  const toneMap: Record<typeof tone, string> = {
    neutral: 'bg-app-muted text-app',
    success: 'app-tone-pill-success',
    info: 'app-tone-pill-info',
    warning: 'app-tone-pill-warning',
  }
  return (
    <AppCard pad="compact">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-wide text-app-muted">
            {label}
          </div>
          <div className="mt-1 text-2xl font-semibold tabular-nums text-app">
            {isLoading ? <Skeleton className="h-7 w-12" /> : value}
          </div>
        </div>
        <div className={`rounded-card p-2 ${toneMap[tone]}`}>
          <Icon className="size-5" aria-hidden />
        </div>
      </div>
    </AppCard>
  )
}
