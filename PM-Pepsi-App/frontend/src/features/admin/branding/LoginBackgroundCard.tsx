import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { Upload } from 'lucide-react'
import type { ChangeEvent } from 'react'
import { Trans, useTranslation } from 'react-i18next'

export type LoginBackgroundCardProps = {
  hasLoginBackground: boolean
  previewSrc: string | null
  canWrite: boolean
  uploadPending: boolean
  deletePending: boolean
  onFileSelect: (e: ChangeEvent<HTMLInputElement>) => void
  onDelete: () => void
}

export function LoginBackgroundCard({
  hasLoginBackground,
  previewSrc,
  canWrite,
  uploadPending,
  deletePending,
  onFileSelect,
  onDelete,
}: LoginBackgroundCardProps) {
  const { t } = useTranslation('admin')

  return (
    <Card className="admin-card lg:col-span-2">
      <CardHeader>
        <CardTitle>{t('branding.loginBgTitle')}</CardTitle>
        <CardDescription>
          <Trans t={t} i18nKey="branding.loginBgDesc" components={{ code: <code className="text-xs" /> }} />
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className={cn(
            'relative overflow-hidden rounded-card border border-app bg-app-muted',
            previewSrc || hasLoginBackground
              ? 'aspect-[16/9] max-h-48'
              : 'flex h-24 items-center justify-center',
          )}
        >
          {previewSrc ? (
            <img src={previewSrc} alt="" className="size-full object-cover" />
          ) : (
            <p className="text-caption">{t('branding.loginBgEmpty')}</p>
          )}
        </div>
        {canWrite ? (
          <div className="flex flex-wrap gap-2">
            <Label
              className={cn(
                'inline-flex cursor-pointer items-center gap-2 rounded-button border border-app bg-[var(--app-surface)] px-3 py-2 text-body-sm font-medium hover:bg-app-subtle',
                uploadPending && 'pointer-events-none opacity-60',
              )}
            >
              <Upload className="size-4" aria-hidden />
              {t('branding.uploadLoginBg')}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                className="sr-only"
                onChange={onFileSelect}
              />
            </Label>
            {hasLoginBackground ? (
              <Button type="button" variant="outline" disabled={deletePending} onClick={onDelete}>
                {t('branding.deleteLoginBg')}
              </Button>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
