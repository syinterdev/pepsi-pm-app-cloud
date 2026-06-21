import { Label } from '@/components/ui/label'
import type { AdminBranding } from '@/api/schemas'
import { useTranslation } from 'react-i18next'

type BrandingAssetSizeCardProps = {
  form: AdminBranding
  disabled?: boolean
  onChange: (patch: Partial<Pick<AdminBranding, 'logoNavHeightPx' | 'logoLoginHeightPx' | 'faviconSizePx'>>) => void
}

function SizeSlider({
  id,
  label,
  hint,
  min,
  max,
  value,
  disabled,
  onChange,
}: {
  id: string
  label: string
  hint: string
  min: number
  max: number
  value: number
  disabled?: boolean
  onChange: (v: number) => void
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id}>{label}</Label>
        <span className="text-xs font-medium tabular-nums text-app-muted">{value}px</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        disabled={disabled}
        className="h-2 w-full cursor-pointer accent-[var(--app-primary,#F7941D)] disabled:opacity-50"
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <p className="text-xs text-app-muted">{hint}</p>
    </div>
  )
}

export function BrandingAssetSizeCard({ form, disabled, onChange }: BrandingAssetSizeCardProps) {
  const { t } = useTranslation('admin')

  return (
    <div className="space-y-4 rounded-card border border-app bg-app-subtle/80 p-4">
      <p className="text-body-sm font-medium text-app">{t('branding.displaySizeTitle')}</p>
      <SizeSlider
        id="logo-nav-height"
        label={t('branding.logoNavLabel')}
        hint={t('branding.logoNavHint', { min: 24, max: 72 })}
        min={24}
        max={72}
        value={form.logoNavHeightPx}
        disabled={disabled}
        onChange={(logoNavHeightPx) => onChange({ logoNavHeightPx })}
      />
      <SizeSlider
        id="logo-login-height"
        label={t('branding.logoLoginLabel')}
        hint={`${40}–${128}px`}
        min={40}
        max={128}
        value={form.logoLoginHeightPx}
        disabled={disabled}
        onChange={(logoLoginHeightPx) => onChange({ logoLoginHeightPx })}
      />
      <SizeSlider
        id="favicon-size"
        label={t('branding.faviconSizeLabel')}
        hint={t('branding.faviconSizeHint', { min: 16, max: 48 })}
        min={16}
        max={48}
        value={form.faviconSizePx}
        disabled={disabled}
        onChange={(faviconSizePx) => onChange({ faviconSizePx })}
      />
    </div>
  )
}
