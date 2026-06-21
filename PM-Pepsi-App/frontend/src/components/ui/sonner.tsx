import { useTheme } from '@/lib/theme-provider'
import { AlertTriangle, CircleCheck, CircleX, Info, Loader2 } from 'lucide-react'
import { Toaster as Sonner, type ToasterProps } from 'sonner'

const toastClassNames = {
  toast: 'app-sonner-toast',
  title: 'text-body-sm font-medium text-app',
  description: 'text-caption text-app-muted',
  actionButton:
    'rounded-button bg-[var(--app-accent)] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90',
  cancelButton:
    'rounded-button border border-app bg-[var(--app-surface)] px-3 py-1.5 text-xs font-medium text-app hover:bg-app-subtle',
  closeButton:
    'border border-app bg-[var(--app-surface)] text-app-muted hover:bg-app-subtle hover:text-app',
} as const

/** Sonner — brand icons + CSS tokens (ไม่ใช้ richColors) */
export function AppToaster({ ...props }: ToasterProps) {
  const { resolvedTheme } = useTheme()

  return (
    <Sonner
      theme={resolvedTheme}
      richColors={false}
      position="top-right"
      closeButton
      duration={4000}
      className="app-sonner-toaster"
      toastOptions={{
        classNames: toastClassNames,
      }}
      icons={{
        success: (
          <CircleCheck className="size-[1.125rem] shrink-0 text-[var(--sys-green-light)]" aria-hidden />
        ),
        error: <CircleX className="size-[1.125rem] shrink-0 text-[var(--sys-red-light)]" aria-hidden />,
        warning: (
          <AlertTriangle className="size-[1.125rem] shrink-0 text-[var(--sys-orange-light)]" aria-hidden />
        ),
        info: <Info className="size-[1.125rem] shrink-0 text-[var(--sys-blue-light)]" aria-hidden />,
        loading: (
          <Loader2
            className="size-[1.125rem] shrink-0 animate-spin text-[var(--app-accent)] motion-reduce:animate-none"
            aria-hidden
          />
        ),
      }}
      {...props}
    />
  )
}

export { toastClassNames }
