import type { PlannerPipelineBadge } from '@/lib/planner-pipeline'
import { PIPELINE_BADGE_ICONS } from '@/lib/planner-pipeline'

export function mountCalendarPipelineBadges(
  el: HTMLElement,
  badges: PlannerPipelineBadge[] | undefined,
): void {
  el.querySelectorAll('.pm-cal-pipeline-badge').forEach((n) => n.remove())
  el.querySelectorAll('.pm-cal-pipeline-badges').forEach((n) => n.remove())
  if (!badges?.length) return

  const wrap = document.createElement('span')
  wrap.className = 'pm-cal-pipeline-badges'
  wrap.setAttribute('aria-hidden', 'true')

  for (const badge of badges) {
    const span = document.createElement('span')
    span.className = `pm-cal-pipeline-badge pm-cal-pipeline-badge--${badge.replace(/_/g, '-')}`
    span.textContent = PIPELINE_BADGE_ICONS[badge]
    wrap.appendChild(span)
  }

  el.appendChild(wrap)
}
