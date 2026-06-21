import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

/** label บน · control · error/hint ใต้ field */
export function FormField({
  label,
  htmlFor,
  error,
  hint,
  required,
  children,
  className,
}: {
  label: ReactNode
  htmlFor?: string
  error?: ReactNode
  hint?: ReactNode
  required?: boolean
  children: ReactNode
  className?: string
}) {
  const hintId = hint && htmlFor ? `${htmlFor}-hint` : undefined
  const errorId = error && htmlFor ? `${htmlFor}-error` : undefined
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label htmlFor={htmlFor}>
        {label}
        {required ? <span className="text-[var(--app-primary)]"> *</span> : null}
      </Label>
      <div
        aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
        aria-invalid={error ? true : undefined}
      >
        {children}
      </div>
      {error ? (
        <p id={errorId} className="text-caption text-form-error" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-caption text-app-muted">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
