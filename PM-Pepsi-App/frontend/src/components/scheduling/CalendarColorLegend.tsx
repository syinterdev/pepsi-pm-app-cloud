import { activityDisplayOptions, woCalendarColorLegendItems } from '@/lib/scheduling-i18n'
import { cn } from '@/lib/utils'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

export function CalendarColorLegend({ className }: { className?: string }) {
  const { t } = useTranslation('scheduling')
  const legendItems = useMemo(() => woCalendarColorLegendItems(t), [t])

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-3 rounded-card border border-app bg-app-subtle px-3 py-2 text-xs text-app',
        className,
      )}
    >
      <span className="font-medium">{t('calendarLegend.title')}</span>
      <span className="inline-flex items-center gap-1" title={t('calendarLegend.tecoWarningTitle')}>
        <span aria-hidden>🔔</span>
        <span>{t('calendarLegend.tecoWarning')}</span>
      </span>
      {legendItems.map((item) => (
        <span
          key={item.label}
          className="inline-flex items-center gap-1.5"
          title={item.title}
        >
          <span
            className="inline-block size-3 shrink-0 rounded-sm ring-1 ring-black/10"
            style={{ backgroundColor: item.color }}
            aria-hidden
          />
          {item.label}
        </span>
      ))}
    </div>
  )
}

export type ActivityDisplayMode = 'all' | 'Z1' | 'Z2' | 'Z5'

/** @deprecated Use activityDisplayOptions(t) from scheduling-i18n */
export function getActivityDisplayOptions(
  t: ReturnType<typeof import('react-i18next').useTranslation>['t'],
): ReadonlyArray<{ value: ActivityDisplayMode; label: string }> {
  return activityDisplayOptions(t)
}
