import { ConfirmQcStatusBadge } from '@/components/confirmation/ConfirmQcStatusBadge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import type { workOrderConfirmQcSchema } from '@/api/schemas'
import { getStoredAuthUser } from '@/features/auth/login-api'
import {
  fetchConfirmQc,
  postConfirmQcApprove,
  postConfirmQcReject,
} from '@/lib/api-public'
import { usePermission } from '@/lib/use-permission'
import { useAppLocale } from '@/providers/I18nProvider'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, ClipboardList, XCircle } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { z } from 'zod'

type ConfirmQc = z.infer<typeof workOrderConfirmQcSchema>

export type ConfirmQcPanelProps = {
  idiw37: number | null
  wkorder?: string
  /** จาก work order detail — ลด round-trip */
  initialQc?: ConfirmQc | null
  enabled?: boolean
  onQcChange?: () => void
}

function isPlannerReviewer(userst: string | undefined): boolean {
  return (userst ?? '').trim().toUpperCase() === 'U'
}

export function ConfirmQcPanel({
  idiw37,
  wkorder: _wkorder,
  initialQc,
  enabled = true,
  onQcChange,
}: ConfirmQcPanelProps) {
  const { t } = useTranslation('confirmation')
  const { locale } = useAppLocale()
  const qc = useQueryClient()
  const authUser = getStoredAuthUser()
  const isAdmin = (authUser?.userst ?? '').trim() === 'A'
  const hasReviewPerm = usePermission('confirmation.import')
  const canReview = isPlannerReviewer(authUser?.userst) && hasReviewPerm
  const [rejectNote, setRejectNote] = useState('')

  const qcQ = useQuery({
    queryKey: ['confirmation', 'qc', idiw37],
    queryFn: () => fetchConfirmQc(idiw37!),
    enabled: enabled && typeof idiw37 === 'number' && !initialQc,
    initialData: initialQc ?? undefined,
  })

  const data = initialQc ?? qcQ.data

  const invalidate = async () => {
    if (typeof idiw37 === 'number') {
      await qc.invalidateQueries({ queryKey: ['confirmation', 'qc', idiw37] })
    }
    await qc.invalidateQueries({ queryKey: ['work-order'] })
    await qc.invalidateQueries({ queryKey: ['confirmation', 'qc', 'pending'] })
    await qc.invalidateQueries({ queryKey: ['confirmation', 'preview'] })
    await qc.invalidateQueries({ queryKey: ['confirmation', 'export'] })
    await qc.invalidateQueries({ queryKey: ['personnel', 'admin', 'confirm'] })
    await qc.invalidateQueries({ queryKey: ['dashboard'] })
    onQcChange?.()
  }

  const approveMut = useMutation({
    mutationFn: () => postConfirmQcApprove(idiw37!),
    onSuccess: async () => {
      setRejectNote('')
      await invalidate()
    },
  })

  const rejectMut = useMutation({
    mutationFn: () => postConfirmQcReject(idiw37!, rejectNote),
    onSuccess: async () => {
      setRejectNote('')
      await invalidate()
    },
  })

  if (!enabled || typeof idiw37 !== 'number') return null

  if (qcQ.isLoading && !data) {
    return <Skeleton className="h-24 w-full" />
  }

  if (!data) return null

  const showActions = canReview && data.status === 'pending' && data.readyForReview

  return (
    <section className="overflow-hidden rounded-card border border-app/60 bg-[var(--app-surface)] p-4 shadow-[var(--app-shadow-card)]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="flex items-center gap-2 text-body-sm font-semibold text-app">
          <span className="flex size-8 items-center justify-center rounded-lg bg-[color-mix(in_srgb,var(--status-info)_14%,transparent)] text-[var(--status-info)]">
            <ClipboardList className="size-4" aria-hidden />
          </span>
          {t('qc.plannerTitle')}
        </h4>
        <ConfirmQcStatusBadge status={data.status} label={data.statusLabel} />
      </div>

      <ul className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
        <li className="rounded-button border border-app/50 bg-app-subtle/40 px-3 py-2 text-app">
          {t('qc.images')}: <strong>{data.imageCount}</strong> (
          {t('qc.imagesDetail', { after: data.imageAfter })})
        </li>
        <li className="rounded-button border border-app/50 bg-app-subtle/40 px-3 py-2 text-app">
          {t('qc.closeCount')}: <strong>{data.closeCount}</strong>
        </li>
        <li className="rounded-button border border-app/50 bg-app-subtle/40 px-3 py-2 text-app">
          {t('qc.worktimeCount')}: <strong>{data.worktimeCount}</strong>
        </li>
        {data.reviewedAt ? (
          <li className="rounded-button border border-app/50 bg-app-subtle/40 px-3 py-2 text-app sm:col-span-2">
            {t('qc.reviewedBy')} <strong>{data.reviewedBy ?? '—'}</strong> ·{' '}
            {new Date(data.reviewedAt).toLocaleString(locale)}
          </li>
        ) : null}
        {data.note ? (
          <li className="app-tone-danger-callout rounded-button border px-3 py-2 sm:col-span-2">
            {t('qc.note')}: {data.note}
          </li>
        ) : null}
      </ul>

      {isAdmin && data.status === 'pending' && data.readyForReview ? (
        <p className="mt-4 rounded-lg border border-app/50 bg-app-subtle/50 px-3 py-2 text-body-sm text-app-muted">
          {t('qc.adminViewOnly')}
        </p>
      ) : null}

      {showActions ? (
        <div className="mt-4 space-y-4 border-t border-app/50 pt-4">
          <div className="space-y-1.5">
            <Label htmlFor="qc-reject-note" className="text-xs font-medium">
              {t('qc.rejectReasonLabel')}
            </Label>
            <Textarea
              id="qc-reject-note"
              rows={3}
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder={t('qc.rejectReasonPlaceholder')}
              maxLength={500}
            />
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              size="sm"
              variant="destructive"
              className="gap-1.5 sm:min-w-[8.5rem]"
              disabled={approveMut.isPending || rejectMut.isPending}
              onClick={() => rejectMut.mutate()}
            >
              <XCircle className="size-4" aria-hidden />
              {rejectMut.isPending ? t('qc.rejecting') : t('qc.reject')}
            </Button>
            <Button
              type="button"
              size="sm"
              className="app-tone-success-fill gap-1.5 border-0 shadow-sm sm:min-w-[8.5rem]"
              disabled={approveMut.isPending || rejectMut.isPending}
              onClick={() => approveMut.mutate()}
            >
              <CheckCircle2 className="size-4" aria-hidden />
              {approveMut.isPending ? t('qc.approving') : t('qc.approve')}
            </Button>
          </div>
        </div>
      ) : null}

      {(approveMut.error || rejectMut.error) && (
        <p className="app-tone-danger-text mt-3 text-body-sm">
          {(approveMut.error ?? rejectMut.error)?.message}
        </p>
      )}
    </section>
  )
}
