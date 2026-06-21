import { useAppVersion } from '@/lib/use-app-version'
import { usePublicSettings } from '@/providers/SettingsProvider'
import { useTranslation } from 'react-i18next'

/** App footer */
export function AppFooter() {
  const { t } = useTranslation('common')
  const { settings } = usePublicSettings()
  const { label: versionLabel } = useAppVersion()
  const footerText = settings?.footerText?.trim() || t('footer.defaultCopyright')

  return (
    <footer className="app-footer app-surface shrink-0 border-t px-4 py-3 sm:px-6">
      <div className="app-footer__inner flex flex-col items-center justify-between gap-2 text-caption text-[var(--app-text-muted)] sm:flex-row">
        <span className="text-center sm:text-left">{footerText}</span>
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 sm:justify-end">
          <span
            className="app-footer__version font-mono text-[0.7rem] tracking-tight"
            title={t('footer.versionTitle')}
          >
            {versionLabel}
          </span>
          <span aria-hidden className="hidden sm:inline">
            ·
          </span>
          <a href="#" className="hover:text-[var(--app-text)] hover:underline">
            {t('footer.privacyPolicy')}
          </a>
          <span aria-hidden>·</span>
          <span>{t('footer.siteName')}</span>
        </div>
      </div>
    </footer>
  )
}
