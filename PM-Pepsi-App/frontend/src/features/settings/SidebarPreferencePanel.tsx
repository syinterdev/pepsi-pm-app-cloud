import { AppCard } from '@/components/layout/AppCard'
import {
  readSidebarDensity,
  readSidebarWidth,
  subscribeSidebarPrefs,
  writeSidebarDensity,
  writeSidebarWidth,
  type SidebarDensity,
  type SidebarWidth,
} from '@/lib/sidebar-prefs'
import { cn } from '@/lib/utils'
import { PanelLeft, Rows3 } from 'lucide-react'
import { useSyncExternalStore } from 'react'
import { useTranslation } from 'react-i18next'

function PrefToggleGroup<T extends string>({
  label,
  hint,
  value,
  options,
  onChange,
  ariaLabel,
}: {
  label: string
  hint?: string
  value: T
  options: { id: T; label: string; title?: string }[]
  onChange: (id: T) => void
  ariaLabel: string
}) {
  return (
    <div className="space-y-2">
      <div>
        <p className="text-body-sm font-medium text-app">{label}</p>
        {hint ? <p className="text-xs text-app-muted">{hint}</p> : null}
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label={ariaLabel}>
        {options.map((opt) => {
          const active = value === opt.id
          return (
            <button
              key={opt.id}
              type="button"
              title={opt.title}
              className={cn(
                'inline-flex h-9 items-center gap-1.5 rounded-button border px-3 text-body-sm transition-colors',
                active
                  ? 'border-[var(--app-accent)] bg-[color-mix(in_srgb,var(--app-accent)_12%,var(--app-surface))] font-medium text-app'
                  : 'border-app bg-[var(--app-surface)] text-app-muted hover:bg-app-muted hover:text-app',
              )}
              aria-pressed={active}
              onClick={() => onChange(opt.id)}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/** U4g.9 — sidebar density · width (pin remains in sidebar footer) */
export function SidebarPreferencePanel() {
  const { t } = useTranslation()
  const density = useSyncExternalStore(
    subscribeSidebarPrefs,
    readSidebarDensity,
    () => 'comfortable' as SidebarDensity,
  )
  const width = useSyncExternalStore(
    subscribeSidebarPrefs,
    readSidebarWidth,
    () => 'narrow' as SidebarWidth,
  )

  const densityOptions: { id: SidebarDensity; label: string }[] = [
    { id: 'comfortable', label: t('settings.sidebar.densityComfortable') },
    { id: 'compact', label: t('settings.sidebar.densityCompact') },
  ]

  const widthOptions: { id: SidebarWidth; label: string }[] = [
    { id: 'narrow', label: t('settings.sidebar.widthNarrow') },
    { id: 'wide', label: t('settings.sidebar.widthWide') },
  ]

  return (
    <AppCard pad="compact" className="space-y-4">
      <div>
        <h3 className="flex items-center gap-2 text-body-sm font-semibold text-app">
          <PanelLeft className="size-4 shrink-0 opacity-70" aria-hidden />
          {t('settings.sidebar.title')}
        </h3>
        <p className="mt-1 text-xs text-app-muted">{t('settings.sidebar.hint')}</p>
      </div>

      <PrefToggleGroup
        label={t('settings.sidebar.densityLabel')}
        hint={t('settings.sidebar.densityHint')}
        value={density}
        options={densityOptions}
        onChange={writeSidebarDensity}
        ariaLabel={t('settings.sidebar.densityLabel')}
      />

      <PrefToggleGroup
        label={t('settings.sidebar.widthLabel')}
        hint={t('settings.sidebar.widthHint')}
        value={width}
        options={widthOptions}
        onChange={writeSidebarWidth}
        ariaLabel={t('settings.sidebar.widthLabel')}
      />

      <p className="flex items-start gap-2 text-xs text-app-muted">
        <Rows3 className="mt-0.5 size-3.5 shrink-0 opacity-60" aria-hidden />
        {t('settings.sidebar.pinHint')}
      </p>
    </AppCard>
  )
}
