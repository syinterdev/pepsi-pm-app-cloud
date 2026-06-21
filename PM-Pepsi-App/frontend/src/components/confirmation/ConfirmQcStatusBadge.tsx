import { Badge } from '@/components/ui/badge'
import type { workOrderConfirmQcSchema } from '@/api/schemas'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'
import type { z } from 'zod'

type ConfirmQcStatus = z.infer<typeof workOrderConfirmQcSchema>['status']

export function ConfirmQcStatusBadge({
  status,
  label,
  className,
}: {
  status: ConfirmQcStatus
  label: string
  className?: string
}) {
  const { t } = useTranslation('confirmation')

  if (status === 'approved') {
    return (
      <Badge className={cn('app-tone-success-fill border-0', className)} role="status">
        {label || t('qc.statusApproved')}
      </Badge>
    )
  }
  if (status === 'pending') {
    return (
      <Badge variant="outline" className={cn('app-tone-warning-badge', className)} role="status">
        {label || t('qc.statusPending')}
      </Badge>
    )
  }
  if (status === 'rejected') {
    return (
      <Badge variant="destructive" className={className} role="status">
        {label || t('qc.statusRejected')}
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className={className} role="status">
      {label}
    </Badge>
  )
}
