import type { AdminHealthResponse } from '@/api/schemas'
import { hintsFromT } from '@/lib/i18n-hints'
import { ConfirmPhraseDialog } from '@/components/admin/ConfirmPhraseDialog'
import { AdminAccessDenied } from '@/components/admin/AdminAccessDenied'
import { AdminPageRoot } from '@/components/admin/AdminPageRoot'
import { AdminPageShell } from '@/components/admin/AdminPageShell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  fetchAdminHealth,
  fetchHealthErrorLogs,
  fetchHealthSlowApis,
  formatBytes,
  formatUptime,
  HEALTH_POLL_MS,
  runHealthMigrate,
} from '@/lib/admin-health-api'
import { usePermission } from '@/lib/use-permission'
import { usePublicSettings } from '@/providers/SettingsProvider'
import { cn } from '@/lib/utils'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Database,
  HardDrive,
  Loader2,
  Play,
  RefreshCcw,
  Server,
  Timer,
} from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

type HealthStatus = AdminHealthResponse['db']['status']

function statusBadge(status: HealthStatus, t: (key: string) => string) {
  if (status === 'ok') return <Badge className="app-tone-success-fill">{t('health.statusOk')}</Badge>
  if (status === 'warning') return <Badge className="app-tone-warning-fill">{t('health.statusWarning')}</Badge>
  if (status === 'error') return <Badge variant="destructive">{t('health.statusError')}</Badge>
  return <Badge variant="secondary">{t('health.statusUnknown')}</Badge>
}

function StatusCard({
  title,
  description,
  status,
  icon: Icon,
  children,
  t,
}: {
  title: string
  description: string
  status: HealthStatus
  icon: typeof Database
  children: React.ReactNode
  t: (key: string) => string
}) {
  const tone =
    status === 'error' ? 'danger' : status === 'warning' ? 'warning' : status === 'ok' ? 'success' : 'info'

  return (
    <Card data-tone={tone} className={cn('admin-card admin-kpi-card')}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <Icon className="size-5 text-app-muted" />
            <div>
              <CardTitle className="text-base">{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </div>
          {statusBadge(status, t)}
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-body-sm text-app">{children}</CardContent>
    </Card>
  )
}

function OverviewTab({
  data,
  diskPath,
  setDiskPath,
  setAppliedDisk,
  canMigrate,
  maintenanceOn,
  onMigrateClick,
  migratePending,
  t,
}: {
  data: AdminHealthResponse
  diskPath: string
  setDiskPath: (v: string) => void
  setAppliedDisk: (v: string) => void
  canMigrate: boolean
  maintenanceOn: boolean
  onMigrateClick: () => void
  migratePending: boolean
  t: (key: string, opts?: Record<string, unknown>) => string
}) {
  return (
    <>
      <Card className="admin-card">
        <CardContent className="flex flex-wrap items-end gap-3 pt-6">
          <div className="min-w-[200px] flex-1 space-y-1">
            <Label htmlFor="disk-path">{t('health.diskPathLabel')}</Label>
            <Input
              id="disk-path"
              value={diskPath}
              onChange={(e) => setDiskPath(e.target.value)}
              placeholder="D:\"
            />
          </div>
          <button
            type="button"
            className="inline-flex h-10 items-center justify-center rounded-button bg-[var(--admin-primary)] px-4 text-body-sm font-medium text-white hover:opacity-90"
            onClick={() => setAppliedDisk(diskPath)}
          >
            {t('health.diskPathApply')}
          </button>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <StatusCard
          title={t('health.dbTitle')}
          description={t('health.dbDescription')}
          status={data.db.status}
          icon={Database}
          t={t}
        >
          <p>
            {t('health.dbLatency')}:{' '}
            <span className="font-mono font-medium">
              {data.db.latencyMs != null ? `${data.db.latencyMs} ms` : '—'}
            </span>
          </p>
          <p>
            {t('health.dbPoolLine', {
              total: data.db.pool.total,
              idle: data.db.pool.idle,
              waiting: data.db.pool.waiting,
            })}
          </p>
          {data.db.message ? <p className="text-xs text-form-error">{data.db.message}</p> : null}
        </StatusCard>

        <StatusCard
          title={t('health.diskTitle')}
          description={data.disk.path}
          status={data.disk.status}
          icon={HardDrive}
          t={t}
        >
          <p>
            {t('health.diskUsedLabel')}{' '}
            <span className="font-medium">
              {formatBytes(data.disk.usedBytes)} (
              {data.disk.usedPercent != null ? `${data.disk.usedPercent}%` : '—'})
            </span>
          </p>
          <p>
            {t('health.diskFreeLabel')} {formatBytes(data.disk.freeBytes)}
          </p>
          <p>
            {t('health.diskTotalLabel')} {formatBytes(data.disk.totalBytes)}
          </p>
          {data.disk.message ? (
            <p className="app-tone-warning-label text-xs">{data.disk.message}</p>
          ) : null}
        </StatusCard>

        <StatusCard
          title={t('health.apiTitle')}
          description={t('health.apiDescription', { service: data.service, version: data.version })}
          status={data.process.status}
          icon={Server}
          t={t}
        >
          <p>{data.process.platform}</p>
          <p>Node {data.process.nodeVersion}</p>
          <p>
            {t('health.uptime')}: {formatUptime(data.process.uptimeSec)}
          </p>
          <p>
            {t('health.memoryRss', {
              rss: data.process.memoryRssMb,
              heap: data.process.memoryHeapUsedMb,
            })}
          </p>
        </StatusCard>

        <StatusCard
          title={t('health.migrationTitle')}
          description={t('health.migrationDescription')}
          status={data.migration.status}
          icon={Activity}
          t={t}
        >
          <p>
            {t('health.migrationFilesInFolder')}{' '}
            <span className="font-medium">{data.migration.totalFiles}</span>
            {data.migration.migrationsDir ? (
              <span className="mt-1 block truncate font-mono text-xs text-app-muted">
                {data.migration.migrationsDir}
              </span>
            ) : null}
          </p>
          <p>
            {t('health.migrationProbed', {
              applied: data.migration.appliedCount,
              pending: data.migration.pendingCount,
              unverified: data.migration.unverifiedCount,
            })}
          </p>
          <p>
            {t('health.migrationLatestReady')}{' '}
            {data.migration.latestAppliedId ? (
              <span className="font-mono font-medium">
                {data.migration.latestAppliedId} ({data.migration.latestFile})
              </span>
            ) : (
              '—'
            )}
          </p>
          {canMigrate ? (
            <div className="pt-2">
              <Button
                type="button"
                size="sm"
                disabled={
                  migratePending ||
                  data.migration.pendingCount === 0 ||
                  !maintenanceOn
                }
                onClick={onMigrateClick}
              >
                {migratePending ? (
                  <Loader2 className="mr-1 size-4 animate-spin" />
                ) : (
                  <Play className="mr-1 size-4" />
                )}
                {t('health.migrationRunPending')}
              </Button>
              {!maintenanceOn ? (
                <p className="app-tone-warning-label mt-1 text-xs">
                  {t('health.migrationMaintenanceRequired')}{' '}
                  <Link to="/admin/settings" className="underline">
                    {t('health.settingsLink')}
                  </Link>{' '}
                  {t('health.migrationOr')}{' '}
                  <Link to="/admin/announcements" className="underline">
                    {t('health.announcementsLink')}
                  </Link>
                </p>
              ) : null}
            </div>
          ) : null}
        </StatusCard>
      </div>

      <Card className="admin-card">
        <CardHeader>
          <CardTitle className="text-base">{t('health.migrationListTitle')}</CardTitle>
          <CardDescription>{t('health.migrationListDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="overflow-hidden rounded-card border border-app">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-14">{t('health.migrationTableNum')}</TableHead>
                <TableHead>{t('health.migrationTableLabel')}</TableHead>
                <TableHead>{t('health.migrationTableFile')}</TableHead>
                <TableHead className="text-right">{t('health.migrationTableStatus')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.migration.probes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-caption">
                    {t('health.migrationFolderMissing')}
                  </TableCell>
                </TableRow>
              ) : (
                data.migration.probes.map((row) => (
                  <TableRow key={row.file}>
                    <TableCell className="font-mono text-xs">{row.id}</TableCell>
                    <TableCell className="text-body-sm">{row.label}</TableCell>
                    <TableCell className="max-w-[240px] truncate font-mono text-xs">
                      {row.file}
                    </TableCell>
                    <TableCell className="text-right">
                      {row.status === 'applied' ? (
                        <Badge className="app-tone-success-fill">{t('health.badgeApplied')}</Badge>
                      ) : (
                        <Badge variant="destructive">{t('health.badgePending')}</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  )
}

export function AdminHealthPage() {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const canRead = usePermission('admin.health.read')
  const canMigrate = usePermission('admin.health.migrate')
  const { settings: publicSettings } = usePublicSettings()
  const maintenanceOn = publicSettings?.maintenance?.enabled === true
  const queryClient = useQueryClient()

  const [diskPath, setDiskPath] = useState('D:\\')
  const [appliedDisk, setAppliedDisk] = useState('D:\\')
  const [migrateOpen, setMigrateOpen] = useState(false)
  const [tab, setTab] = useState('overview')

  const q = useQuery({
    queryKey: ['admin', 'health', appliedDisk],
    queryFn: () => fetchAdminHealth(appliedDisk),
    enabled: canRead,
    refetchInterval: HEALTH_POLL_MS,
    placeholderData: keepPreviousData,
  })

  const errorsQ = useQuery({
    queryKey: ['admin', 'health', 'errors'],
    queryFn: () => fetchHealthErrorLogs(100),
    enabled: canRead && tab === 'errors',
    refetchInterval: HEALTH_POLL_MS,
    placeholderData: keepPreviousData,
  })

  const slowQ = useQuery({
    queryKey: ['admin', 'health', 'slow-apis'],
    queryFn: () => fetchHealthSlowApis(1000),
    enabled: canRead && tab === 'slow',
    refetchInterval: HEALTH_POLL_MS,
    placeholderData: keepPreviousData,
  })

  const migrateMut = useMutation({
    mutationFn: runHealthMigrate,
    onSuccess: (result) => {
      setMigrateOpen(false)
      void queryClient.invalidateQueries({ queryKey: ['admin', 'health'] })
      if (result.stoppedAt) {
        toast.error(
          t('health.migrateStopped', {
            file: result.stoppedAt.file,
            message: result.stoppedAt.message,
          }),
        )
      } else {
        toast.success(t('health.migrateSuccess', { count: result.applied.length }))
      }
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })

  if (!canRead) {
    return (
      <AdminPageRoot tourTarget="admin-health">
        <AdminAccessDenied permission="admin.health.read" />
      </AdminPageRoot>
    )
  }

  const data = q.data

  const refetchActive = () => {
    void q.refetch()
    if (tab === 'errors') void errorsQ.refetch()
    if (tab === 'slow') void slowQ.refetch()
  }

  return (
    <AdminPageShell
      tourTarget="admin-health"
      title={t('health.title')}
      description={t('health.description')}
      hints={hintsFromT(t, 'health.hints')}
      headerActions={
        <>
          {data ? (
            <Badge variant="outline" className="tabular-nums">
              {t('health.updatedAt', {
                time: new Date(data.time).toLocaleTimeString(),
              })}
            </Badge>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="admin-toolbar-btn"
            onClick={refetchActive}
            disabled={q.isFetching || errorsQ.isFetching || slowQ.isFetching}
          >
            <RefreshCcw
              className={`mr-1 size-3.5 ${q.isFetching || errorsQ.isFetching || slowQ.isFetching ? 'animate-spin' : ''}`}
              aria-hidden
            />{t('shared.refresh')}</Button>
        </>
      }
    >
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="overview">{t('health.tabOverview')}</TabsTrigger>
            <TabsTrigger value="errors">{t('health.tabErrors')}</TabsTrigger>
            <TabsTrigger value="slow">{t('health.tabSlow')}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4 space-y-6">
            {q.isLoading && !data ? (
              <div className="grid gap-4 md:grid-cols-2">
                <Skeleton className="h-40 rounded-card" />
                <Skeleton className="h-40 rounded-card" />
                <Skeleton className="h-40 rounded-card md:col-span-2" />
              </div>
            ) : q.isError && !data ? (
              <EmptyState
                icon={AlertCircle}
                title={t('health.loadFailed')}
                description={(q.error as Error).message}
                action={{ label: tc('actions.retry'), onClick: () => void q.refetch() }}
              />
            ) : data ? (
              <OverviewTab
                data={data}
                diskPath={diskPath}
                setDiskPath={setDiskPath}
                setAppliedDisk={setAppliedDisk}
                canMigrate={canMigrate}
                maintenanceOn={maintenanceOn}
                migratePending={migrateMut.isPending}
                onMigrateClick={() => setMigrateOpen(true)}
                t={t}
              />
            ) : null}
          </TabsContent>

          <TabsContent value="errors" className="mt-4">
            <Card className="admin-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertTriangle className="app-tone-warning-icon size-4" />
                  {t('health.errorLogTitle')}
                </CardTitle>
                <CardDescription>{t('health.errorLogDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {errorsQ.isLoading && !errorsQ.data ? (
                  <div className="p-6">
                    <Skeleton className="h-32 w-full" />
                  </div>
                ) : errorsQ.isError ? (
                  <EmptyState
                    icon={AlertCircle}
                    className="m-4"
                    title={t('health.errorLogLoadFailed')}
                    description={(errorsQ.error as Error).message}
                    action={{ label: tc('actions.retry'), onClick: () => void errorsQ.refetch() }}
                  />
                ) : (
                  <div className="app-table-shell overflow-x-auto">
                  <Table embedded stickyHeader zebra>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('health.colTime')}</TableHead>
                        <TableHead>{t('audit.action')}</TableHead>
                        <TableHead>{t('audit.resource')}</TableHead>
                        <TableHead>{t('health.colMessage')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(errorsQ.data ?? []).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="py-8 text-center text-caption">
                            {t('health.noAuditErrors')}
                          </TableCell>
                        </TableRow>
                      ) : (
                        (errorsQ.data ?? []).map((row) => (
                          <TableRow key={row.id}>
                            <TableCell className="whitespace-nowrap text-xs tabular-nums">
                              {new Date(row.createdAt).toLocaleString('th-TH')}
                            </TableCell>
                            <TableCell className="font-mono text-xs">{row.action}</TableCell>
                            <TableCell className="text-xs">
                              {row.resource ?? '—'}
                              {row.resourceId ? ` / ${row.resourceId}` : ''}
                            </TableCell>
                            <TableCell className="max-w-[320px] truncate text-xs" title={row.message ?? ''}>
                              {row.message ?? '—'}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="slow" className="mt-4">
            <Card className="admin-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Timer className="size-4 text-app-muted" />
                  {t('health.slowApiTitle')}
                </CardTitle>
                <CardDescription>{t('health.slowApiDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {slowQ.isLoading && !slowQ.data ? (
                  <div className="p-6">
                    <Skeleton className="h-32 w-full" />
                  </div>
                ) : slowQ.isError ? (
                  <EmptyState
                    icon={AlertCircle}
                    className="m-4"
                    title={t('health.slowLoadFailed')}
                    description={(slowQ.error as Error).message}
                    action={{ label: tc('actions.retry'), onClick: () => void slowQ.refetch() }}
                  />
                ) : (
                  <div className="app-table-shell overflow-x-auto">
                  <Table embedded stickyHeader zebra>
                    <TableHeader>
                      <TableRow>
                        <TableHead>route</TableHead>
                        <TableHead className="text-right">samples</TableHead>
                        <TableHead className="text-right">p50</TableHead>
                        <TableHead className="text-right">p95</TableHead>
                        <TableHead className="text-right">max</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(slowQ.data?.items ?? []).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="py-8 text-center text-caption">
                            {t('health.slowApiEmpty', {
                              ms: slowQ.data?.thresholdMs ?? 1000,
                            })}
                          </TableCell>
                        </TableRow>
                      ) : (
                        (slowQ.data?.items ?? []).map((row) => (
                          <TableRow key={row.route}>
                            <TableCell className="font-mono text-xs">{row.route}</TableCell>
                            <TableCell className="text-right tabular-nums">{row.count}</TableCell>
                            <TableCell className="text-right tabular-nums">{row.p50Ms} ms</TableCell>
                            <TableCell className="app-tone-warning-strong text-right font-medium tabular-nums">
                              {row.p95Ms} ms
                            </TableCell>
                            <TableCell className="text-right tabular-nums">{row.maxMs} ms</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

      <ConfirmPhraseDialog
        open={migrateOpen}
        onOpenChange={setMigrateOpen}
        tone="danger"
        title={t('health.runPendingTitle')}
        description={t('health.runPendingDescription')}
        phrase="MIGRATE"
        phraseLabel={t('health.migratePhrase')}
        confirmLabel={t('health.migrateConfirm')}
        loading={migrateMut.isPending}
        onConfirm={() => migrateMut.mutate()}
      />
    </AdminPageShell>
  )
}
