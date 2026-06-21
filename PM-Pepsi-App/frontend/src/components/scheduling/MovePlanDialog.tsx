import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
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
import { fetchMovePlanReasons, postMovePlan } from '@/lib/api-public'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

type MovePlanDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  idiw37: string
  wkorder?: string
  defaultDate?: string
  moveReasonRequired?: boolean
  onSuccess?: () => void
}

const SELECT_CLASS =
  'flex h-9 w-full rounded-button border border-app bg-[var(--app-surface)] px-3 py-1 text-body-sm text-app focus-app-ring focus-visible:outline-none disabled:opacity-50'

export function MovePlanDialog({
  open,
  onOpenChange,
  idiw37,
  wkorder,
  defaultDate,
  moveReasonRequired = true,
  onSuccess,
}: MovePlanDialogProps) {
  const { t } = useTranslation(['scheduling', 'common'])
  const qc = useQueryClient()
  const [targetDate, setTargetDate] = useState(defaultDate ?? '')
  const [reasonCode, setReasonCode] = useState('')
  const [comment, setComment] = useState('')

  useEffect(() => {
    if (open) {
      setTargetDate(defaultDate ?? '')
      setReasonCode('')
      setComment('')
    }
  }, [open, defaultDate])

  const reasonsQ = useQuery({
    queryKey: ['scheduling', 'move-reasons'],
    queryFn: fetchMovePlanReasons,
    enabled: open,
    staleTime: 600_000,
  })

  const moveM = useMutation({
    mutationFn: () =>
      postMovePlan({
        idiw37,
        targetDate,
        reasonCode: reasonCode.trim() || undefined,
        comment: comment.trim() || undefined,
      }),
    onSuccess: (data) => {
      toast.success(data.message)
      void qc.invalidateQueries({ queryKey: ['calendar'] })
      void qc.invalidateQueries({ queryKey: ['backlog'] })
      void qc.invalidateQueries({ queryKey: ['work-order', idiw37] })
      onSuccess?.()
      onOpenChange(false)
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })

  const canSave =
    Boolean(targetDate) &&
    (!moveReasonRequired || Boolean(reasonCode.trim())) &&
    !moveM.isPending

  return (
    <Dialog open={open} onOpenChange={(next) => !moveM.isPending && onOpenChange(next)}>
      <DialogContent size="sm" className="flex flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 space-y-1 border-b border-app/60 px-6 pb-4 pt-6 text-left">
          <DialogTitle>{t('movePlan.title')}</DialogTitle>
          <DialogDescription>
            {moveReasonRequired ? t('movePlan.requiredHint') : t('movePlan.optionalHint')}
            {wkorder ? t('movePlan.woSuffix', { wkorder }) : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-6 py-4">
          <div className="space-y-1">
            <Label>{t('movePlan.targetDate')}</Label>
            <DatePicker value={targetDate} onChange={setTargetDate} className="w-full" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="move-reason">
              {moveReasonRequired ? t('movePlan.reasonRequired') : t('movePlan.reasonOptional')}
            </Label>
            <select
              id="move-reason"
              className={SELECT_CLASS}
              value={reasonCode}
              onChange={(e) => setReasonCode(e.target.value)}
              disabled={reasonsQ.isLoading || moveM.isPending}
            >
              <option value="">{t('movePlan.selectReason')}</option>
              {(reasonsQ.data ?? []).map((r) => (
                <option key={r.code} value={r.code}>
                  {r.code} = {r.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="move-comment">{t('movePlan.comment')}</Label>
            <Textarea
              id="move-comment"
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t('movePlan.commentPlaceholder')}
              className="resize-y"
              disabled={moveM.isPending}
            />
          </div>
        </div>

        <DialogFooter className="shrink-0 border-t border-app/60 px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={moveM.isPending}
          >
            {t('common:actions.cancel')}
          </Button>
          <Button type="button" disabled={!canSave} onClick={() => moveM.mutate()}>
            {moveM.isPending ? (
              <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
            ) : null}
            {t('common:actions.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
