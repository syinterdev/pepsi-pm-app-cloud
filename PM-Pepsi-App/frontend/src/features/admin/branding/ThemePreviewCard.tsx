import type { AdminBranding } from '@/api/schemas'
import { PepsiBrandMark } from '@/components/brand/PepsiBrandMark'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { logoNavStyle } from '@/lib/branding-asset-css'
import { Palette } from 'lucide-react'
import type { CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'

export type ThemePreviewCardProps = {
  form: AdminBranding
  logoPreviewSrc: string | null
}

export function ThemePreviewCard({ form, logoPreviewSrc }: ThemePreviewCardProps) {
  const { t } = useTranslation('admin')

  return (
    <Card className="admin-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Palette className="size-5" aria-hidden />
          {t('branding.previewTitle')}
        </CardTitle>
        <CardDescription>{t('branding.previewDesc')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className="app-glass flex items-center gap-4 rounded-card p-4"
          style={
            {
              '--preview-primary': form.primaryColor,
              '--preview-accent': form.accentColor,
            } as CSSProperties
          }
        >
          {logoPreviewSrc ? (
            <img
              src={logoPreviewSrc}
              alt=""
              className="rounded-card object-contain ring-1 ring-app"
              style={logoNavStyle(form.logoNavHeightPx)}
            />
          ) : (
            <PepsiBrandMark size="md" />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-semibold text-app">{form.appName}</p>
            <p className="truncate text-xs text-app-muted">{form.footerText}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ['Primary', form.primaryColor],
                ['Accent', form.accentColor],
                ['Success', form.successColor],
                ['Warning', form.warningColor],
                ['Danger', form.dangerColor],
                ['Info', form.infoColor],
              ] as const
            ).map(([title, color]) => (
              <span
                key={title}
                className="size-7 rounded-button ring-1 ring-app"
                style={{ background: color }}
                title={title}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
