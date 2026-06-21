import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { buildBoardUrl } from '@/lib/board-kiosk'
import {
  clearAdminBoardKioskToken,
  fetchAdminBoardKiosk,
  patchAdminBoardKiosk,
  rotateAdminBoardKioskToken,
} from '@/lib/board-kiosk-api'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Copy, Monitor, RefreshCw, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { toast } from 'sonner'

export function BoardKioskCard({ canWrite }: { canWrite: boolean }) {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const qc = useQueryClient()
  const [lastUrl, setLastUrl] = useState<string | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const q = useQuery({
    queryKey: ['admin', 'board-kiosk'],
    queryFn: fetchAdminBoardKiosk,
  })

  const patchMut = useMutation({
    mutationFn: patchAdminBoardKiosk,
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: ['admin', 'board-kiosk'] })
      void qc.invalidateQueries({ queryKey: ['board', 'kiosk-status'] })
      toast.success(data.enabled ? t('boardKiosk.enabled') : t('boardKiosk.disabled'))
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const rotateMut = useMutation({
    mutationFn: rotateAdminBoardKioskToken,
    onSuccess: (data) => {
      const url = buildBoardUrl(window.location.origin, data.token)
      setLastUrl(url)
      void qc.invalidateQueries({ queryKey: ['admin', 'board-kiosk'] })
      void qc.invalidateQueries({ queryKey: ['board', 'kiosk-status'] })
      toast.success(t('boardKiosk.tokenCreated'))
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const clearMut = useMutation({
    mutationFn: clearAdminBoardKioskToken,
    onSuccess: () => {
      setLastUrl(null)
      setDeleteOpen(false)
      void qc.invalidateQueries({ queryKey: ['admin', 'board-kiosk'] })
      void qc.invalidateQueries({ queryKey: ['board', 'kiosk-status'] })
      toast.success(t('boardKiosk.tokenDeleted'))
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const data = q.data

  return (
    <Card className="admin-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Monitor className="size-5" aria-hidden />
          {t('settings.kioskCardTitle')}
        </CardTitle>
        <CardDescription>
          <Trans t={t} i18nKey="settings.kioskCardDesc" components={{ code: <code className="text-xs" /> }} />
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {q.isLoading ? (
          <p className="text-caption">{t('shared.loading')}</p>
        ) : data ? (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <Label className="flex items-center gap-2 text-body-sm">
                <input
                  type="checkbox"
                  className="size-4 rounded border-app"
                  checked={data.enabled}
                  disabled={!canWrite || patchMut.isPending}
                  onChange={(e) => patchMut.mutate({ enabled: e.target.checked })}
                />
                {t('settings.kioskEnable')}
              </Label>
              <span className="text-caption">
                {data.hasToken ? t('settings.kioskHasToken') : t('settings.kioskNoToken')}
              </span>
            </div>
            {canWrite ? (
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="default"
                  disabled={rotateMut.isPending}
                  onClick={() => rotateMut.mutate()}
                >
                  <RefreshCw className="mr-2 size-4" aria-hidden />
                  {data.hasToken ? t('settings.kioskRotateToken') : t('settings.kioskCreateToken')}
                </Button>
                {data.hasToken ? (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={clearMut.isPending}
                    onClick={() => setDeleteOpen(true)}
                  >
                    <Trash2 className="mr-2 size-4" aria-hidden />
                    {t('settings.kioskDeleteToken')}
                  </Button>
                ) : null}
              </div>
            ) : null}
            {lastUrl ? (
              <div className="admin-callout admin-callout--amber">
                <p className="font-medium">{t('settings.kioskUrlTitle')}</p>
                <code className="mt-2 block break-all text-xs">{lastUrl}</code>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="mt-2"
                  onClick={() => {
                    void navigator.clipboard.writeText(lastUrl)
                    toast.success(t('boardKiosk.urlCopied'))
                  }}
                >
                  <Copy className="mr-1 size-3.5" aria-hidden />
                  {t('settings.kioskCopy')}
                </Button>
              </div>
            ) : data.hasToken ? (
              <p className="text-xs text-app-muted">{t('settings.kioskHasTokenHint')}</p>
            ) : null}
          </>
        ) : null}
      </CardContent>

      <AlertDialog
        open={deleteOpen}
        onOpenChange={(open) => {
          if (!open && !clearMut.isPending) setDeleteOpen(false)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('settings.kioskDeleteToken')}</AlertDialogTitle>
            <AlertDialogDescription>{t('settings.kioskDeleteConfirm')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={clearMut.isPending}>{tc('actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={clearMut.isPending}
              onClick={(e) => {
                e.preventDefault()
                clearMut.mutate()
              }}
            >
              {t('settings.kioskDeleteToken')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}

