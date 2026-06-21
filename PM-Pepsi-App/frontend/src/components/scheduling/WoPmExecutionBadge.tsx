import { Badge } from '@/components/ui/badge'
import { SchedulingSection } from '@/components/scheduling/SchedulingPageLayout'
import { pmExecutionMeta } from '@/lib/scheduling-i18n'
import {
  resolvePmExecutionStatus,
  type PmExecutionStatus,
} from '@/lib/wo-pm-execution'
import { cn } from '@/lib/utils'
import { Layers3 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

type WoPmExecutionBadgeProps = {
  status?: PmExecutionStatus
  syst?: string
  percentClose?: number | null
  hasConfirm?: number | boolean | null
  confirmQcStatus?: string | null
  className?: string
}

export function WoPmExecutionBadge({
  status: statusProp,
  syst,
  percentClose,
  hasConfirm,
  confirmQcStatus,
  className,
}: WoPmExecutionBadgeProps) {
  const { t } = useTranslation('scheduling')
  const status =
    statusProp ??
    resolvePmExecutionStatus({ syst, percentClose, hasConfirm, confirmQcStatus })
  const meta = pmExecutionMeta(t, status)

  return (
    <Badge
      variant="outline"
      title={meta.title}
      aria-label={t('pmExecution.ariaLabel', { label: meta.label })}
      className={cn('font-semibold ring-1', meta.className, className)}
    >
      {meta.label}
    </Badge>
  )
}

export function WoPmExecutionLegend({
  className,
  collapsible = false,
  defaultOpen = true,
}: {
  className?: string
  collapsible?: boolean
  defaultOpen?: boolean
}) {
  const { t } = useTranslation('scheduling')

  const legendContent = (
    <div
      className={cn(
        'flex flex-wrap items-center gap-2 text-xs text-app',
        !collapsible &&
          'rounded-card border border-app bg-app-subtle px-3 py-2',
      )}
    >
      <span className="font-medium text-app">{t('pmExecution.title')}:</span>
      {(['in_progress', 'done', 'closed'] as const).map((s) => (
        <WoPmExecutionBadge key={s} status={s} />
      ))}
    </div>
  )

  if (!collapsible) return <div className={className}>{legendContent}</div>

  return (
    <SchedulingSection
      icon={Layers3}
      title={t('pmExecution.title')}
      collapsible
      defaultOpen={defaultOpen}
      bodyClassName="p-3"
      className={className}
    >
      {legendContent}
    </SchedulingSection>
  )
}
