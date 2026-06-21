import type { TelegramLinkTokenResponse } from '@/api/schemas'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SpinnerBlock } from '@/components/ui/spinner'
import { Copy } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: TelegramLinkTokenResponse | null
  loading?: boolean
  title?: string
  description?: string
}

async function copyText(text: string, okMsg: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success(okMsg)
  } catch {
    toast.error('Copy failed')
  }
}

export function TelegramInviteDialog({
  open,
  onOpenChange,
  data,
  loading = false,
  title,
  description,
}: Props) {
  const { t } = useTranslation('personnel')
  const { t: tc } = useTranslation('common')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md" className="flex flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 space-y-1 border-b border-app/60 px-6 pb-4 pt-6 text-left">
          <DialogTitle>{title ?? t('telegram.inviteTitle')}</DialogTitle>
          <DialogDescription>
            {description ??
              (data
                ? t('telegram.inviteDesc', { wkctr: data.wkctr, id: data.idwkctr })
                : t('telegram.inviteLoading'))}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <SpinnerBlock label={t('telegram.inviteLoading')} />
          ) : data ? (
            <div className="grid gap-3">
              <div className="grid gap-1">
                <Label>{t('telegram.deepLink')}</Label>
                <div className="flex gap-2">
                  <Input readOnly value={data.deepLink} className="font-mono text-xs" />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => void copyText(data.deepLink, t('telegram.copiedLink'))}
                  >
                    <Copy className="size-4" />
                  </Button>
                </div>
              </div>
              <div className="grid gap-1">
                <Label>{t('telegram.startCommand')}</Label>
                <div className="flex gap-2">
                  <Input readOnly value={`/start ${data.token}`} className="font-mono text-xs" />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      void copyText(`/start ${data.token}`, t('telegram.copiedCommand'))
                    }
                  >
                    <Copy className="size-4" />
                  </Button>
                </div>
              </div>
              <p className="text-xs text-app-muted">
                {t('telegram.expiresAt', {
                  at: new Date(data.expiresAt).toLocaleString(),
                })}
              </p>
              {!data.botUsername ? (
                <p className="text-xs text-form-error">{t('telegram.botUsernameMissing')}</p>
              ) : null}
            </div>
          ) : null}
        </div>

        <DialogFooter className="shrink-0 border-t border-app/60 px-6 py-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {tc('actions.close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
