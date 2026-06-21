import { TelegramInviteDialog } from '@/components/telegram/TelegramInviteDialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { getStoredAuthUser } from '@/features/auth/login-api'
import {
  createMyTelegramLinkToken,
  fetchMyTelegramLinkStatus,
  unlinkMyTelegram,
} from '@/lib/telegram-link-api'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link2, Link2Off, Loader2, MessageSquare } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

export function TelegramLinkPanel() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const authUser = getStoredAuthUser()
  const isWorkcenter = authUser?.accountType !== 'member' && !!authUser?.idwkctr

  const statusQ = useQuery({
    queryKey: ['personnel', 'me', 'telegram'],
    queryFn: fetchMyTelegramLinkStatus,
    enabled: isWorkcenter,
  })

  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteData, setInviteData] = useState<Awaited<ReturnType<typeof createMyTelegramLinkToken>> | null>(null)

  const inviteMut = useMutation({
    mutationFn: createMyTelegramLinkToken,
    onSuccess: (data) => {
      setInviteData(data)
      setInviteOpen(true)
    },
    onError: (err) => toast.error((err as Error).message || t('settings.telegram.inviteFailed')),
  })

  const unlinkMut = useMutation({
    mutationFn: unlinkMyTelegram,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['personnel', 'me', 'telegram'] })
      toast.success(t('settings.telegram.unlinked'))
    },
    onError: (err) => toast.error((err as Error).message || t('settings.telegram.unlinkFailed')),
  })

  if (!isWorkcenter) return null

  if (statusQ.isLoading) return <Skeleton className="h-24 w-full rounded-card" />

  const linked = statusQ.data?.linked ?? false

  return (
    <div className="rounded-card border border-app bg-[var(--app-surface)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-body-sm font-semibold text-app">
            <MessageSquare className="h-4 w-4" />
            {t('settings.telegram.title')}
          </h3>
          <p className="mt-1 text-xs text-app-muted">{t('settings.telegram.hint')}</p>
        </div>
        {linked ? (
          <Badge className="app-tone-success-fill">{t('settings.telegram.linked')}</Badge>
        ) : (
          <Badge variant="outline">{t('settings.telegram.notLinked')}</Badge>
        )}
      </div>

      {linked && statusQ.data ? (
        <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
          {statusQ.data.telegramUsername ? (
            <div>
              <dt className="text-app-muted">@username</dt>
              <dd className="font-mono">@{statusQ.data.telegramUsername}</dd>
            </div>
          ) : null}
          {statusQ.data.telegramLinkedAt ? (
            <div>
              <dt className="text-app-muted">{t('settings.telegram.linkedAt')}</dt>
              <dd>{new Date(statusQ.data.telegramLinkedAt).toLocaleString()}</dd>
            </div>
          ) : null}
        </dl>
      ) : null}

      {!statusQ.data?.botConfigured ? (
        <p className="app-tone-warning-icon mt-3 text-xs">{t('settings.telegram.botNotConfigured')}</p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={inviteMut.isPending || !statusQ.data?.botConfigured}
          onClick={() => inviteMut.mutate()}
        >
          {inviteMut.isPending ? (
            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
          ) : (
            <Link2 className="mr-1 h-4 w-4" />
          )}
          {linked ? t('settings.telegram.relink') : t('settings.telegram.createInvite')}
        </Button>
        {linked ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={unlinkMut.isPending}
            onClick={() => unlinkMut.mutate()}
          >
            {unlinkMut.isPending ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <Link2Off className="mr-1 h-4 w-4" />
            )}
            {t('settings.telegram.unlink')}
          </Button>
        ) : null}
      </div>

      <TelegramInviteDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        data={inviteData}
        title={t('settings.telegram.inviteTitle')}
      />
    </div>
  )
}
