import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useAppLocale } from '@/providers/I18nProvider'
import type { AppLocale } from '@/lib/app-locale'
import { cn } from '@/lib/utils'
import { Check, Globe } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const OPTIONS: AppLocale[] = ['en', 'th']

const ICON_BTN_CLASS =
  'app-topbar-icon-btn size-11 shrink-0 rounded-xl border border-[color-mix(in_srgb,var(--app-border)_80%,transparent)] bg-[color-mix(in_srgb,var(--app-surface)_88%,white)] shadow-sm hover:bg-[var(--app-surface)] hover:shadow-md'

type Props = {
  className?: string
  /** icon = globe trigger + popover (topbar/login) · segmented = EN/TH pills (settings) */
  variant?: 'icon' | 'segmented'
}

function localeLabel(code: AppLocale, t: (key: string) => string): string {
  return code === 'en' ? t('language.en') : t('language.th')
}

export function LanguageSwitcher({ className, variant = 'icon' }: Props) {
  const { locale, setLocale } = useAppLocale()
  const { t } = useTranslation()

  if (variant === 'segmented') {
    return (
      <div
        role="group"
        aria-label={t('language.switchAria')}
        className={cn(
          'inline-flex overflow-hidden rounded-xl border border-[color-mix(in_srgb,var(--app-border)_80%,transparent)] bg-[color-mix(in_srgb,var(--app-surface)_88%,white)] p-0.5 shadow-sm',
          className,
        )}
      >
        {OPTIONS.map((code) => (
          <Button
            key={code}
            type="button"
            size="sm"
            variant={locale === code ? 'default' : 'ghost'}
            className={cn(
              'h-9 min-w-[2.75rem] rounded-[10px] px-2.5 text-xs font-semibold tabular-nums',
              locale !== code && 'text-app-muted hover:text-app',
            )}
            aria-pressed={locale === code}
            onClick={() => setLocale(code)}
          >
            {localeLabel(code, t)}
          </Button>
        ))}
      </div>
    )
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(ICON_BTN_CLASS, className)}
          aria-label={t('language.switchAria')}
          title={t('language.label')}
        >
          <Globe className="size-5" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-44 rounded-xl p-1.5">
        <p className="px-2.5 py-1.5 text-xs font-semibold tracking-wide text-app-muted">
          {t('language.label')}
        </p>
        {OPTIONS.map((code) => (
          <button
            key={code}
            type="button"
            className={cn(
              'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors',
              locale === code
                ? 'bg-[color-mix(in_srgb,var(--app-accent)_12%,var(--app-surface))] font-semibold text-app'
                : 'text-app-muted hover:bg-[color-mix(in_srgb,var(--app-text)_6%,transparent)] hover:text-app',
            )}
            aria-pressed={locale === code}
            onClick={() => setLocale(code)}
          >
            <span className="flex-1">{localeLabel(code, t)}</span>
            {locale === code ? (
              <Check className="size-4 shrink-0 text-[var(--app-accent)]" aria-hidden />
            ) : null}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  )
}
