import { ConfirmPhraseDialog } from '@/components/admin/ConfirmPhraseDialog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  deactivateAdminWithoutPhoto,
  fetchAdminPhotoGoLiveGaps,
} from '@/lib/admin-users-api'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

type Props = {
  canWrite: boolean
  onShowMissingPhotos: () => void
  onShowMissingCodes?: () => void
}

export function PersonnelAdminPhotoGoLiveBanner({
  canWrite,
  onShowMissingPhotos,
  onShowMissingCodes,
}: Props) {
  const { t } = useTranslation('personnel')
  const qc = useQueryClient()
  const [confirmOpen, setConfirmOpen] = useState(false)

  const gapsQ = useQuery({
    queryKey: ['admin', 'users', 'photo-go-live'],
    queryFn: () => fetchAdminPhotoGoLiveGaps({ weeksBack: 8 }),
    staleTime: 60_000,
  })

  const deactivateM = useMutation({
    mutationFn: (idwkctrs: string[]) => deactivateAdminWithoutPhoto(idwkctrs),
    onSuccess: (res) => {
      toast.success(
        t('photoGoLive.toastSuccess', {
          updated: res.updated,
          workstatus: res.workstatus,
          skipped: res.skipped.length
            ? t('photoGoLive.toastSkipped', { n: res.skipped.length })
            : '',
        }),
      )
      void qc.invalidateQueries({ queryKey: ['admin', 'users', 'photo-go-live'] })
      void qc.invalidateQueries({ queryKey: ['personnel', 'admin', 'list'] })
      void qc.invalidateQueries({ queryKey: ['reports', 'summary-weekly'] })
      setConfirmOpen(false)
    },
    onError: () => toast.error(t('photoGoLive.toastFailed')),
  })

  if (gapsQ.isLoading) {
    return <Skeleton className="h-20 w-full rounded-card" />
  }
  if (gapsQ.isError || !gapsQ.data) return null

  const { items, range } = gapsQ.data
  if (items.length === 0) return null

  const ids = items.map((i) => i.idwkctr)

  return (
    <>
      <div className="admin-callout admin-callout--amber">
        <p className="text-body-sm font-medium">
          {t('photoGoLive.title', { count: items.length })}
        </p>
        <p className="mt-1 text-xs opacity-90">
          {t('photoGoLive.body', { from: range.from, to: range.to })}
        </p>
        <ul className="mt-2 flex flex-wrap gap-2 text-xs">
          {items.slice(0, 8).map((p) => (
            <li
              key={p.idwkctr}
              className="app-tone-warning-review-item rounded-button border app-surface-panel px-2 py-1"
            >
              {p.wkctr}
              {p.displayName ? ` (${p.displayName})` : ''} ·{' '}
              {t('photoGoLive.hours', { hours: p.manhourHours })}
            </li>
          ))}
          {items.length > 8 ? (
            <li className="self-center opacity-80">
              {t('photoGoLive.morePeople', { n: items.length - 8 })}
            </li>
          ) : null}
        </ul>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" onClick={onShowMissingPhotos}>
            {t('photoGoLive.filterNoPhoto')}
          </Button>
          {onShowMissingCodes ? (
            <Button type="button" size="sm" variant="outline" onClick={onShowMissingCodes}>
              {t('photoGoLive.filterNoWorkCntr')}
            </Button>
          ) : null}
          <Button type="button" size="sm" variant="outline" asChild>
            <Link to="/summary-weekly">{t('photoGoLive.viewEngUtil')}</Link>
          </Button>
          {canWrite ? (
            <Button
              type="button"
              size="sm"
              onClick={() => setConfirmOpen(true)}
            >
              {t('photoGoLive.deactivateAll', { count: items.length })}
            </Button>
          ) : (
            <span className="app-tone-warning-label self-center text-xs">
              {t('photoGoLive.needWrite')}
            </span>
          )}
        </div>
      </div>

      {confirmOpen ? (
        <ConfirmPhraseDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          tone="danger"
          phrase={t('photoGoLive.confirmPhrase')}
          title={t('photoGoLive.confirmTitle')}
          description={t('photoGoLive.confirmDesc', { count: items.length })}
          confirmLabel={t('photoGoLive.confirmButton')}
          loading={deactivateM.isPending}
          onConfirm={() => deactivateM.mutate(ids)}
        />
      ) : null}
    </>
  )
}
