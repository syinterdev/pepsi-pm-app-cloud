import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'

export type ImportReviewAction = 'error' | 'updated' | 'inserted' | 'skipped' | string

export function importReviewActionBadgeClass(action: ImportReviewAction): string {
  if (action === 'error') {
    return 'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/90'
  }
  if (action === 'updated') return 'border-transparent app-tone-info-progress hover:opacity-90'
  if (action === 'inserted') return 'border-transparent app-tone-success-fill hover:opacity-90'
  return ''
}

export function ImportReviewActionBadge({ action }: { action: ImportReviewAction }) {
  const { t } = useTranslation('integration')
  const label = t(`importAction.${action}`, { defaultValue: action })
  return <Badge className={cn(importReviewActionBadgeClass(action))}>{label}</Badge>
}
