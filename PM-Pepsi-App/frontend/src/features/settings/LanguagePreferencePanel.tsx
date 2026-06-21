import { AppCard } from '@/components/layout/AppCard'
import { LanguageSwitcher } from '@/components/i18n/LanguageSwitcher'
import { useTranslation } from 'react-i18next'

export function LanguagePreferencePanel() {
  const { t } = useTranslation()

  return (
    <AppCard pad="compact" className="space-y-3">
      <div>
        <h3 className="text-body-sm font-semibold text-app">{t('language.label')}</h3>
        <p className="mt-1 text-xs text-app-muted">{t('settings.languageHint')}</p>
      </div>
      <LanguageSwitcher variant="segmented" className="w-fit" />
    </AppCard>
  )
}
