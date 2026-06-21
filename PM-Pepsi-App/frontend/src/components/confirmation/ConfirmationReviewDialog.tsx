import { ConfirmationImagesPanel } from '@/components/confirmation/ConfirmationImagesPanel'
import { ConfirmQcPanel } from '@/components/confirmation/ConfirmQcPanel'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ClipboardCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export type ConfirmationReviewTarget = {
  idiw37: number
  wkorder: string
}

export type ConfirmationReviewDialogProps = {
  target: ConfirmationReviewTarget | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onQcChange?: () => void
}

export function ConfirmationReviewDialog({
  target,
  open,
  onOpenChange,
  onQcChange,
}: ConfirmationReviewDialogProps) {
  const { t } = useTranslation('confirmation')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size="full"
        className="flex max-h-[min(100dvh,52rem)] flex-col gap-0 overflow-hidden p-0 sm:rounded-2xl"
      >
        <DialogHeader className="shrink-0 border-b border-app/60 bg-[color-mix(in_srgb,var(--app-surface)_92%,var(--status-info)_8%)] px-5 py-4 text-left sm:px-6">
          <div className="flex items-start gap-3 pr-8">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--status-info)_18%,transparent)] text-[var(--status-info)]">
              <ClipboardCheck className="size-5" aria-hidden />
            </span>
            <div className="min-w-0 space-y-1">
              <DialogTitle className="text-lg font-semibold tracking-tight">
                {target
                  ? t('review.sheetTitle', { wkorder: target.wkorder })
                  : t('review.sheetTitleFallback')}
              </DialogTitle>
              <DialogDescription className="text-sm text-app-muted">
                {t('review.dialogSubtitle')}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 py-5 sm:px-6 lg:flex-row lg:gap-6">
          {target ? (
            <>
              <div className="min-w-0 flex-1 lg:max-w-md">
                <ConfirmQcPanel
                  idiw37={target.idiw37}
                  wkorder={target.wkorder}
                  enabled={open}
                  onQcChange={() => {
                    onQcChange?.()
                  }}
                />
              </div>
              <div className="min-w-0 flex-[1.2]">
                <ConfirmationImagesPanel
                  idiw37={target.idiw37}
                  enabled={open}
                  readOnly
                />
              </div>
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}

/** @deprecated Use ConfirmationReviewDialog */
export const ConfirmationReviewSheet = ConfirmationReviewDialog
export type ConfirmationReviewSheetProps = ConfirmationReviewDialogProps
