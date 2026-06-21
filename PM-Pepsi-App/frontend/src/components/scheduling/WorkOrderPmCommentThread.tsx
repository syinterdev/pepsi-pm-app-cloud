import type { WoPmExecution } from '@/api/schemas'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { putWorkOrderPmNote } from '@/lib/api-public'
import { cn } from '@/lib/utils'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

type Props = {
  orderId: string
  pmExecution: WoPmExecution
  onSaved: () => void
  /** card = WO modal · inline = SAP print form */
  variant?: 'card' | 'inline'
  textareaClassName?: string
}

export function WorkOrderPmCommentThread({
  orderId,
  pmExecution,
  onSaved,
  variant = 'card',
  textareaClassName,
}: Props) {
  const { t, i18n } = useTranslation(['scheduling', 'common'])
  const dateLocale = i18n.language.startsWith('th') ? 'th-TH' : 'en-US'
  const [draft, setDraft] = useState('')
  const canEdit = pmExecution.canEdit
  const inline = variant === 'inline'

  const saveMut = useMutation({
    mutationFn: () => putWorkOrderPmNote(orderId, { note: draft }),
    onSuccess: () => {
      toast.success(t('pmComment.saved'))
      setDraft('')
      onSaved()
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const notes = pmExecution.notes ?? []

  return (
    <div className={cn('space-y-3', inline && 'mt-0')}>
      {notes.length > 0 ? (
        <ol className="space-y-2" aria-label={t('pmComment.historyAria')}>
          {notes.map((entry) => (
            <li
              key={entry.identry}
              className={cn(
                'rounded-button border px-3 py-2.5 text-body-sm',
                inline
                  ? 'border-dashed border-neutral-400 bg-white'
                  : 'border-app/70 bg-[var(--app-surface)] shadow-sm',
              )}
            >
              <p className="whitespace-pre-wrap text-app">{entry.note}</p>
              <p className="mt-1 text-[10px] text-app-muted">
                {new Date(entry.createdAt).toLocaleString(dateLocale)}
                {entry.wkctr ? ` · ${entry.wkctr}` : ''}
              </p>
            </li>
          ))}
        </ol>
      ) : (
        <p className={cn('text-xs', inline ? 'text-neutral-600' : 'text-app-muted')}>
          {t('pmComment.empty')}
        </p>
      )}

      {canEdit ? (
        <div className="space-y-2">
          <Label htmlFor={`pm-wo-comment-${orderId}`}>{t('pmComment.addLabel')}</Label>
          <Textarea
            id={`pm-wo-comment-${orderId}`}
            rows={inline ? 3 : 4}
            className={cn(
              'resize-y',
              inline && 'sap-wo-print__input sap-wo-print__input--left min-h-[3.5rem]',
              textareaClassName,
            )}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t('pmComment.placeholder')}
          />
          <Button
            type="button"
            size="sm"
            disabled={saveMut.isPending || !draft.trim()}
            onClick={() => saveMut.mutate()}
          >
            {saveMut.isPending ? t('shared.saving') : t('pmComment.addComment')}
          </Button>
        </div>
      ) : notes.length === 0 ? (
        <p className="text-xs text-app-muted">{t('pmComment.readOnlyEmpty')}</p>
      ) : null}
    </div>
  )
}
