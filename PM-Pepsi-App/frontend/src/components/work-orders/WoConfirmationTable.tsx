import type { z } from 'zod'
import type { workOrderSearchRowSchema } from '@/api/schemas'
import { WoPmPhaseBadge } from '@/components/scheduling/WoPmPhaseBadge'
import { WktypeDisplay } from '@/components/scheduling/WktypeDisplay'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { TableSkeletonRows } from '@/components/ui/table-skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  tableStickyClass,
} from '@/components/ui/table'
import { APP_INTERACTIVE_MOTION, APP_INTERACTIVE_MOTION_SUBTLE } from '@/lib/app-motion'
import { normalizeTeamCode } from '@/lib/filter-detail-team-live'
import { postConfirmQcApprove, postConfirmQcReject } from '@/lib/api-public'
import { usePermission } from '@/lib/use-permission'
import {
  WORK_ORDER_TEAM_OPTIONS,
  type WorkOrderTeamField,
} from '@/lib/wo-team'
import { cn } from '@/lib/utils'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, ClipboardList, Loader2, X } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

type Row = z.infer<typeof workOrderSearchRowSchema>

function QcBadge({ row }: { row: Row }) {
  const { t } = useTranslation('workOrders')

  if (row.syst === 'TECO' || row.confirmQcStatus === 'approved') {
    return (
      <Badge className="app-tone-success-fill border-0 shadow-sm">
        {t('qc.badgeTecoApproved')}
      </Badge>
    )
  }
  if (row.confirmQcStatus === 'rejected') {
    return (
      <Badge variant="destructive" className="shadow-sm">
        {t('qc.badgeRejected')}
      </Badge>
    )
  }
  if (row.confirmQcStatus === 'pending') {
    return (
      <Badge
        variant="outline"
        className="app-tone-warning-badge shadow-sm"
      >
        {t('qc.badgePending')}
      </Badge>
    )
  }
  return <span className="text-xs text-app-muted">—</span>
}

function WoConfirmationQcActions({ row }: { row: Row }) {
  const { t } = useTranslation(['workOrders', 'common'])
  const qc = useQueryClient()
  const canReview = usePermission('confirmation.import')
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectNote, setRejectNote] = useState('')

  const invalidate = async () => {
    await qc.invalidateQueries({ queryKey: ['work-orders', 'search'] })
    await qc.invalidateQueries({ queryKey: ['personnel', 'me', 'dashboard'] })
    await qc.invalidateQueries({ queryKey: ['personnel', 'confirm'] })
    await qc.invalidateQueries({ queryKey: ['plan-calendar'] })
    await qc.invalidateQueries({ queryKey: ['calendar'] })
  }

  const approveMut = useMutation({
    mutationFn: () => postConfirmQcApprove(Number(row.id)),
    onSuccess: async () => {
      toast.success(t('toast.approveSuccess', { wkorder: row.wkorder }))
      await invalidate()
    },
    onError: (e: Error) => toast.error(e.message || t('toast.approveFailed')),
  })

  const rejectMut = useMutation({
    mutationFn: (note: string) => postConfirmQcReject(Number(row.id), note),
    onSuccess: async () => {
      setRejectOpen(false)
      setRejectNote('')
      toast.message(t('toast.rejectSent', { wkorder: row.wkorder }))
      await invalidate()
    },
    onError: (e: Error) => toast.error(e.message || t('toast.rejectFailed')),
  })

  const busy = approveMut.isPending || rejectMut.isPending
  const alreadyDone = row.syst === 'TECO' || row.confirmQcStatus === 'approved'
  const canAct = canReview && !alreadyDone && row.qcReadyForReview

  if (!canReview) {
    return <span className="text-xs text-app-muted">{t('qc.noReviewPermission')}</span>
  }

  if (alreadyDone) {
    return <QcBadge row={row} />
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          disabled={!canAct || busy}
          title={
            !row.qcReadyForReview ? t('qc.approveDisabledTitle') : undefined
          }
          className={cn(
            'app-tone-success-fill gap-1.5 rounded-lg shadow-sm',
            APP_INTERACTIVE_MOTION,
            !canAct && 'opacity-50',
          )}
          onClick={() => approveMut.mutate()}
        >
          {approveMut.isPending ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
          ) : (
            <Check className="size-3.5" aria-hidden />
          )}
          {t('qc.approve')}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!canAct || busy}
          className={cn(
            'app-tone-danger-outline-btn gap-1.5 rounded-lg shadow-sm',
            !canAct && 'opacity-50',
          )}
          onClick={() => setRejectOpen(true)}
        >
          {rejectMut.isPending ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
          ) : (
            <X className="size-3.5" aria-hidden />
          )}
          {t('qc.reject')}
        </Button>
      </div>
      <QcBadge row={row} />

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>{t('qc.rejectTitle')}</DialogTitle>
            <DialogDescription>{t('qc.rejectPrompt')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor={`qc-reject-note-${row.id}`}>{t('qc.rejectNoteLabel')}</Label>
            <Textarea
              id={`qc-reject-note-${row.id}`}
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder={t('qc.rejectNotePlaceholder')}
              rows={3}
              disabled={rejectMut.isPending}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setRejectOpen(false)}
              disabled={rejectMut.isPending}
            >
              {t('common:actions.cancel')}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={rejectMut.isPending}
              onClick={() => rejectMut.mutate(rejectNote)}
            >
              {rejectMut.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
              ) : null}
              {t('qc.reject')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export type WoTeamTableProps = {
  canEditTeam: boolean
  selectedIds: Set<string>
  pendingTeam: Record<string, WorkOrderTeamField>
  allPageSelected: boolean
  teamBusy: boolean
  onToggleSelectAll: () => void
  onToggleRow: (id: string) => void
  onPendingTeamChange: (id: string, team: WorkOrderTeamField) => void
}

type Props = {
  rows: Row[]
  isLoading: boolean
  onOpenRow: (id: string) => void
  team?: WoTeamTableProps
}

function teamColumnCount(team?: WoTeamTableProps) {
  return team?.canEditTeam ? 1 : 0
}

export function WoConfirmationTable({ rows, isLoading, onOpenRow, team }: Props) {
  const { t } = useTranslation('workOrders')
  const hasTeamCol = Boolean(team?.canEditTeam)
  const wkStickyCol = (hasTeamCol ? 2 : 1) as 1 | 2
  const colCount = 7 + teamColumnCount(team) + (hasTeamCol ? 1 : 0)

  if (isLoading) {
    return (
      <div
        className="app-table-shell -mx-1 max-h-[min(65vh,680px)] overflow-auto overflow-x-auto sm:mx-0"
        aria-busy="true"
        aria-label={t('table.loadingAria')}
      >
        <Table embedded stickyHeader zebra>
          <TableHeader>
            <TableRow>
              {team?.canEditTeam ? (
                <TableHead className={tableStickyClass(1)}>
                  <input
                    type="checkbox"
                    aria-label={t('table.selectAllAria')}
                    checked={team.allPageSelected}
                    onChange={team.onToggleSelectAll}
                    disabled={team.teamBusy}
                  />
                </TableHead>
              ) : null}
              <TableHead className={tableStickyClass(wkStickyCol)}>
                {t('table.colOrderNumber')}
              </TableHead>
              <TableHead>{t('table.colPmPhase')}</TableHead>
              <TableHead>{t('table.colMaintPlan')}</TableHead>
              <TableHead>{t('table.colTypeActivity')}</TableHead>
              <TableHead>{t('table.colEquipment')}</TableHead>
              <TableHead>{t('table.colFuncLoc')}</TableHead>
              {team?.canEditTeam ? <TableHead>{t('table.colTeam')}</TableHead> : null}
              <TableHead className="min-w-[12rem]">{t('table.colApproveReject')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableSkeletonRows rows={10} columns={colCount} narrowFirstColumn />
          </TableBody>
        </Table>
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-app/70 bg-app-subtle/30 px-6 py-14 text-center">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--app-accent)_10%,white)] text-[var(--app-accent)] ring-1 ring-[color-mix(in_srgb,var(--app-accent)_18%,transparent)]">
          <ClipboardList className="size-6" aria-hidden />
        </span>
        <p className="text-body-sm font-medium text-app">{t('table.emptyTitle')}</p>
        <p className="max-w-sm text-xs text-app-muted">{t('table.emptyDescription')}</p>
      </div>
    )
  }

  return (
    <div className="app-table-shell -mx-1 max-h-[min(65vh,680px)] overflow-auto overflow-x-auto sm:mx-0">
      <Table embedded stickyHeader zebra>
        <TableHeader>
          <TableRow>
            {team?.canEditTeam ? (
              <TableHead className={tableStickyClass(1)}>
                <input
                  type="checkbox"
                  aria-label={t('table.selectAllAria')}
                  checked={team.allPageSelected}
                  onChange={team.onToggleSelectAll}
                  disabled={team.teamBusy}
                />
              </TableHead>
            ) : null}
            <TableHead className={tableStickyClass(wkStickyCol)}>
              {t('table.colOrderNumber')}
            </TableHead>
            <TableHead>{t('table.colPmPhase')}</TableHead>
            <TableHead>{t('table.colMaintPlan')}</TableHead>
            <TableHead>{t('table.colTypeActivity')}</TableHead>
            <TableHead>{t('table.colEquipment')}</TableHead>
            <TableHead>{t('table.colFuncLoc')}</TableHead>
            {team?.canEditTeam ? <TableHead>{t('table.colTeam')}</TableHead> : null}
            <TableHead className="min-w-[12rem]">{t('table.colApproveReject')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const pending = team
              ? (team.pendingTeam[row.id] ?? normalizeTeamCode(row.team))
              : ''
            const saved = normalizeTeamCode(row.team)
            const isSelected = team?.selectedIds.has(row.id) ?? false
            const teamDirty = team?.canEditTeam ? pending !== saved : false

            return (
            <TableRow
              key={row.id}
              className={cn(
                'transition-colors hover:bg-[color-mix(in_srgb,var(--app-accent)_4%,transparent)]',
                isSelected && 'app-tone-info-row',
                teamDirty && !isSelected && 'bg-amber-50/40 dark:bg-amber-950/20',
              )}
            >
              {team?.canEditTeam ? (
                <TableCell className={tableStickyClass(1)}>
                  <input
                    type="checkbox"
                    aria-label={t('table.selectRowAria', { wkorder: row.wkorder })}
                    checked={isSelected}
                    onChange={() => team.onToggleRow(row.id)}
                    disabled={team.teamBusy}
                  />
                </TableCell>
              ) : null}
              <TableCell className={cn('text-right', tableStickyClass(wkStickyCol))}>
                <button
                  type="button"
                  title={row.operationshorttext}
                  onClick={() => onOpenRow(row.id)}
                  className={cn(
                    'rounded-lg px-2.5 py-1 text-xs font-semibold text-white shadow-sm ring-1 ring-black/10',
                    APP_INTERACTIVE_MOTION_SUBTLE,
                  )}
                  style={{ backgroundColor: row.wkstcolor }}
                >
                  {row.wkorder}
                </button>
              </TableCell>
              <TableCell>
                <WoPmPhaseBadge phase={row.pmPhase} syst={row.syst} showSyst />
              </TableCell>
              <TableCell className="text-xs tabular-nums">{row.mntplan}</TableCell>
              <TableCell>
                <WktypeDisplay code={row.wktype} mat={row.mat} />
              </TableCell>
              <TableCell className="max-w-[12rem] text-xs leading-snug">{row.equdescrip}</TableCell>
              <TableCell className="max-w-[12rem] text-xs leading-snug">{row.funcdescrip}</TableCell>
              {team?.canEditTeam ? (
                <TableCell>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {WORK_ORDER_TEAM_OPTIONS.map((code) => (
                      <label key={code} className="flex cursor-pointer items-center gap-1">
                        <input
                          type="radio"
                          name={`team-${row.id}`}
                          value={code}
                          checked={pending === code}
                          onChange={() => team.onPendingTeamChange(row.id, code)}
                          disabled={team.teamBusy}
                          className="accent-[var(--app-accent)]"
                        />
                        {code}
                      </label>
                    ))}
                    <label className="flex cursor-pointer items-center gap-1 text-app-muted">
                      <input
                        type="radio"
                        name={`team-${row.id}`}
                        value=""
                        checked={pending === ''}
                        onChange={() => team.onPendingTeamChange(row.id, '')}
                        disabled={team.teamBusy}
                        className="accent-[var(--app-accent)]"
                      />
                      {t('table.teamNone')}
                    </label>
                  </div>
                </TableCell>
              ) : null}
              <TableCell>
                <WoConfirmationQcActions row={row} />
              </TableCell>
            </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
