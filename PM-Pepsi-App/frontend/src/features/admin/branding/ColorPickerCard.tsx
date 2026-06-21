import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { animate, type JSAnimation } from 'animejs'
import { COLOR_PRESETS } from './branding-constants'
import { useRef, type MutableRefObject } from 'react'
import { useTranslation } from 'react-i18next'

export type ColorPickerCardProps = {
  primaryColor: string
  accentColor: string
  canWrite: boolean
  onPrimaryChange: (value: string) => void
  onAccentChange: (value: string) => void
  onPreset: (primary: string, accent: string) => void
}

export function ColorPickerCard({
  primaryColor,
  accentColor,
  canWrite,
  onPrimaryChange,
  onAccentChange,
  onPreset,
}: ColorPickerCardProps) {
  const { t } = useTranslation('admin')
  const primaryRef = useRef<HTMLInputElement | null>(null)
  const accentRef = useRef<HTMLInputElement | null>(null)
  const primaryAnimRef = useRef<JSAnimation | null>(null)
  const accentAnimRef = useRef<JSAnimation | null>(null)

  const pulse = (el: HTMLElement | null, animRef: MutableRefObject<JSAnimation | null>) => {
    if (!el) return
    animRef.current?.cancel()
    animRef.current = animate(el, {
      targets: el,
      scale: [1, 1.06, 1],
      boxShadow: [
        '0 0 0 0 rgba(0,0,0,0)',
        '0 0 0 10px rgba(var(--app-accent-rgb, 0, 122, 255), 0.18)',
        '0 0 0 0 rgba(0,0,0,0)',
      ],
      duration: 420,
      easing: 'easeOutQuad',
    })
  }

  return (
    <Card className="admin-card lg:col-span-2">
      <CardHeader>
        <CardTitle>{t('branding.colorsTitle')}</CardTitle>
        <CardDescription>{t('branding.colorsDesc')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {COLOR_PRESETS.map((p) => (
            <Button
              key={p.id}
              type="button"
              size="sm"
              variant="outline"
              disabled={!canWrite}
              onClick={() => onPreset(p.primary, p.accent)}
            >
              {t(`branding.preset.${p.id}`)}
            </Button>
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="primaryColor">{t('branding.primary')}</Label>
            <div className="flex gap-2">
              <Input
                id="primaryColor"
                type="color"
                className="h-10 w-14 shrink-0 cursor-pointer p-1"
                value={primaryColor}
                disabled={!canWrite}
                onChange={(e) => {
                  onPrimaryChange(e.target.value)
                  pulse(primaryRef.current, primaryAnimRef)
                }}
                ref={primaryRef}
              />
              <Input
                value={primaryColor}
                disabled={!canWrite}
                onChange={(e) => onPrimaryChange(e.target.value)}
                pattern="^#[0-9A-Fa-f]{6}$"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="accentColor">{t('branding.accent')}</Label>
            <div className="flex gap-2">
              <Input
                id="accentColor"
                type="color"
                className="h-10 w-14 shrink-0 cursor-pointer p-1"
                value={accentColor}
                disabled={!canWrite}
                onChange={(e) => {
                  onAccentChange(e.target.value)
                  pulse(accentRef.current, accentAnimRef)
                }}
                ref={accentRef}
              />
              <Input
                value={accentColor}
                disabled={!canWrite}
                onChange={(e) => onAccentChange(e.target.value)}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
