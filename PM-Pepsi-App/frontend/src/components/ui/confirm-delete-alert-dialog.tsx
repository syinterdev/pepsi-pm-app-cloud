import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

type ConfirmDeleteAlertDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  confirmLabel?: string
  loading?: boolean
  onConfirm: () => void
}

export function ConfirmDeleteAlertDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  loading = false,
  onConfirm,
}: ConfirmDeleteAlertDialogProps) {
  const { t } = useTranslation('common')

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description ? (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          ) : null}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>{t('actions.cancel')}</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={loading}
            onClick={(e) => {
              e.preventDefault()
              onConfirm()
            }}
          >
            {loading ? <Loader2 className="mr-2 size-4 animate-spin" aria-hidden /> : null}
            {confirmLabel ?? t('confirmDelete.confirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
