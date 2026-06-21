import { Badge } from '@/components/ui/badge'
import { SchedulingSection } from '@/components/scheduling/SchedulingPageLayout'
import {
  PLANNER_PIPELINE_COLORS,
  PIPELINE_BADGE_ICONS,
  type PlannerPipelineBadge,
  type PlannerPipelineStatus,
} from '@/lib/planner-pipeline'
import { cn } from '@/lib/utils'
import { Layers3 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

function PipelineSwatch({ status }: { status: PlannerPipelineStatus }) {
  const { t } = useTranslation('scheduling')
  const color = PLANNER_PIPELINE_COLORS[status]
  return (
    <Badge
      variant="outline"
      title={t(`pipeline.status.${status}.title`)}
      className="gap-1.5 font-semibold ring-1"
      style={{ borderColor: color, color }}
    >
      <span
        className="inline-block size-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
        aria-hidden
      />
      {t(`pipeline.status.${status}.label`)}
    </Badge>
  )
}

function PipelineBadgeChip({ badge }: { badge: PlannerPipelineBadge }) {
  const { t } = useTranslation('scheduling')
  return (
    <Badge variant="secondary" className="text-badge font-normal" title={t(`pipeline.badge.${badge}.title`)}>
      {PIPELINE_BADGE_ICONS[badge]} {t(`pipeline.badge.${badge}.label`)}
    </Badge>
  )
}

export function PlannerPipelineLegend({
  className,
  collapsible = false,
  defaultOpen = true,
  showBadges = true,
}: {
  className?: string
  collapsible?: boolean
  defaultOpen?: boolean
  showBadges?: boolean
}) {
  const { t } = useTranslation('scheduling')

  const legendContent = (
    <div className={cn('space-y-2 text-xs text-app', !collapsible && 'rounded-card border border-app bg-app-subtle px-3 py-2')}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium text-app">{t('pipeline.title')}:</span>
        {(['unassigned', 'assigned', 'in_progress', 'closed'] as const).map((s) => (
          <PipelineSwatch key={s} status={s} />
        ))}
      </div>
      {showBadges ? (
        <div className="flex flex-wrap items-center gap-2 border-t border-app pt-2">
          <span className="text-app-muted">{t('pipeline.badgesTitle')}:</span>
          {(['ack_pending', 'ack_done', 'qc_pending', 'qc_approved', 'qc_rejected'] as const).map(
            (b) => (
              <PipelineBadgeChip key={b} badge={b} />
            ),
          )}
        </div>
      ) : null}
    </div>
  )

  if (!collapsible) return <div className={className}>{legendContent}</div>

  return (
    <SchedulingSection
      icon={Layers3}
      title={t('pipeline.title')}
      collapsible
      defaultOpen={defaultOpen}
      bodyClassName="p-3"
      className={className}
    >
      {legendContent}
    </SchedulingSection>
  )
}
