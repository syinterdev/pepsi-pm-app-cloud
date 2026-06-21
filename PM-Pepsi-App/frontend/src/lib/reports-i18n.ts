import type { EngUtilizationPeriodId } from '@/lib/eng-utilization-chart'
import type { TFunction } from 'i18next'

export function engUtilizationPeriodPresets(t: TFunction<'reports'>): ReadonlyArray<{
  id: EngUtilizationPeriodId
  label: string
  hint: string
}> {
  const ids: EngUtilizationPeriodId[] = ['daily', 'weekly', 'monthly', 'yearly']
  return ids.map((id) => ({
    id,
    label: t(`engUtil.period.${id}.label`),
    hint: t(`engUtil.period.${id}.hint`),
  }))
}
