import { ADMIN_SECTIONS } from '@/lib/admin-sections'
import { localizeAdminSection, tAdminSectionGroupLabel } from '@/lib/admin-i18n'
import type { TFunction } from 'i18next'
import type { Step } from 'react-joyride'

export const TOUR_PAGE_SECTIONS = ADMIN_SECTIONS.filter((s) => s.implemented && s.segment)

export const ADMIN_TOUR_STEP_COUNT = 2 + TOUR_PAGE_SECTIONS.length

/** Joyride steps — used in AdminTour and unit tests */
export function buildAdminTourSteps(t: TFunction<'admin'>): Step[] {
  return [
    {
      target: '[data-tour="admin-command-hint"]',
      title: t('tour.commandPaletteTitle'),
      content: <span>{t('tour.commandPaletteBody')}</span>,
      placement: 'bottom',
    },
    {
      target: '[data-tour="admin-console"]',
      title: t('tour.consoleTitle'),
      content: t('tour.consoleBody'),
      placement: 'center',
    },
    ...TOUR_PAGE_SECTIONS.map((s, idx) => {
      const loc = localizeAdminSection(s, t)
      return {
        target: `[data-tour="${s.tourTarget}"]`,
        title: loc.label,
        content: (
          <span>
            <span className="admin-tour-tooltip__group">{tAdminSectionGroupLabel(s.group, t)}</span>
            <br />
            {loc.description}
            <span className="admin-tour-tooltip__step-meta">
              {' '}
              {t('tour.stepMeta', { current: idx + 3, total: ADMIN_TOUR_STEP_COUNT })}
            </span>
          </span>
        ),
        placement: 'center' as const,
      }
    }),
  ]
}

export function routeForAdminTourStepIndex(index: number): string | null {
  if (index <= 1) return '/admin'
  const section = TOUR_PAGE_SECTIONS[index - 2]
  return section?.to ?? null
}
