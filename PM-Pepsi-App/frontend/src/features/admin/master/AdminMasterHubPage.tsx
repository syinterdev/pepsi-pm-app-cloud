import { AdminAccessDenied } from '@/components/admin/AdminAccessDenied'
import { AdminPageRoot } from '@/components/admin/AdminPageRoot'
import { AdminPageShell } from '@/components/admin/AdminPageShell'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { fetchMasterDataMeta } from '@/lib/api-public'
import { usePermission } from '@/lib/use-permission'
import { useQueries, useQueryClient } from '@tanstack/react-query'
import { ExternalLink, RefreshCcw } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { MASTER_ENTITIES, masterDataHref } from './master-entities'

export function AdminMasterHubPage() {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const qc = useQueryClient()
  const canRead = usePermission('master-data.read')

  const metas = useQueries({
    queries: MASTER_ENTITIES.map((e) => ({
      queryKey: ['master-data', 'meta', e.id],
      queryFn: () => fetchMasterDataMeta(e.id),
      enabled: canRead,
      staleTime: 60_000,
    })),
  })

  const totalRows = useMemo(
    () =>
      metas.reduce((sum, q) => {
        if (!q.data || q.isError) return sum
        return sum + q.data.count
      }, 0),
    [metas],
  )

  const loadedCount = metas.filter((q) => q.isSuccess).length
  const anyLoading = metas.some((q) => q.isLoading && !q.data)
  const anyError = metas.some((q) => q.isError)
  const isRefreshing = metas.some((q) => q.isFetching)

  const refetchAll = () => {
    void qc.invalidateQueries({ queryKey: ['master-data', 'meta'] })
  }

  if (!canRead) {
    return (
      <AdminPageRoot tourTarget="admin-master">
        <AdminAccessDenied permission="master-data.read" />
      </AdminPageRoot>
    )
  }

  return (
    <AdminPageShell
      tourTarget="admin-master"
      title={t('master.hubTitle')}
      description={t('master.hubDescription')}
      hints={['Master data', 'Hub', 'Import', 'Sync', 'Publish']}
      headerActions={
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="admin-toolbar-btn"
          onClick={refetchAll}
          disabled={isRefreshing}
        >
          <RefreshCcw className={`mr-1 size-3.5 ${isRefreshing ? 'animate-spin' : ''}`} aria-hidden />
          {t('shared.refresh')}
        </Button>
      }
    >
      <Card className="admin-card border-[var(--app-accent)]/30 bg-[var(--app-accent)]/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t('master.publishCalloutTitle')}</CardTitle>
          <CardDescription>{t('master.publishCalloutDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal space-y-1 pl-5 text-body-sm text-app-muted">
            <li>{t('master.publishStep1')}</li>
            <li>{t('master.publishStep2')}</li>
            <li>{t('master.publishStep3')}</li>
          </ol>
          <Button type="button" size="sm" className="mt-3" asChild>
            <Link to="/master-plan">
              {t('master.publishCta')}
              <ExternalLink className="ml-1 size-3.5" aria-hidden />
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card className="admin-card">
        <CardHeader>
          <CardTitle className="text-base">
            {t('master.hubTableTitle', { count: MASTER_ENTITIES.length })}
          </CardTitle>
          <CardDescription>{t('master.hubTableDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          {anyError && !anyLoading ? (
            <p className="app-tone-warning-label mb-3 text-body-sm">
              {t('master.partialLoadWarning')}
            </p>
          ) : null}
          <div className="app-table-shell overflow-x-auto">
            <Table embedded stickyHeader zebra>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('shared.name')}</TableHead>
                  <TableHead className="w-28 text-right">{t('master.rowCount')}</TableHead>
                  <TableHead className="w-40">{t('master.lastModified')}</TableHead>
                  <TableHead className="w-32" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {MASTER_ENTITIES.map((entity, index) => {
                  const q = metas[index]
                  const count = q?.data?.count
                  const lastUpdatedAt = q?.data?.lastUpdatedAt ?? null
                  const lastUpdatedLabel = lastUpdatedAt
                    ? new Date(lastUpdatedAt).toLocaleString('th-TH')
                    : '—'
                  return (
                    <TableRow key={entity.id}>
                      <TableCell>
                        <div className="font-medium text-app">{entity.label}</div>
                        <p className="font-mono text-xs text-app-muted">{entity.id}</p>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {q?.isLoading && !q.data ? (
                          <Skeleton className="ml-auto h-5 w-12" />
                        ) : q?.isError ? (
                          <span className="text-xs text-form-error" title={t('master.metaLoadFailed')}>
                            —
                          </span>
                        ) : (
                          (count ?? 0).toLocaleString('th-TH')
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-app-muted">{lastUpdatedLabel}</TableCell>
                      <TableCell>
                        <Button type="button" size="sm" variant="outline" asChild>
                          <Link to={masterDataHref(entity.id)}>
                            {t('shared.open')}
                            <ExternalLink className="ml-1 size-3.5" aria-hidden />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
                <TableRow className="font-medium">
                  <TableCell>
                    {t('master.totalLoaded', {
                      loaded: loadedCount,
                      total: MASTER_ENTITIES.length,
                    })}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {anyLoading ? (
                      <Skeleton className="ml-auto h-5 w-16" />
                    ) : (
                      totalRows.toLocaleString('th-TH')
                    )}
                  </TableCell>
                  <TableCell colSpan={2} />
                </TableRow>
              </TableBody>
            </Table>
          </div>
          {loadedCount === 0 && anyError && !anyLoading ? (
            <EmptyState
              className="mt-4"
              title={t('master.title')}
              description={t('master.description')}
              action={{ label: tc('actions.retry'), onClick: refetchAll }}
            />
          ) : null}
          <p className="mt-3 text-xs text-app-muted">
            {t('master.footerHint')}{' '}
            <Link to="/master-plan" className="text-[var(--app-accent)] underline">
              {t('master.goMasterData')}
            </Link>
            {' · '}
            <Link to="/master-data" className="text-[var(--app-accent)] underline">
              {t('master.goReferenceData')}
            </Link>
            {' · '}
            <Link to="/admin" className="text-[var(--app-accent)] underline">
              {t('master.adminConsole')}
            </Link>
          </p>
        </CardContent>
      </Card>
    </AdminPageShell>
  )
}
