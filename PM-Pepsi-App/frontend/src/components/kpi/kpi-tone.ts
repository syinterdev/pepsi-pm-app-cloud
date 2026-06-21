import { cn } from '@/lib/utils'

/** โทนกล่อง KPI ใน FilterDetail / calendar / WO — ตรง Team A/B/P + WorkOrder สรุป */
export type KpiStatTone = 'default' | 'amber' | 'emerald' | 'rose' | 'info'

const KPI_TONE_CLASS: Record<KpiStatTone, string> = {
  default: 'border-app bg-app-subtle',
  amber: 'app-tone-warning border',
  emerald: 'app-tone-success border',
  rose: 'app-tone-danger border',
  info: 'app-tone-info border',
}

export function kpiStatToneClass(tone: KpiStatTone = 'default', className?: string) {
  return cn('rounded-card border p-3 text-body-sm text-app', KPI_TONE_CLASS[tone], className)
}
