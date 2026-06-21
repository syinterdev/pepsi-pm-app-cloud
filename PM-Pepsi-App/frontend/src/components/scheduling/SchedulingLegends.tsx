import type { ActivityDisplayMode } from '@/components/scheduling/CalendarColorLegend'
import {
  activityDisplayOptions,
  calendarColorLegendItems,
  weekendLegendItems,
  plannerPipelineLegendItems,
} from '@/lib/scheduling-i18n'
import { WoPmPhaseLegend } from '@/components/scheduling/WoPmPhaseBadge'
import {
  SchedulingLegendGroup,
  SchedulingLegendRow,
  SchedulingLegendSwatch,
  SchedulingSection,
  SchedulingSegmentControl,
} from '@/components/scheduling/SchedulingPageLayout'
import { WoPmPhaseBadge } from '@/components/scheduling/WoPmPhaseBadge'
import { Layers3, Palette } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

type SchedulingViewControlsProps = {
  activityDisplay: ActivityDisplayMode
  onActivityDisplayChange: (mode: ActivityDisplayMode) => void
  collapsible?: boolean
  defaultOpen?: boolean
  /** work = WO calendar (/calendar) — overdue + TECO per CALENDAR-DISPLAY */
  legendMode?: 'plan' | 'work'
}

/** ตัวเลือกการแสดงกิจกรรม + legend รวมในหนึ่ง section */
export function SchedulingViewControls({
  activityDisplay,
  onActivityDisplayChange,
  collapsible = false,
  defaultOpen = true,
  legendMode = 'plan',
}: SchedulingViewControlsProps) {
  const { t } = useTranslation('scheduling')
  const activityOptions = useMemo(() => activityDisplayOptions(t), [t])
  const colorItems = useMemo(
    () =>
      legendMode === 'work'
        ? plannerPipelineLegendItems(t)
        : calendarColorLegendItems(t),
    [legendMode, t],
  )
  const weekendItems = useMemo(() => weekendLegendItems(t), [t])
  const activityLabel =
    activityOptions.find((o) => o.value === activityDisplay)?.label ?? activityDisplay

  return (
    <SchedulingSection
      icon={Layers3}
      title={t('view.title')}
      description={t('view.description')}
      collapsible={collapsible}
      defaultOpen={defaultOpen}
      collapsedHint={t('view.activitySummary', { label: activityLabel })}
      bodyClassName="space-y-4"
    >
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-app-muted">
          {t('view.activityOnCalendar')}
        </p>
        <SchedulingSegmentControl
          value={activityDisplay}
          onChange={onActivityDisplayChange}
          options={activityOptions}
          className="w-full sm:max-w-2xl"
        />
      </div>

      <SchedulingLegendRow>
        <SchedulingLegendGroup label={t('view.colorGroup')}>
          {legendMode === 'work' ? (
            <span
              className="inline-flex items-center gap-1 text-xs text-app"
              title={t('calendarLegend.tecoWarningTitle')}
            >
              <span aria-hidden>🔔</span>
              <span>{t('calendarLegend.tecoWarning')}</span>
            </span>
          ) : null}
          {colorItems.map((item) => (
            <SchedulingLegendSwatch
              key={item.label}
              color={item.color}
              label={item.label}
              title={item.title}
            />
          ))}
        </SchedulingLegendGroup>
        {legendMode === 'work' ? (
          <SchedulingLegendGroup label={t('view.teamStripeGroup')}>
            <SchedulingLegendSwatch
              color="var(--cal-team-a)"
              label={t('filterDetail.teamA')}
              title={t('view.teamStripeHint')}
            />
            <SchedulingLegendSwatch
              color="var(--cal-team-b)"
              label={t('filterDetail.teamB')}
              title={t('view.teamStripeHint')}
            />
          </SchedulingLegendGroup>
        ) : null}
        <SchedulingLegendGroup label={t('view.pmPhaseGroup')}>
          {(['create', 'rel', 'confirm'] as const).map((p) => (
            <WoPmPhaseBadge key={p} phase={p} />
          ))}
        </SchedulingLegendGroup>
        <SchedulingLegendGroup label={t('view.weekendGroup')}>
          {weekendItems.map((item) => (
            <SchedulingLegendSwatch
              key={item.label}
              color={item.color}
              label={item.label}
              title={item.title}
            />
          ))}
        </SchedulingLegendGroup>
      </SchedulingLegendRow>
    </SchedulingSection>
  )
}

/** Legend Create/REL/Confirm + QC — หน้า WO/Confirmation */
export function WoConfirmationLegendSection({
  collapsible = false,
  defaultOpen = true,
}: {
  collapsible?: boolean
  defaultOpen?: boolean
}) {
  const { t } = useTranslation('scheduling')
  return (
    <SchedulingSection
      icon={Palette}
      title={t('confirmLegend.title')}
      collapsible={collapsible}
      defaultOpen={defaultOpen}
      bodyClassName="p-3"
    >
      <SchedulingLegendRow className="items-stretch border-0 bg-transparent p-0 sm:items-center">
        <WoPmPhaseLegend className="min-w-0 flex-1 border-app/60 bg-[var(--app-surface)] shadow-sm" />
        <SchedulingLegendGroup label="QC">
          <SchedulingLegendSwatch
            color="var(--sys-green-light)"
            label={t('confirmLegend.qcApproved')}
          />
          <SchedulingLegendSwatch
            color="var(--sys-orange-light)"
            label={t('confirmLegend.qcPending')}
          />
          <SchedulingLegendSwatch
            color="var(--sys-red-light)"
            label={t('confirmLegend.qcRejected')}
          />
        </SchedulingLegendGroup>
      </SchedulingLegendRow>
    </SchedulingSection>
  )
}

/** Legend สีอย่างเดียว — ใช้หน้าที่ไม่มี segment control */
export function SchedulingColorLegendStrip({
  className,
  collapsible = false,
  defaultOpen = true,
}: {
  className?: string
  collapsible?: boolean
  defaultOpen?: boolean
}) {
  const { t } = useTranslation('scheduling')
  const colorItems = useMemo(() => calendarColorLegendItems(t), [t])
  return (
    <SchedulingSection
      icon={Palette}
      title={t('view.colorGroup')}
      collapsible={collapsible}
      defaultOpen={defaultOpen}
      bodyClassName="p-3"
      className={className}
    >
      <SchedulingLegendRow className="border-0 bg-transparent p-0">
        <SchedulingLegendGroup label={t('view.colorGroup')}>
          {colorItems.map((item) => (
            <SchedulingLegendSwatch
              key={item.label}
              color={item.color}
              label={item.label}
              title={item.title}
            />
          ))}
        </SchedulingLegendGroup>
      </SchedulingLegendRow>
    </SchedulingSection>
  )
}
