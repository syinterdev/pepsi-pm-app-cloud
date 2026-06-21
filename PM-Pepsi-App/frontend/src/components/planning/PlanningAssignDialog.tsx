import { PlanningMultiAssign } from '@/components/scheduling/PlanningMultiAssign'
import { arrayLength } from '@/lib/coerce-array'
import { PlanningQuickAssign } from '@/components/scheduling/PlanningQuickAssign'
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
import { QueryLoadErrorState } from '@/components/ui/query-load-error'
import { SpinnerBlock } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import {
  fetchWorkOrderModalDetail,
  postPlanningAssign,
  postWorkOrderPlanningBatch,
} from '@/lib/api-public'
import { formatPlanningHourValue } from '@/lib/planning-available-hours'
import { planningAssignModeMeta } from '@/lib/planning-i18n'
import type { PlanningAssignMode } from '@/lib/planning-assign-mode'
import { usePermission } from '@/lib/use-permission'
import { cn } from '@/lib/utils'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

export type PlanningAssignTarget = {
  idiw37: number
  wkorder: string
  planDate?: string
  workHours?: number
  importWkctr?: string
}

type Props = {
  target: PlanningAssignTarget | null
  onClose: () => void
  myCode?: string
  /** Fires when at least one assignee was added — for planning list row highlight */
  onAssignSuccess?: (idiw37: number) => void
}

type DialogPhase = 'form' | 'success'

type SuccessResult = {
  kind: 'assigned' | 'already'
  message: string
  count?: number
}

const SELECT_CLASS =
  'flex h-9 w-full rounded-button border border-app bg-[var(--app-surface)] px-3 py-1 text-body-sm text-app focus-app-ring focus-visible:outline-none disabled:opacity-50'

export function PlanningAssignDialog({
  target,
  onClose,
  myCode = '',
  onAssignSuccess,
}: Props) {
  const { t } = useTranslation('planning')
  const { t: tc } = useTranslation('common')
  const canAssign = usePermission('planning.assign')
  const qc = useQueryClient()
  const [phase, setPhase] = useState<DialogPhase>('form')
  const [successResult, setSuccessResult] = useState<SuccessResult | null>(null)
  const [mode, setMode] = useState<PlanningAssignMode>('P')
  const [groupCode, setGroupCode] = useState('')
  const [comment, setComment] = useState('')

  const modalQ = useQuery({
    queryKey: ['work-orders', 'modal-detail', target?.idiw37, target?.planDate],
    queryFn: () =>
      fetchWorkOrderModalDetail(String(target!.idiw37), target!.planDate || undefined),
    enabled: !!target,
  })

  useEffect(() => {
    if (!target) {
      setPhase('form')
      setSuccessResult(null)
      return
    }
    setPhase('form')
    setSuccessResult(null)
    setMode('P')
    setGroupCode('')
    setComment('')
  }, [target?.idiw37])

  const invalidatePlanningQueries = async (idiw37: number) => {
    await qc.invalidateQueries({ queryKey: ['planning'] })
    await qc.invalidateQueries({ queryKey: ['plan-calendar'] })
    await qc.invalidateQueries({ queryKey: ['calendar'] })
    await qc.invalidateQueries({ queryKey: ['work-orders'] })
    await qc.invalidateQueries({ queryKey: ['work-orders', 'modal-detail', idiw37] })
  }

  const showAssignSuccess = (
    result: { assigned: string[] },
    assignMode: PlanningAssignMode | 'batch',
  ) => {
    if (result.assigned.length === 0) {
      setSuccessResult({
        kind: 'already',
        message: t('assignDialog.alreadyAssigned'),
      })
      setPhase('success')
      return
    }
    const message =
      assignMode === 'G'
        ? t('assignDialog.successAutoCount', { count: result.assigned.length })
        : assignMode === 'batch'
          ? t('assignDialog.successManualCount', { count: result.assigned.length })
          : t('assignDialog.successManual')
    setSuccessResult({
      kind: 'assigned',
      message,
      count: result.assigned.length,
    })
    setPhase('success')
  }

  const assignMut = useMutation({
    mutationFn: (input: { idiw37: number; mode: PlanningAssignMode; code: string; comment?: string }) =>
      postPlanningAssign(input),
    onSuccess: async (data, variables) => {
      await invalidatePlanningQueries(variables.idiw37)
      showAssignSuccess(data, variables.mode)
      if (arrayLength(data.assigned) > 0) {
        onAssignSuccess?.(variables.idiw37)
      }
    },
    onError: (err) => toast.error((err as Error).message || t('assignDialog.assignFailed')),
  })

  const batchAssignMut = useMutation({
    mutationFn: (input: { idiw37: number; codes: string[]; comment?: string }) =>
      postWorkOrderPlanningBatch(String(input.idiw37), {
        wkctrs: input.codes,
        comment: input.comment,
      }),
    onSuccess: async (data, variables) => {
      await invalidatePlanningQueries(variables.idiw37)
      showAssignSuccess(data, 'batch')
      if (arrayLength(data.assigned) > 0) {
        onAssignSuccess?.(variables.idiw37)
      }
    },
    onError: (err) => toast.error((err as Error).message || t('assignDialog.assignFailed')),
  })

  const submitting = assignMut.isPending || batchAssignMut.isPending
  const planning = modalQ.data?.planning
  const groups = planning?.groups ?? []
  const workcenters = planning?.workcenters ?? []
  const assignedCodes = planning?.assignees.map((a) => a.code) ?? []
  const workHours = target?.workHours ?? 0
  const importWkctr = (target?.importWkctr ?? '').trim()

  const onSubmitAuto = () => {
    if (!target) return
    const code = groupCode.trim()
    if (!code) {
      toast.error(t('assignDialog.selectGroupError'))
      return
    }
    assignMut.mutate({
      idiw37: target.idiw37,
      mode: 'G',
      code,
      comment: comment.trim() || undefined,
    })
  }

  const SuccessIcon = successResult?.kind === 'assigned' ? CheckCircle2 : AlertCircle

  return (
    <Dialog
      open={!!target}
      onOpenChange={(open) => {
        if (!open && !submitting) onClose()
      }}
    >
      <DialogContent size="lg" className="flex max-h-[min(92dvh,900px)] flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 space-y-1 border-b border-app/60 px-6 pb-4 pt-6 text-left">
          <DialogTitle>
            {phase === 'success'
              ? t('assignDialog.successTitle')
              : t('assignDialog.title', { wo: target?.wkorder })}
          </DialogTitle>
          <DialogDescription>
            {phase === 'success'
              ? successResult?.message
              : t('assignDialog.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-6 py-4">
          {phase === 'success' && successResult ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <div
                className={cn(
                  'flex size-14 items-center justify-center rounded-full border',
                  successResult.kind === 'assigned' ? 'app-tone-info' : 'border-app bg-app-subtle',
                )}
                aria-hidden
              >
                <SuccessIcon
                  className={cn(
                    'size-7',
                    successResult.kind === 'assigned' ? 'text-[var(--app-accent)]' : 'text-app-muted',
                  )}
                  strokeWidth={2}
                />
              </div>
              <p className="max-w-sm text-body font-medium text-app">{successResult.message}</p>
              {successResult.count != null && successResult.count > 0 ? (
                <p className="text-caption text-app-muted">
                  {t('assignDialog.successCountHint', { count: successResult.count })}
                </p>
              ) : null}
            </div>
          ) : modalQ.isLoading ? (
            <SpinnerBlock label={t('assignDialog.loading')} />
          ) : modalQ.isError ? (
            <QueryLoadErrorState
              title={t('assignDialog.loadFailed')}
              error={modalQ.error}
              action={{ label: tc('actions.retry'), onClick: () => void modalQ.refetch() }}
            />
          ) : !canAssign ? (
            <p className="text-body-sm text-app-muted">{t('row.assignNoPermission')}</p>
          ) : (
            <div className="relative space-y-4">
              {submitting ? (
                <div
                  className="absolute inset-0 z-10 flex items-center justify-center rounded-card bg-[color-mix(in_srgb,var(--app-surface)_88%,transparent)] backdrop-blur-[2px]"
                  aria-busy
                  aria-live="polite"
                >
                  <SpinnerBlock label={t('assignDialog.submitting')} />
                </div>
              ) : null}

              <div className="grid gap-2 rounded-card border border-app/60 bg-app-subtle/40 px-3 py-2 text-xs sm:grid-cols-2">
                <p>
                  <span className="font-medium text-app">{t('assignDialog.woHours')}</span>{' '}
                  {workHours > 0
                    ? `${formatPlanningHourValue(workHours)} ${t('assignDialog.hoursUnit')}`
                    : '—'}
                </p>
                {importWkctr ? (
                  <p>
                    <span className="font-medium text-app">{t('assignDialog.importWkctr')}</span>{' '}
                    <span className="font-mono">{importWkctr}</span>
                  </p>
                ) : null}
              </div>

              {modalQ.data?.date ? (
                <p className="app-tone-info rounded-card border px-3 py-2 text-xs">
                  {t('assignDialog.availableHour', { date: modalQ.data.date })}
                </p>
              ) : null}

              <div className="grid gap-2">
                <Label>{t('assignDialog.modeLabel')}</Label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  {(['P', 'G'] as const).map((m) => {
                    const meta = planningAssignModeMeta(t, m)
                    const selected = mode === m
                    return (
                      <label
                        key={m}
                        className={cn(
                          'flex flex-1 cursor-pointer gap-2 rounded-card border px-3 py-2 text-sm transition-colors',
                          selected
                            ? 'app-tone-info ring-1 ring-[color-mix(in_srgb,var(--app-accent)_28%,transparent)]'
                            : 'border-app/60 bg-[var(--app-surface)] hover:bg-app-subtle/60',
                        )}
                      >
                        <input
                          type="radio"
                          name="planning-assign-mode"
                          value={m}
                          checked={selected}
                          onChange={() => setMode(m)}
                          disabled={submitting}
                          className="mt-1"
                        />
                        <span>
                          <span className="block font-medium">{meta.label}</span>
                          <span className="text-xs text-app-muted">{meta.description}</span>
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>

              {mode === 'P' ? (
                <div className="space-y-3">
                  <PlanningMultiAssign
                    workcenters={workcenters}
                    assignedCodes={assignedCodes}
                    comment={comment}
                    onCommentChange={setComment}
                    submitting={batchAssignMut.isPending}
                    onAssign={async (codes) => {
                      if (!target) {
                        return { assigned: [], skipped: [], notFound: codes }
                      }
                      const res = await batchAssignMut.mutateAsync({
                        idiw37: target.idiw37,
                        codes,
                        comment: comment.trim() || undefined,
                      })
                      return {
                        assigned: res.assigned,
                        skipped: res.skipped,
                        notFound: res.notFound,
                      }
                    }}
                  />
                  <PlanningQuickAssign
                    workcenters={workcenters}
                    assignedCodes={assignedCodes}
                    submitting={assignMut.isPending}
                    assigningCode={
                      assignMut.isPending && assignMut.variables?.mode === 'P'
                        ? assignMut.variables.code
                        : null
                    }
                    onAssign={(code) => {
                      if (!target) return
                      assignMut.mutate({
                        idiw37: target.idiw37,
                        mode: 'P',
                        code,
                        comment: comment.trim() || undefined,
                      })
                    }}
                  />
                </div>
              ) : (
                <div className="space-y-2 rounded-card border border-app bg-[var(--app-surface)] p-3">
                  <Label htmlFor="planning-group">{t('assignDialog.groupLabel')}</Label>
                  <select
                    id="planning-group"
                    value={groupCode}
                    onChange={(e) => setGroupCode(e.target.value)}
                    disabled={submitting}
                    className={SELECT_CLASS}
                  >
                    <option value="">{t('assignDialog.groupPlaceholder')}</option>
                    {groups.map((g) => (
                      <option key={g.wkctrgroup} value={g.wkctrgroup}>
                        {g.wkctrgroup}
                        {g.wkctrdescription ? ` — ${g.wkctrdescription}` : ''}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-app-muted">{t('assignDialog.autoHint')}</p>
                </div>
              )}

              {mode === 'G' ? (
                <div className="grid gap-2">
                  <Label htmlFor="planning-assign-comment">{t('assignDialog.commentLabel')}</Label>
                  <Textarea
                    id="planning-assign-comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={2}
                    disabled={submitting}
                    placeholder={t('assignDialog.commentPlaceholder')}
                  />
                </div>
              ) : null}
            </div>
          )}
        </div>

        <DialogFooter className="shrink-0 border-t border-app/60 px-6 py-4">
          {phase === 'success' ? (
            <Button type="button" onClick={onClose}>
              {t('assignDialog.successDone')}
            </Button>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
                {tc('actions.cancel')}
              </Button>
              {mode === 'G' ? (
                <Button type="button" onClick={onSubmitAuto} disabled={submitting || !groupCode.trim()}>
                  {submitting ? (
                    <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                  ) : null}
                  {t('assignDialog.assignAuto')}
                </Button>
              ) : myCode && !assignedCodes.includes(myCode) ? (
                <Button
                  type="button"
                  variant="secondary"
                  disabled={submitting || !target}
                  onClick={() => {
                    if (!target) return
                    assignMut.mutate({
                      idiw37: target.idiw37,
                      mode: 'P',
                      code: myCode,
                      comment: comment.trim() || undefined,
                    })
                  }}
                >
                  {submitting ? (
                    <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                  ) : null}
                  {t('assignDialog.assignSelf', { code: myCode })}
                </Button>
              ) : null}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
