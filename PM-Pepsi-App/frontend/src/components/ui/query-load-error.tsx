import { EmptyState } from '@/components/ui/empty-state'
import { queryErrorMessage, useQueryLoadErrorToast } from '@/lib/query-load-error'
import type { LucideIcon } from 'lucide-react'
import { AlertCircle } from 'lucide-react'
import type { ReactNode } from 'react'

export type QueryLoadErrorStateProps = {
  title: string
  error: unknown
  /** Inline body — defaults to API error message */
  description?: ReactNode
  action?: { label: string; onClick: () => void }
  icon?: LucideIcon
  className?: string
  /** Show matching sonner toast (default true) */
  toast?: boolean
}

/** Inline load failure + sonner toast — ไม่เงียบเมื่อ query พัง */
export function QueryLoadErrorState({
  title,
  error,
  description,
  action,
  icon: Icon = AlertCircle,
  className,
  toast = true,
}: QueryLoadErrorStateProps) {
  const detail = queryErrorMessage(error)

  useQueryLoadErrorToast(
    { isError: true, error, data: undefined },
    title,
    { enabled: toast, onlyWithoutData: false },
  )

  const inlineDesc = description ?? (detail || undefined)

  return (
    <EmptyState
      icon={Icon}
      title={title}
      description={inlineDesc}
      action={action}
      className={className}
    />
  )
}
