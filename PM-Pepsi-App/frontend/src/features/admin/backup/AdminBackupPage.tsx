import type { BackupHistoryItem, BackupListResponse, BackupScheduleResponse } from '@/api/schemas'
import { hintsFromT } from '@/lib/i18n-hints'
import { AdminAccessDenied } from '@/components/admin/AdminAccessDenied'
import { AdminPageRoot } from '@/components/admin/AdminPageRoot'
import { AdminPageShell } from '@/components/admin/AdminPageShell'
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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CronInput } from './CronInput'
import { EmptyState } from '@/components/ui/empty-state'
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
  deleteBackup,
  downloadBackup,
  fetchBackupList,
  fetchBackupSchedule,
  formatBytes,
  patchBackupSchedule,
  restoreBackupFromHistory,
  restoreBackupUpload,
  startBackupNow,
} from '@/lib/admin-backup-api'
import { idbGet, idbSet } from '@/lib/idb-cache'
import { usePublicSettings } from '@/providers/SettingsProvider'
import { usePermission } from '@/lib/use-permission'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { AlertCircle, DatabaseBackup, Download, Loader2, RefreshCcw, RotateCcw, Save, Trash2, Upload } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { toast } from 'sonner'

const BACKUP_CACHE_TTL_MS = 10 * 60 * 1000
const BACKUP_SCHEDULE_CACHE_KEY = 'admin.backup.schedule.v1'
const BACKUP_LIST_CACHE_KEY = 'admin.backup.list.v1'

function statusBadge(status: BackupHistoryItem['status'], t: (key: string) => string) {
  if (status === 'success') return <Badge className="app-tone-success-fill">{t('backup.statusSuccess')}</Badge>
  if (status === 'failed') return <Badge variant="destructive">{t('backup.statusFailed')}</Badge>
  if (status === 'running') return <Badge variant="secondary">{t('backup.statusRunning')}</Badge>
  return <Badge variant="outline">{status}</Badge>
}

export function AdminBackupPage() {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const qc = useQueryClient()
  const canRead = usePermission('admin.backup.read')
  const canWrite = usePermission('admin.backup.write')
  const canDelete = usePermission('admin.backup.delete')
  const canRestore = usePermission('admin.backup.restore')
  const { settings: publicSettings, refetch: refetchPublicSettings } = usePublicSettings()
  const idbCacheEnabled = publicSettings?.featureIndexeddbOffline === true

  const scheduleQ = useQuery({
    queryKey: ['admin', 'backup', 'schedule'],
    queryFn: fetchBackupSchedule,
    enabled: canRead,
    placeholderData: keepPreviousData,
  })

  const listQ = useQuery({
    queryKey: ['admin', 'backup', 'list'],
    queryFn: () => fetchBackupList(0, 50),
    enabled: canRead,
    placeholderData: keepPreviousData,
    refetchInterval: (q) =>
      q.state.data?.items.some((i) => i.status === 'running') ? 3000 : false,
  })

  const [cron, setCron] = useState('0 2 * * *')
  const [retention, setRetention] = useState(30)
  const [targetDir, setTargetDir] = useState('D:/PM-Pepsi-App/backup')
  const [restoreFile, setRestoreFile] = useState<File | null>(null)
  const [restorePhrase, setRestorePhrase] = useState('')
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false)
  const [restoreUploadOpen, setRestoreUploadOpen] = useState(false)
  const [restoreTargetId, setRestoreTargetId] = useState<number | null>(null)
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null)
  const [cachedScheduleLoaded, setCachedScheduleLoaded] = useState(false)
  const [cachedListLoaded, setCachedListLoaded] = useState(false)
  const [cachedList, setCachedList] = useState<BackupListResponse | null>(null)

  useEffect(() => {
    if (scheduleQ.data) {
      setCron(scheduleQ.data.scheduleCron)
      setRetention(scheduleQ.data.retentionDays)
      setTargetDir(scheduleQ.data.targetDir)
      if (idbCacheEnabled) {
        void idbSet(BACKUP_SCHEDULE_CACHE_KEY, scheduleQ.data, BACKUP_CACHE_TTL_MS)
      }
    }
  }, [scheduleQ.data, idbCacheEnabled])

  useEffect(() => {
    if (!idbCacheEnabled) return
    if (cachedScheduleLoaded || scheduleQ.data || !canRead) return
    setCachedScheduleLoaded(true)
    void (async () => {
      const cached = await idbGet<BackupScheduleResponse>(BACKUP_SCHEDULE_CACHE_KEY)
      if (!cached) return
      setCron(cached.scheduleCron)
      setRetention(cached.retentionDays)
      setTargetDir(cached.targetDir)
    })()
  }, [cachedScheduleLoaded, scheduleQ.data, canRead, idbCacheEnabled])

  useEffect(() => {
    if (!idbCacheEnabled) {
      setCachedList(null)
      return
    }
    if (listQ.data && canRead) {
      void idbSet(BACKUP_LIST_CACHE_KEY, listQ.data, BACKUP_CACHE_TTL_MS)
    }
  }, [listQ.data, canRead, idbCacheEnabled])

  useEffect(() => {
    if (!idbCacheEnabled) return
    if (cachedListLoaded || listQ.data || !canRead) return
    setCachedListLoaded(true)
    void (async () => {
      const cached = await idbGet<BackupListResponse>(BACKUP_LIST_CACHE_KEY)
      if (!cached) return
      setCachedList(cached)
    })()
  }, [cachedListLoaded, listQ.data, canRead, idbCacheEnabled])

  const listData = listQ.data ?? cachedList
  const showingCache = !listQ.data && Boolean(cachedList)

  const saveScheduleMut = useMutation({
    mutationFn: () =>
      patchBackupSchedule({
        scheduleCron: cron,
        retentionDays: retention,
        targetDir,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'backup'] })
      toast.success(t('backup.saved'))
    },
    onError: (e: Error) => toast.error(e.message || t('backup.saveFailed')),
  })

  const backupMut = useMutation({
    mutationFn: startBackupNow,
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: ['admin', 'backup'] })
      if (data.item.status === 'success') {
        toast.success(t('backup.backupOk'))
      } else {
        toast.error(data.item.errorText || t('backup.backupFailed'))
      }
    },
    onError: (e: Error) => toast.error(e.message || t('backup.startFailed')),
  })

  const deleteMut = useMutation({
    mutationFn: deleteBackup,
    onSuccess: () => {
      setDeleteTargetId(null)
      void qc.invalidateQueries({ queryKey: ['admin', 'backup'] })
      toast.success(t('backup.deleted'))
    },
    onError: (e: Error) => toast.error(e.message || t('backup.deleteFailed')),
  })

  const restoreUploadMut = useMutation({
    mutationFn: () => {
      if (!restoreFile) throw new Error(t('backup.selectSqlGz'))
      return restoreBackupUpload(restoreFile)
    },
    onSuccess: (data) => {
      setRestoreUploadOpen(false)
      void qc.invalidateQueries({ queryKey: ['admin', 'backup'] })
      void qc.invalidateQueries({ queryKey: ['settings', 'public'] })
      refetchPublicSettings()
      setRestoreFile(null)
      setRestorePhrase('')
      toast.success(
        t('backup.restoreOkSeconds', { seconds: (data.durationMs / 1000).toFixed(1) }),
      )
    },
    onError: (e: Error) => toast.error(e.message || t('backup.restoreFailed')),
  })

  const restoreHistoryMut = useMutation({
    mutationFn: (id: number) => restoreBackupFromHistory(id),
    onSuccess: (data) => {
      setRestoreDialogOpen(false)
      setRestoreTargetId(null)
      setRestorePhrase('')
      void qc.invalidateQueries({ queryKey: ['settings', 'public'] })
      refetchPublicSettings()
      toast.success(t('backup.restoreFromOk', { id: data.backupId }))
    },
    onError: (e: Error) => toast.error(e.message || t('backup.restoreFailed')),
  })

  if (!canRead) {
    return (
      <AdminPageRoot tourTarget="admin-backup">
        <AdminAccessDenied permission="admin.backup.read" />
      </AdminPageRoot>
    )
  }

  const pgOk = scheduleQ.data?.pgDumpAvailable ?? false
  const psqlOk = scheduleQ.data?.psqlAvailable ?? false
  const last = scheduleQ.data?.lastSuccess
  const restoreReady = restorePhrase === 'RESTORE'

  const refetchAll = () => {
    void scheduleQ.refetch()
    void listQ.refetch()
  }

  return (
    <AdminPageShell
      tourTarget="admin-backup"
      title={t('backup.title')}
      description={t('backup.description')}
      hints={hintsFromT(t, 'backup.hints')}
      headerActions={
        <>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="admin-toolbar-btn"
            onClick={refetchAll}
            disabled={scheduleQ.isFetching || listQ.isFetching}
          >
            <RefreshCcw
              className={`mr-1 size-3.5 ${scheduleQ.isFetching || listQ.isFetching ? 'animate-spin' : ''}`}
              aria-hidden
            />{t('shared.refresh')}</Button>
          {canWrite ? (
            <Button
              type="button"
              className="admin-toolbar-btn"
              disabled={!pgOk || backupMut.isPending}
              onClick={() => backupMut.mutate()}
            >
              {backupMut.isPending ? (
                <Loader2 className="mr-1 size-4 animate-spin" />
              ) : (
                <DatabaseBackup className="mr-1 size-4" />
              )}
              {t('backup.backupNow')}
            </Button>
          ) : null}
        </>
      }
    >
        <Card className="admin-card">
          <CardHeader>
            <CardTitle className="text-base">{t('backup.pgToolsTitle')}</CardTitle>
            <CardDescription>{t('backup.pgToolsDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 text-body-sm sm:grid-cols-2">
            <div>
              <span className="font-medium text-app">pg_dump:</span>{' '}
              {pgOk ? (
                <Badge className="app-tone-success-fill ml-1">{t('backup.ready')}</Badge>
              ) : (
                <Badge variant="destructive" className="ml-1">
                  {t('backup.notFound')}
                </Badge>
              )}
              <code className="mt-1 block truncate font-mono text-xs text-app-muted">
                {scheduleQ.data?.pgDumpBin ?? 'pg_dump'}
              </code>
            </div>
            <div>
              <span className="font-medium text-app">psql:</span>{' '}
              {psqlOk ? (
                <Badge className="app-tone-success-fill ml-1">{t('backup.ready')}</Badge>
              ) : (
                <Badge variant="destructive" className="ml-1">
                  {t('backup.notFound')}
                </Badge>
              )}
              <code className="mt-1 block truncate font-mono text-xs text-app-muted">
                {scheduleQ.data?.psqlBin ?? 'psql'}
              </code>
            </div>
          </CardContent>
        </Card>

        {!pgOk ? (
          <Card className="admin-callout admin-callout--amber border shadow-none">
            <CardContent className="pt-6 text-body-sm">
              <Trans t={t} i18nKey="backup.pgToolsHint" components={{ code: <code /> }} />
            </CardContent>
          </Card>
        ) : null}

        {canRestore ? (
          <Card className="app-tone-danger-callout border">
            <CardHeader>
              <CardTitle className="text-base">{t('backup.restoreCardTitle')}</CardTitle>
              <CardDescription className="opacity-90">
                <Trans t={t} i18nKey="backup.restoreCardDesc" components={{ code: <code /> }} />
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="restore-file">{t('backup.restoreFileLabel')}</Label>
                <Input
                  id="restore-file"
                  type="file"
                  accept=".sql.gz,.gz"
                  disabled={!psqlOk || restoreUploadMut.isPending}
                  onChange={(e) => setRestoreFile(e.target.files?.[0] ?? null)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="restore-phrase">{t('backup.restorePhraseLabel')}</Label>
                <Input
                  id="restore-phrase"
                  value={restorePhrase}
                  autoComplete="off"
                  disabled={!psqlOk || restoreUploadMut.isPending}
                  onChange={(e) => setRestorePhrase(e.target.value)}
                />
              </div>
              <Button
                type="button"
                variant="destructive"
                disabled={
                  !psqlOk || !restoreFile || !restoreReady || restoreUploadMut.isPending
                }
                onClick={() => setRestoreUploadOpen(true)}
              >
                {restoreUploadMut.isPending ? (
                  <Loader2 className="mr-1 size-4 animate-spin" />
                ) : (
                  <Upload className="mr-1 size-4" />
                )}
                {t('backup.restoreFromFile')}
              </Button>
            </CardContent>
          </Card>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="admin-card">
            <CardHeader>
              <CardTitle className="text-base">{t('backup.statusCardTitle')}</CardTitle>
              <CardDescription>{t('backup.statusCardDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-body-sm">
              {scheduleQ.isLoading ? <Skeleton className="h-16" /> : null}
              {last ? (
                <>
                  <p>
                    <span className="text-app-muted">{t('backup.timeLabel')}</span>{' '}
                    {new Date(last.finishedAt ?? last.startedAt).toLocaleString('th-TH')}
                  </p>
                  <p>
                    <span className="text-app-muted">{t('backup.sizeLabel')}</span>{' '}
                    {formatBytes(last.sizeBytes)}
                  </p>
                  {last.sha256 ? (
                    <p className="font-mono text-xs text-app-muted" title={last.sha256}>
                      SHA256: {last.sha256.slice(0, 16)}…
                    </p>
                  ) : null}
                  <p className="truncate font-mono text-xs text-app-muted">{last.filePath}</p>
                </>
              ) : (
                <p className="text-app-muted">{t('backup.noSuccessYet')}</p>
              )}
            </CardContent>
          </Card>

          <Card className="admin-card">
            <CardHeader>
              <CardTitle className="text-base">{t('backup.scheduleCardTitle')}</CardTitle>
              <CardDescription>{t('backup.scheduleCardDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <CronInput
                value={cron}
                disabled={!canWrite}
                onChange={setCron}
                hint={t('backup.cronHint')}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="backup-retention">{t('backup.retentionDays')}</Label>
                  <Input
                    id="backup-retention"
                    type="number"
                    min={1}
                    max={365}
                    value={retention}
                    disabled={!canWrite}
                    onChange={(e) => setRetention(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor="backup-dir">{t('backup.targetFolder')}</Label>
                  <Input
                    id="backup-dir"
                    value={targetDir}
                    disabled={!canWrite}
                    onChange={(e) => setTargetDir(e.target.value)}
                  />
                </div>
              </div>
              {canWrite ? (
                <Button
                  type="button"
                  size="sm"
                  disabled={saveScheduleMut.isPending}
                  onClick={() => saveScheduleMut.mutate()}
                >
                  <Save className="mr-1 size-4" />
                  {t('backup.saveSettings')}
                </Button>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <Card className="admin-card">
          <CardHeader>
            <CardTitle className="text-base">{t('backup.historyTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {listQ.isLoading && !listData ? (
              <Skeleton className="m-4 h-40" />
            ) : listQ.isError && !listData ? (
              <EmptyState
                icon={AlertCircle}
                className="m-4"
                title={t('backup.historyLoadFailed')}
                description={(listQ.error as Error).message}
                action={{ label: tc('actions.retry'), onClick: () => void listQ.refetch() }}
              />
            ) : (
              <>
                {showingCache ? (
                  <div className="m-4 rounded-card border border-app bg-app-subtle px-3 py-2 text-xs text-app-muted">
                    {t('backup.showingCache')}
                  </div>
                ) : null}
                <div className="app-table-shell overflow-x-auto">
                <Table embedded stickyHeader zebra>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Trigger</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>{t('backup.colSize')}</TableHead>
                    <TableHead>SHA256</TableHead>
                    <TableHead>{t('backup.colStarted')}</TableHead>
                    <TableHead className="text-right">{t('backup.historyActions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(listData?.items ?? []).map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.id}</TableCell>
                      <TableCell>{row.trigger}</TableCell>
                      <TableCell>{statusBadge(row.status, t)}</TableCell>
                      <TableCell>{formatBytes(row.sizeBytes)}</TableCell>
                      <TableCell className="max-w-[100px] truncate font-mono text-xs" title={row.sha256 ?? ''}>
                        {row.sha256 ? `${row.sha256.slice(0, 10)}…` : '—'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs">
                        {new Date(row.startedAt).toLocaleString('th-TH')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {row.status === 'success' && row.filePath ? (
                            <>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                aria-label={t('backup.downloadAria')}
                                onClick={() => {
                                  const name =
                                    row.filePath?.split(/[/\\]/).pop() ??
                                    `backup-${row.id}.sql.gz`
                                  void downloadBackup(row.id, name)
                                }}
                              >
                                <Download className="size-4" />
                              </Button>
                              {canRestore && psqlOk ? (
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  aria-label={t('backup.restoreAria')}
                                  disabled={restoreHistoryMut.isPending}
                                  onClick={() => {
                                    setRestoreTargetId(row.id)
                                    setRestorePhrase('')
                                    setRestoreDialogOpen(true)
                                  }}
                                >
                                  <RotateCcw className="size-4 text-form-error" />
                                </Button>
                              ) : null}
                            </>
                          ) : null}
                          {canDelete && row.status !== 'running' ? (
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              aria-label={t('backup.deleteAria')}
                              disabled={deleteMut.isPending}
                              onClick={() => setDeleteTargetId(row.id)}
                            >
                              <Trash2 className="size-4 text-form-error" />
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>

      <AlertDialog
        open={restoreUploadOpen}
        onOpenChange={(open) => {
          if (!open && !restoreUploadMut.isPending) setRestoreUploadOpen(false)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('backup.restoreFromFile')}</AlertDialogTitle>
            <AlertDialogDescription>{t('backup.restoreOverwriteWarn')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={restoreUploadMut.isPending}>
              {tc('actions.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={restoreUploadMut.isPending || !restoreFile || !restoreReady}
              onClick={(e) => {
                e.preventDefault()
                restoreUploadMut.mutate()
              }}
            >
              {restoreUploadMut.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
              ) : (
                <Upload className="mr-2 size-4" aria-hidden />
              )}
              {t('backup.restoreFromFile')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={deleteTargetId != null}
        onOpenChange={(open) => {
          if (!open && !deleteMut.isPending) setDeleteTargetId(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('backup.delete')}</AlertDialogTitle>
            <AlertDialogDescription>{t('backup.deleteConfirm')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMut.isPending}>{tc('actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleteMut.isPending || deleteTargetId == null}
              onClick={(e) => {
                e.preventDefault()
                if (deleteTargetId == null) return
                deleteMut.mutate(deleteTargetId)
              }}
            >
              {deleteMut.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
              ) : (
                <Trash2 className="mr-2 size-4" aria-hidden />
              )}
              {t('backup.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t('backup.restoreHistoryTitle', { id: restoreTargetId })}
            </DialogTitle>
            <DialogDescription>{t('backup.restoreHistoryDesc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="restore-history-phrase">{t('backup.confirmLabel')}</Label>
            <Input
              id="restore-history-phrase"
              value={restorePhrase}
              autoComplete="off"
              onChange={(e) => setRestorePhrase(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRestoreDialogOpen(false)}>
              {tc('actions.cancel')}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={
                !restoreReady ||
                restoreTargetId == null ||
                restoreHistoryMut.isPending
              }
              onClick={() => {
                if (restoreTargetId == null) return
                restoreHistoryMut.mutate(restoreTargetId)
              }}
            >
              {restoreHistoryMut.isPending ? (
                <Loader2 className="mr-1 size-4 animate-spin" />
              ) : null}
              {t('backup.restoreConfirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPageShell>
  )
}
