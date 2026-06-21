import { BRAND_CALENDAR } from '@/lib/brand-palette'

export const plannerPipelineStatusSchema = [
  'unassigned',
  'assigned',
  'in_progress',
  'closed',
] as const

export type PlannerPipelineStatus = (typeof plannerPipelineStatusSchema)[number]

export const plannerPipelineBadgeSchema = [
  'ack_pending',
  'ack_done',
  'qc_pending',
  'qc_approved',
  'qc_rejected',
] as const

export type PlannerPipelineBadge = (typeof plannerPipelineBadgeSchema)[number]

export const PLANNER_PIPELINE_COLORS: Record<PlannerPipelineStatus, string> = {
  unassigned: BRAND_CALENDAR.overdue,
  assigned: '#7B61FF',
  in_progress: BRAND_CALENDAR.inProgress,
  closed: BRAND_CALENDAR.completed,
}

export const PIPELINE_BADGE_ICONS: Record<PlannerPipelineBadge, string> = {
  ack_pending: '🔔',
  ack_done: '✓',
  qc_pending: '⏳',
  qc_approved: '✓',
  qc_rejected: '✗',
}
