import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ConfirmDeleteAlertDialog } from '@/components/ui/confirm-delete-alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  deletePersonnelClose,
  fetchPersonnelCloses,
  fetchWorkcenters,
  postPersonnelClose,
} from '@/lib/api-public'
import {
  formatPersonnelCloseDateTime,
  formatPersonnelCloseDuration,
  previewDurationMinutes,
  todayDdMmYyyy,
} from '@/lib/personnel-close-format'
import { cn } from '@/lib/utils'

type PersonnelClosePanelProps = {
  idiw37: number | null
  enabled?: boolean
  canWrite?: boolean
  closeBlockedMessage?: string | null
  selectedWkctr?: string
  onSelectWkctr?: (wkctr: string) => void
  onAppliedToSupervisor?: (row: {
    wkctr: string
    cstdate: number
    cendate: number
  }) => void
  onChanged?: () => void
}

export function PersonnelClosePanel({
  idiw37,
  enabled = true,
  canWrite = true,
  closeBlockedMessage = null,
  selectedWkctr: selectedWkctrProp,
  onSelectWkctr,
  onAppliedToSupervisor,
  onChanged,
}: PersonnelClosePanelProps) {
  const { t } = useTranslation('confirmation')
  const qc = useQueryClient()
  const [startD, setStartD] = useState(todayDdMmYyyy)
  const [endD, setEndD] = useState(todayDdMmYyyy)
  const [startT, setStartT] = useState('')
  const [endT, setEndT] = useState('')
  const [localWkctr, setLocalWkctr] = useState('')

  const selectedWkctr = selectedWkctrProp ?? localWkctr
  const setSelectedWkctr = (code: string) => {
    setLocalWkctr(code)
    onSelectWkctr?.(code)
  }

  const workcentersQ = useQuery({
    queryKey: ['workcenters', 'eng'],
    queryFn: fetchWorkcenters,
    enabled,
    retry: 0,
  })

  const personnelQ = useQuery({
    queryKey: ['confirmation', 'personnel-closes', idiw37],
    queryFn: () => fetchPersonnelCloses(idiw37!),
    enabled: enabled && typeof idiw37 === 'number',
    retry: 0,
  })

  const previewMin = useMemo(
    () => previewDurationMinutes(startD, startT, endD, endT),
    [startD, startT, endD, endT],
  )

  const addMut = useMutation({
    mutationFn: (wkctr: string) =>
      postPersonnelClose({
        idiw37: idiw37!,
        wkctr,
        startD,
        startT,
        endD,
        endT,
      }),
    onSuccess: async () => {
      toast.success(t('personnel.saveSuccess'))
      await qc.invalidateQueries({ queryKey: ['confirmation', 'personnel-closes', idiw37] })
      onChanged?.()
    },
    onError: (e: Error) => toast.error(e.message || t('personnel.saveFailed')),
  })

  const [deleteTarget, setDeleteTarget] = useState<number | null>(null)

  const delMut = useMutation({
    mutationFn: (idwrkclose: number) => deletePersonnelClose(idwrkclose),
    onSuccess: async () => {
      setDeleteTarget(null)
      await qc.invalidateQueries({ queryKey: ['confirmation', 'personnel-closes', idiw37] })
      onChanged?.()
    },
    onError: (e: Error) => toast.error(e.message || t('personnel.deleteFailed')),
  })

  const closedCodes = useMemo(
    () => new Set((personnelQ.data ?? []).map((p) => p.wkctr)),
    [personnelQ.data],
  )

  const canSubmit =
    canWrite &&
    !closeBlockedMessage &&
    typeof idiw37 === 'number' &&
    startD &&
    endD &&
    startT &&
    endT &&
    previewMin != null &&
    previewMin > 0

  return (
    <div className="space-y-4">
      <p className="text-body-sm font-medium text-app">{t('personnel.title')}</p>
      {closeBlockedMessage ? (
        <p className="app-tone-warning-callout rounded-card border px-3 py-2 text-xs">
          {closeBlockedMessage}
        </p>
      ) : null}

      <div className="app-card app-card-pad-compact">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <Label htmlFor="pers-start-d">{t('personnel.startDate')}</Label>
            <Input
              id="pers-start-d"
              value={startD}
              onChange={(e) => setStartD(e.target.value)}
              placeholder={t('personnel.datePlaceholder')}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="pers-start-t">{t('personnel.startTime')}</Label>
            <Input
              id="pers-start-t"
              value={startT}
              onChange={(e) => setStartT(e.target.value)}
              placeholder={t('personnel.timePlaceholder')}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="pers-end-d">{t('personnel.endDate')}</Label>
            <Input
              id="pers-end-d"
              value={endD}
              onChange={(e) => setEndD(e.target.value)}
              placeholder={t('personnel.datePlaceholder')}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="pers-end-t">{t('personnel.endTime')}</Label>
            <Input
              id="pers-end-t"
              value={endT}
              onChange={(e) => setEndT(e.target.value)}
              placeholder={t('personnel.timePlaceholder')}
            />
          </div>
        </div>
        {previewMin != null && previewMin > 0 ? (
          <p className="mt-2 text-xs text-app-muted">
            {t('personnel.durationPreview', {
              duration: formatPersonnelCloseDuration(previewMin),
            })}
          </p>
        ) : startT && endT ? (
          <p className="app-tone-warning-icon mt-2 text-xs">{t('personnel.invalidDateTime')}</p>
        ) : null}
      </div>

      <div className="app-card app-card-pad-compact">
        {workcentersQ.isLoading ? (
          <Skeleton className="h-24 w-full rounded-card" />
        ) : workcentersQ.isError ? (
          <p className="text-body-sm text-form-error">{(workcentersQ.error as Error).message}</p>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {(workcentersQ.data ?? []).map((wc) => {
              const isClosed = closedCodes.has(wc.wkctr)
              const isSelected = selectedWkctr === wc.wkctr
              return (
                <button
                  key={wc.wkctr}
                  type="button"
                  disabled={!canSubmit || addMut.isPending || isClosed}
                  title={isClosed ? t('personnel.alreadyRecorded') : wc.displayName}
                  onClick={() => {
                    if (typeof idiw37 !== 'number') {
                      toast.error(t('personnel.openWoFirst'))
                      return
                    }
                    if (closeBlockedMessage) {
                      toast.error(closeBlockedMessage)
                      return
                    }
                    setSelectedWkctr(wc.wkctr)
                    addMut.mutate(wc.wkctr)
                  }}
                  className={cn(
                    'rounded-card border px-2 py-2 text-left text-xs transition-colors',
                    'app-tone-info-progress border-transparent hover:opacity-90',
                    'disabled:cursor-not-allowed disabled:opacity-45',
                    isSelected &&
                      'ring-2 ring-[var(--app-surface)] ring-offset-2 ring-offset-[color-mix(in_srgb,var(--status-info)_70%,var(--app-bg))]',
                    isClosed && 'opacity-60',
                  )}
                >
                  <span className="block font-semibold tabular-nums">{wc.wkctr}</span>
                  {wc.displayName ? (
                    <span className="mt-0.5 block line-clamp-2 text-[10px] leading-tight opacity-95">
                      {wc.displayName}
                    </span>
                  ) : null}
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div className="overflow-hidden app-table-shell">
        <Table embedded stickyHeader zebra>
          <TableHeader>
            <TableRow>
              <TableHead>{t('personnel.colCode')}</TableHead>
              <TableHead>{t('personnel.colName')}</TableHead>
              <TableHead>{t('personnel.colStart')}</TableHead>
              <TableHead>{t('personnel.colEnd')}</TableHead>
              <TableHead className="text-right">{t('personnel.colDuration')}</TableHead>
              <TableHead className="w-16 text-right">{t('personnel.colDel')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {typeof idiw37 !== 'number' ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-caption">
                  {t('personnel.openWoBeforeTable')}
                </TableCell>
              </TableRow>
            ) : personnelQ.isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8">
                  <Skeleton className="h-12 w-full rounded-card" />
                </TableCell>
              </TableRow>
            ) : personnelQ.isError ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-body-sm text-form-error">
                  {(personnelQ.error as Error).message}
                </TableCell>
              </TableRow>
            ) : !personnelQ.data?.length ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-caption">
                  {t('personnel.noRecords')}
                </TableCell>
              </TableRow>
            ) : (
              personnelQ.data.map((p) => (
                <TableRow key={p.idwrkclose}>
                  <TableCell className="tabular-nums font-medium">{p.wkctr}</TableCell>
                  <TableCell>{p.displayName || '—'}</TableCell>
                  <TableCell className="tabular-nums">{formatPersonnelCloseDateTime(p.cstdate)}</TableCell>
                  <TableCell className="tabular-nums">{formatPersonnelCloseDateTime(p.cendate)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatPersonnelCloseDuration(p.wktimewk, p.wkunit)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {onAppliedToSupervisor ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() =>
                            onAppliedToSupervisor({
                              wkctr: p.wkctr,
                              cstdate: p.cstdate,
                              cendate: p.cendate,
                            })
                          }
                        >
                          {t('personnel.confirmClose')}
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        disabled={!canWrite || delMut.isPending}
                        onClick={() => setDeleteTarget(p.idwrkclose)}
                        aria-label={t('personnel.deleteAria')}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ConfirmDeleteAlertDialog
        open={deleteTarget != null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={t('personnel.deleteTitle')}
        description={t('personnel.deleteDescription')}
        loading={delMut.isPending}
        onConfirm={() => {
          if (deleteTarget != null) delMut.mutate(deleteTarget)
        }}
      />
    </div>
  )
}
