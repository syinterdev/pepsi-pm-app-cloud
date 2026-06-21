import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

type ConfirmPhraseDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  /** User must type this exactly (case-sensitive). */
  phrase: string
  phraseLabel?: string
  confirmLabel?: string
  loading?: boolean
  onConfirm: () => void
  /** Strong destructive styling for backup / delete / restore flows */
  tone?: 'default' | 'danger'
}

/** Destructive confirm — user types a phrase (e.g. RESTORE, RESET, role code). */
export function ConfirmPhraseDialog({
  open,
  onOpenChange,
  title,
  description,
  phrase,
  phraseLabel,
  confirmLabel,
  loading = false,
  onConfirm,
  tone = 'default',
}: ConfirmPhraseDialogProps) {
  const { t } = useTranslation('common')
  const [typed, setTyped] = useState('')
  const ready = typed === phrase
  const isDanger = tone === 'danger'
  const showMismatch = typed.length > 0 && !ready
  const resolvedConfirmLabel = confirmLabel ?? t('confirmPhrase.confirm')
  const resolvedPhraseLabel = phraseLabel ?? t('confirmPhrase.phraseLabel', { phrase })

  useEffect(() => {
    if (!open) setTyped('')
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size="sm"
        className={cn(isDanger && 'confirm-phrase-dialog--danger')}
      >
        <DialogHeader className="text-left">
          {isDanger ? (
            <div className="flex items-start gap-3">
              <span className="confirm-phrase-dialog__icon-wrap size-10" aria-hidden>
                <AlertTriangle className="size-5" />
              </span>
              <div className="min-w-0 space-y-1">
                <DialogTitle className="confirm-phrase-dialog__title">{title}</DialogTitle>
                {description ? (
                  <DialogDescription className="confirm-phrase-dialog__description">
                    {description}
                  </DialogDescription>
                ) : null}
              </div>
            </div>
          ) : (
            <>
              <DialogTitle>{title}</DialogTitle>
              {description ? <DialogDescription>{description}</DialogDescription> : null}
            </>
          )}
        </DialogHeader>

        <div className="space-y-2">
          <Label
            htmlFor="confirm-phrase"
            className={cn(isDanger && 'confirm-phrase-dialog__title')}
          >
            {resolvedPhraseLabel}
          </Label>
          {isDanger ? (
            <p
              className={cn(
                'confirm-phrase-dialog__phrase-box rounded-button border px-3 py-2 font-mono text-sm font-semibold tracking-wide',
              )}
              aria-live="polite"
            >
              {phrase}
            </p>
          ) : null}
          <Input
            id="confirm-phrase"
            value={typed}
            autoComplete="off"
            spellCheck={false}
            autoFocus
            placeholder={isDanger ? t('confirmPhrase.placeholder') : undefined}
            className={cn(
              isDanger &&
                'confirm-phrase-dialog__input--danger border-[color-mix(in_srgb,var(--sys-red-light)_32%,var(--app-border))] bg-[var(--app-surface)]',
            )}
            aria-invalid={showMismatch}
            onChange={(e) => setTyped(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && ready && !loading) onConfirm()
            }}
          />
          {showMismatch ? (
            <p className="text-xs text-form-error" role="status">
              {t('confirmPhrase.mismatch')}
            </p>
          ) : ready ? (
            <p className="confirm-phrase-dialog__matched text-xs" role="status">
              {t('confirmPhrase.matched')}
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            {t('actions.cancel')}
          </Button>
          <Button
            type="button"
            variant={isDanger ? 'destructive' : 'default'}
            disabled={!ready || loading}
            onClick={onConfirm}
          >
            {loading ? <Loader2 className="mr-2 size-4 animate-spin" aria-hidden /> : null}
            {resolvedConfirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
