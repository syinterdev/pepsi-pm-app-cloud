import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useTranslation } from 'react-i18next'

export type SemanticColorCardProps = {
  successColor: string
  warningColor: string
  dangerColor: string
  infoColor: string
  canWrite: boolean
  onSuccessChange: (value: string) => void
  onWarningChange: (value: string) => void
  onDangerChange: (value: string) => void
  onInfoChange: (value: string) => void
}

const FIELDS = [
  { key: 'success', label: 'Success', prop: 'successColor' as const },
  { key: 'warning', label: 'Warning', prop: 'warningColor' as const },
  { key: 'danger', label: 'Danger', prop: 'dangerColor' as const },
  { key: 'info', label: 'Info', prop: 'infoColor' as const },
] as const

export function SemanticColorCard({
  successColor,
  warningColor,
  dangerColor,
  infoColor,
  canWrite,
  onSuccessChange,
  onWarningChange,
  onDangerChange,
  onInfoChange,
}: SemanticColorCardProps) {
  const { t } = useTranslation('admin')
  const values = { successColor, warningColor, dangerColor, infoColor }
  const handlers = {
    successColor: onSuccessChange,
    warningColor: onWarningChange,
    dangerColor: onDangerChange,
    infoColor: onInfoChange,
  }

  return (
    <Card className="admin-card lg:col-span-2">
      <CardHeader>
        <CardTitle>{t('branding.semanticTitle')}</CardTitle>
        <CardDescription>{t('branding.semanticDesc')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          {FIELDS.map((f) => {
            const value = values[f.prop]
            const onChange = handlers[f.prop]
            return (
              <div key={f.key} className="space-y-2">
                <Label htmlFor={`semantic-${f.key}`}>{f.label}</Label>
                <div className="flex gap-2">
                  <Input
                    id={`semantic-${f.key}`}
                    type="color"
                    className="h-10 w-14 shrink-0 cursor-pointer p-1"
                    value={value}
                    disabled={!canWrite}
                    onChange={(e) => onChange(e.target.value)}
                  />
                  <Input
                    value={value}
                    disabled={!canWrite}
                    onChange={(e) => onChange(e.target.value)}
                    pattern="^#[0-9A-Fa-f]{6}$"
                  />
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
