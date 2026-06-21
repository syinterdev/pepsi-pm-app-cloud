import { clearAdminTourSeen, hasSeenAdminTour, markAdminTourSeen } from '@/lib/admin-tour-pref'
import {
  ADMIN_TOUR_STEP_COUNT,
  buildAdminTourSteps,
  routeForAdminTourStepIndex,
} from '@/components/admin/admin-tour-steps'
import { AdminTourTooltip } from '@/components/admin/AdminTourTooltip'
import { toastSuccess } from '@/lib/app-toast'
import { EVENTS, Joyride, STATUS, type EventHandler } from 'react-joyride'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

export { ADMIN_TOUR_STEP_COUNT, buildAdminTourSteps, routeForAdminTourStepIndex }

export function AdminTour({
  run,
  onRunChange,
}: {
  run: boolean
  onRunChange: (run: boolean) => void
}) {
  const { t } = useTranslation('admin')
  const navigate = useNavigate()
  const steps = useMemo(() => buildAdminTourSteps(t), [t])

  const handleEvent: EventHandler = (data) => {
    if (data.type === EVENTS.STEP_BEFORE) {
      const to = routeForAdminTourStepIndex(data.index)
      if (to) navigate(to)
    }
    if (data.type === EVENTS.TOUR_END) {
      markAdminTourSeen()
      onRunChange(false)
      toastSuccess(t('tour.endToast', { count: ADMIN_TOUR_STEP_COUNT }))
    }
    if (data.status === STATUS.SKIPPED) {
      markAdminTourSeen()
      onRunChange(false)
      toast.message(t('tour.skipToast'))
    }
  }

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      scrollToFirstStep
      onEvent={handleEvent}
      tooltipComponent={AdminTourTooltip}
      locale={{
        back: t('tour.joyride.back'),
        close: t('tour.joyride.close'),
        last: t('tour.joyride.last'),
        next: t('tour.joyride.next'),
        skip: t('tour.joyride.skip'),
      }}
      options={{
        primaryColor: 'var(--brand-logo-blue-dark, #003366)',
        zIndex: 10000,
        arrowColor: 'var(--admin-tour-arrow, #ffffff)',
        backgroundColor: 'var(--admin-tour-surface, #ffffff)',
        textColor: 'var(--admin-tour-text, #18181b)',
        overlayColor: 'var(--admin-tour-overlay, rgba(15, 23, 42, 0.52))',
        showProgress: true,
        skipBeacon: true,
        overlayClickAction: false,
        spotlightPadding: 12,
        buttons: ['back', 'close', 'primary', 'skip'],
      }}
      styles={{
        tooltip: {
          padding: 0,
          borderRadius: 'var(--app-radius-dialog, 16px)',
        },
        tooltipContainer: {
          textAlign: 'left',
        },
      }}
    />
  )
}

export function shouldAutoStartAdminTour(pathname: string, canAdmin: boolean): boolean {
  if (!canAdmin) return false
  if (!pathname.startsWith('/admin')) return false
  return !hasSeenAdminTour()
}

export function restartAdminTour(onRun: () => void) {
  clearAdminTourSeen()
  onRun()
}
