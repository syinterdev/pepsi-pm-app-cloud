import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { AuthFeedbackKind, AuthFeedbackState } from '@/lib/auth-api-error'
import { authFeedbackConfirmLabel } from '@/lib/auth-api-error'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import {
  AlertCircle,
  Ban,
  CheckCircle2,
  Lock,
  ShieldAlert,
  Wrench,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const ICONS: Record<AuthFeedbackKind, LucideIcon> = {
  success: CheckCircle2,
  invalid: ShieldAlert,
  lockout: Lock,
  blocked: Ban,
  maintenance: Wrench,
  rate_limit: AlertCircle,
  generic: AlertCircle,
}

type LoginFeedbackDialogProps = {
  open: boolean
  state: AuthFeedbackState | null
  onClose: () => void
  onConfirm: () => void
}

export function LoginFeedbackDialog({
  open,
  state,
  onClose,
  onConfirm,
}: LoginFeedbackDialogProps) {
  if (!state) return null

  const Icon = ICONS[state.kind]
  const confirmLabel = authFeedbackConfirmLabel(state.kind)

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        size="sm"
        className={cn('login-feedback-dialog', `login-feedback-dialog--${state.kind}`)}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => {
          if (state.kind === 'success') e.preventDefault()
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col gap-4"
        >
          <div className="login-feedback-dialog__icon-wrap" aria-hidden>
            <Icon className="login-feedback-dialog__icon size-7" strokeWidth={2} />
          </div>

          <DialogHeader className="space-y-2 text-center sm:text-center">
            <DialogTitle className="text-heading-page text-app">{state.title}</DialogTitle>
            <DialogDescription className="text-body text-app-muted">
              {state.message}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="sm:justify-center">
            <Button
              type="button"
              className="login-feedback-dialog__btn min-w-[10rem]"
              onClick={onConfirm}
            >
              {confirmLabel}
            </Button>
          </DialogFooter>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}
