import { kpiStatToneClass, type KpiStatTone } from '@/components/kpi/kpi-tone'
import type { ReactNode } from 'react'

export function KpiStatCard({
  label,
  value,
  footer,
  tone = 'default',
  className,
}: {
  label: ReactNode
  value: ReactNode
  footer?: ReactNode
  tone?: KpiStatTone
  className?: string
}) {
  return (
    <div className={kpiStatToneClass(tone, className)}>
      <p className="font-medium">{label}</p>
      <p className="mt-1 tabular-nums">{value}</p>
      {footer ? <div className="mt-2 text-xs">{footer}</div> : null}
    </div>
  )
}
