import { AdminAccessDenied } from '@/components/admin/AdminAccessDenied'
import { AdminPageRoot } from '@/components/admin/AdminPageRoot'
import { AdminKpiCard } from '@/components/admin/AdminKpiCard'
import { AdminKpiGrid } from '@/components/admin/AdminKpiGrid'
import { AdminPageShell } from '@/components/admin/AdminPageShell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { fetchAdminAbout } from '@/lib/admin-about-api'
import { formatBytes, formatUptime } from '@/lib/admin-health-api'
import { usePermission } from '@/lib/use-permission'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { AlertCircle, Building2, Cpu, HardDrive, Info, KeyRound, RefreshCcw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  licenseStatusLabel,
  licenseStatusTone,
  migrationProgressPercent,
} from './about-display'

export function AdminAboutPage() {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')

  const migrationBadge = (pending: number, status: string) => {
    if (pending === 0 && status === 'ok') {
      return <Badge className="app-tone-success-fill">{t('about.migrationComplete')}</Badge>
    }
    if (status === 'error') return <Badge variant="destructive">{t('about.migrationError')}</Badge>
    return <Badge className="app-tone-warning-fill">{t('about.migrationPending', { count: pending })}</Badge>
  }

  const licenseBadge = (status: string) => {
    const tone = licenseStatusTone(status)
    const label = licenseStatusLabel(status, t)
    if (tone === 'ok') return <Badge className="app-tone-success-fill">{label}</Badge>
    if (tone === 'warn') return <Badge className="app-tone-warning-fill">{label}</Badge>
    return <Badge variant="secondary">{label}</Badge>
  }
  const canRead = usePermission('admin.about.read')

  const q = useQuery({
    queryKey: ['admin', 'about'],
    queryFn: fetchAdminAbout,
    enabled: canRead,
    placeholderData: keepPreviousData,
  })

  if (!canRead) {
    return (
      <AdminPageRoot tourTarget="admin-about">
        <AdminAccessDenied permission="admin.about.read" />
      </AdminPageRoot>
    )
  }

  const d = q.data
  const migPct = d ? migrationProgressPercent(d.migration.appliedCount, d.migration.totalFiles) : 0

  return (
    <AdminPageShell
      tourTarget="admin-about"
      title={t('about.title')}
      description={t('about.description')}
      hints={['Version', 'Migration', 'License', 'Build info']}
      headerActions={
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="admin-toolbar-btn"
          disabled={q.isFetching}
          onClick={() => void q.refetch()}
        >
          <RefreshCcw className={`mr-1 size-3.5 ${q.isFetching ? 'animate-spin' : ''}`} aria-hidden />{t('shared.refresh')}</Button>
      }
    >
        {q.isError && !d ? (
          <EmptyState
            icon={AlertCircle}
            title={t('about.loadFailed')}
            description={(q.error as Error)?.message ?? t('about.unknownError')}
            action={{ label: tc('actions.retry'), onClick: () => void q.refetch() }}
          />
        ) : null}

        {q.isLoading && !d ? (
          <div className="grid gap-4 sm:grid-cols-3">
            <Skeleton className="h-28 rounded-card" />
            <Skeleton className="h-28 rounded-card" />
            <Skeleton className="h-28 rounded-card" />
          </div>
        ) : d ? (
          <>
            <AdminKpiGrid className="sm:grid-cols-2 lg:grid-cols-3">
              <AdminKpiCard
                tone="info"
                icon={Info}
                label={t('about.apiVersion')}
                value={d.apiVersion}
                hint={`Web ${d.webVersion}`}
              />
              <AdminKpiCard
                tone={d.migration.pendingCount === 0 ? 'success' : 'warning'}
                icon={HardDrive}
                label="Migration"
                value={`${d.migration.appliedCount}/${d.migration.totalFiles}`}
                hint={
                  d.migration.latestAppliedId
                    ? `#${d.migration.latestAppliedId} ${d.migration.latestFile ?? ''}`
                    : t('about.noProbe')
                }
              />
              <AdminKpiCard
                tone={licenseStatusTone(d.license.status) === 'warn' ? 'warning' : 'info'}
                icon={KeyRound}
                label="License"
                value={licenseStatusLabel(d.license.status, t)}
                hint={d.license.expiresAt ? t('about.licenseHintExpires') : t('about.licenseHintSettings')}
              />
            </AdminKpiGrid>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card className="admin-card">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Info className="size-4" />
                    Build
                  </CardTitle>
                  <CardDescription>{t('about.buildDesc')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-body-sm">
                  <p>
                    <span className="text-app-muted">API:</span> {d.apiVersion}
                  </p>
                  <p>
                    <span className="text-app-muted">Web:</span> {d.webVersion}
                  </p>
                  {d.buildCommit ? (
                    <p className="font-mono text-xs text-app-muted">commit {d.buildCommit}</p>
                  ) : (
                    <p className="text-xs text-app-muted">{t('about.buildCommitHint')}</p>
                  )}
                  {d.buildTime ? (
                    <p className="text-xs text-app-muted">
                      build {new Date(d.buildTime).toLocaleString('th-TH')}
                    </p>
                  ) : null}
                </CardContent>
              </Card>

              <Card className="admin-card">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Building2 className="size-4" />
                    {t('about.organization')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-body-sm">
                  <p>
                    <span className="text-app-muted">Vendor:</span> {d.vendor}
                  </p>
                  <p>
                    <span className="text-app-muted">Client:</span> {d.client}
                  </p>
                </CardContent>
              </Card>

              <Card className="admin-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Migration</CardTitle>
                  <CardDescription>
                    <Link to="/admin/health" className="text-[var(--app-accent)] underline">
                      {t('about.migrationDetail')}
                    </Link>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-body-sm">
                  <div className="flex items-center gap-2">
                    {migrationBadge(d.migration.pendingCount, d.migration.status)}
                    <span className="tabular-nums">
                      {t('about.migrationFiles', {
                        applied: d.migration.appliedCount,
                        total: d.migration.totalFiles,
                      })}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-app-muted">
                    <div
                      className="app-tone-success-fill h-full transition-all"
                      style={{ width: `${migPct}%` }}
                    />
                  </div>
                  {d.migration.latestAppliedId ? (
                    <p className="text-xs text-app-muted">
                      {t('about.migrationLatest', { id: d.migration.latestAppliedId })}
                      {d.migration.latestFile ? ` — ${d.migration.latestFile}` : ''}
                    </p>
                  ) : null}
                  {d.migration.unverifiedCount > 0 ? (
                    <p className="app-tone-warning-label text-xs">
                      {t('about.migrationUnverified', { count: d.migration.unverifiedCount })}
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card className="admin-card">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Cpu className="size-4" />
                    {t('about.apiServerTitle')}
                  </CardTitle>
                  <CardDescription>{t('about.apiServerDesc')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-body-sm">
                  <p>
                    <span className="text-app-muted">OS:</span> {d.server.platformLabel}
                  </p>
                  <p>
                    <span className="text-app-muted">Node:</span> {d.server.nodeVersion}
                  </p>
                  <p>
                    <span className="text-app-muted">Uptime:</span> {formatUptime(d.server.uptimeSec)}
                  </p>
                  <p className="text-xs text-app-muted">
                    {t('about.updatedAt', { time: new Date(d.time).toLocaleString() })}
                  </p>
                </CardContent>
              </Card>

              <Card className="admin-card">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <HardDrive className="size-4" />
                    {t('about.diskTitle', { path: d.server.disk.path })}
                  </CardTitle>
                  <CardDescription>{t('about.diskDesc')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-body-sm">
                  <p>
                    {t('about.diskUsage', {
                      percent: d.server.disk.usedPercent ?? '—',
                      used: formatBytes(d.server.disk.usedBytes),
                      total: formatBytes(d.server.disk.totalBytes),
                    })}
                  </p>
                  <p className="text-app-muted">
                    {t('about.diskFree', { free: formatBytes(d.server.disk.freeBytes) })}
                  </p>
                  {d.server.disk.message ? (
                    <p className="app-tone-warning-label text-xs">{d.server.disk.message}</p>
                  ) : null}
                </CardContent>
              </Card>
            </div>

            <Card className="admin-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <KeyRound className="size-4" />
                  License
                </CardTitle>
                <CardDescription>
                  {t('about.licenseSettingsHint')}{' '}
                  <Link to="/admin/settings" className="text-[var(--app-accent)] underline">
                    {t('about.configureInSettings')}
                  </Link>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-body-sm">
                <div className="flex items-center gap-2">
                  {t('about.licenseStatus')} {licenseBadge(d.license.status)}
                </div>
                {d.license.expiresAt ? (
                  <p className="text-app-muted">
                    {t('about.licenseExpires', {
                      date: new Date(d.license.expiresAt).toLocaleDateString(),
                    })}
                  </p>
                ) : (
                  <p className="text-app-muted">{t('about.licenseExpiresEnv')}</p>
                )}
              </CardContent>
            </Card>
          </>
        ) : null}
    </AdminPageShell>
  )
}
