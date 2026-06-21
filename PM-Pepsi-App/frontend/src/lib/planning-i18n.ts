import type { PlanningAssignMode } from '@/lib/planning-assign-mode'
import type { TFunction } from 'i18next'

export function planningAssignModeMeta(
  t: TFunction<'planning'>,
  mode: PlanningAssignMode,
): { label: string; short: string; description: string } {
  return {
    label: t(`assignDialog.mode.${mode}.label`),
    short: t(`assignDialog.mode.${mode}.short`),
    description: t(`assignDialog.mode.${mode}.description`),
  }
}
