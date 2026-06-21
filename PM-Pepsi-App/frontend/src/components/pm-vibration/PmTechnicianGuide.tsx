import { AppCard } from '@/components/layout/AppCard'
import { ListOrdered } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function PmTechnicianGuide() {
  const { t } = useTranslation('pmVibration')
  const steps = [t('howToStep1'), t('howToStep2'), t('howToStep3'), t('howToStep4')] as const

  return (
    <AppCard className="p-4" aria-labelledby="pm-tech-guide-title">
      <h2
        id="pm-tech-guide-title"
        className="flex items-center gap-2 text-sm font-semibold text-app"
      >
        <ListOrdered className="size-4 text-[var(--app-accent)]" aria-hidden />
        {t('howToTestTitle')}
      </h2>
      <p className="mt-1 text-body-sm text-app-muted">{t('howToTestIntro')}</p>
      <ol className="mt-3 list-decimal space-y-2 pl-5 text-body-sm text-app">
        {steps.map((step, idx) => (
          <li key={idx}>{step}</li>
        ))}
      </ol>
      <p className="mt-3 text-xs text-app-muted">{t('howToAltExcel')}</p>
    </AppCard>
  )
}
