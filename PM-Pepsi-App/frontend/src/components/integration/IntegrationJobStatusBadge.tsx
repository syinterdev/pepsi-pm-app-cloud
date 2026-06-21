import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'

type JobStatus = 'success' | 'failed' | 'running' | 'pending' | string

function statusClass(status: JobStatus): string {
  if (status === 'success') return 'app-tone-success-fill border-0'
  if (status === 'failed') return 'border-transparent bg-destructive text-destructive-foreground'
  if (status === 'running') return 'app-tone-info-progress border-0'
  return 'app-tone-warning-badge'
}

export function IntegrationJobStatusBadge({ status }: { status: JobStatus }) {
  const { t } = useTranslation('integration')
  const label = t(`jobs.status.${status}`, { defaultValue: status })
  return <Badge className={cn('shadow-sm', statusClass(status))}>{label}</Badge>
}
