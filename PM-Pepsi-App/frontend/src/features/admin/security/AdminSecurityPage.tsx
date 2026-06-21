import { AdminAccessDenied } from '@/components/admin/AdminAccessDenied'
import { hintsFromT } from '@/lib/i18n-hints'
import { arrayLength } from '@/lib/coerce-array'
import { AdminPageRoot } from '@/components/admin/AdminPageRoot'
import { FailedLoginChart } from './FailedLoginChart'
import {
  AdminPageSection,
  AdminPageSectionCard,
  AdminPageShell,
} from '@/components/admin/AdminPageShell'
import { AdminKpiCard } from '@/components/admin/AdminKpiCard'
import { AdminKpiGrid } from '@/components/admin/AdminKpiGrid'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
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
import { BlockIpQuickButton, BlockedIpCard } from './BlockedIpCard'
import { fetchSecurityOverview } from '@/lib/admin-security-api'
import { usePermission } from '@/lib/use-permission'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import {
  AlertCircle,
  Ban,
  CalendarDays,
  Lock,
  RefreshCcw,
  ShieldAlert,
  ShieldX,
} from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { menuSelectClass } from '@/features/admin/menu/menu-form-utils'

export function AdminSecurityPage() {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const canRead = usePermission('admin.security.read')
  const canWrite = usePermission('admin.security.write')
  const [days, setDays] = useState(30)

  const q = useQuery({
    queryKey: ['admin', 'security', days],
    queryFn: () => fetchSecurityOverview(days),
    enabled: canRead,
    placeholderData: keepPreviousData,
  })

  if (!canRead) {
    return (
      <AdminPageRoot tourTarget="admin-security">
        <AdminAccessDenied permission="admin.security.read" />
      </AdminPageRoot>
    )
  }

  const data = q.data
  const hints = hintsFromT(t, 'security.hints')

  const kpiBody =
    q.isLoading && !data ? (
      <AdminKpiGrid className="sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-28 rounded-card" />
        <Skeleton className="h-28 rounded-card" />
        <Skeleton className="h-28 rounded-card" />
      </AdminKpiGrid>
    ) : q.isError && !data ? (
      <EmptyState
        icon={AlertCircle}
        title={t('security.loadFailed')}
        description={(q.error as Error).message}
        action={{ label: tc('actions.retry'), onClick: () => void q.refetch() }}
      />
    ) : data ? (
      <AdminKpiGrid className="sm:grid-cols-2 lg:grid-cols-3">
        <AdminKpiCard
          tone="danger"
          icon={Lock}
          label={t('security.failedLoginKpi')}
          value={String(data.failedLogin.total)}
          hint={t('security.failedLoginHint', { days })}
        />
        <AdminKpiCard
          tone="warning"
          icon={ShieldX}
          label={t('security.rbacDenyKpi')}
          value={String(data.denied.total)}
          hint={t('security.rbacDenyHint')}
        />
        <AdminKpiCard
          tone="info"
          icon={Ban}
          label={t('security.rateLimitKpi')}
          value={String(data.rateLimitHits)}
          hint={t('security.rateLimitIpHint', { count: arrayLength(data?.rateLimitedIps) })}
        />
      </AdminKpiGrid>
    ) : null

  return (
    <AdminPageShell
      tourTarget="admin-security"
      title={t('security.title')}
      description={t('security.description')}
      hints={hints}
      headerActions={
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="admin-toolbar-btn"
          onClick={() => void q.refetch()}
          disabled={q.isFetching}
        >
          <RefreshCcw
            className={`mr-1 size-3.5 ${q.isFetching ? 'animate-spin' : ''}`}
            aria-hidden
          />
          {t('shared.refresh')}
        </Button>
      }
    >
      <AdminPageSection index={0}>
        <AdminPageSectionCard
          icon={CalendarDays}
          title={t('security.sections.rangeTitle')}
          description={t('security.sections.rangeDesc')}
        >
          <div className="max-w-xs space-y-1">
            <Label htmlFor="sec-days">{t('security.daysLabel')}</Label>
            <select
              id="sec-days"
              className={menuSelectClass}
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
            >
              {[7, 14, 30, 60, 90].map((d) => (
                <option key={d} value={d}>
                  {t('security.daysOption', { count: d })}
                </option>
              ))}
            </select>
          </div>
        </AdminPageSectionCard>
      </AdminPageSection>

      <AdminPageSection index={1}>
        <AdminPageSectionCard
          icon={ShieldAlert}
          title={t('security.sections.overviewTitle')}
          description={t('security.sections.overviewDesc')}
        >
          {kpiBody}
        </AdminPageSectionCard>
      </AdminPageSection>

      <AdminPageSection index={2}>
        <AdminPageSectionCard
          icon={Lock}
          title={t('security.failedLoginChartTitle')}
          description={t('security.failedLoginChartDesc')}
        >
          {q.isLoading && !data ? (
            <Skeleton className="h-[220px]" />
          ) : (
            <div className="h-[220px]">
              <FailedLoginChart series={data?.failedLogin.series ?? []} />
            </div>
          )}
        </AdminPageSectionCard>
      </AdminPageSection>

      <AdminPageSection index={3}>
        <AdminPageSectionCard
          icon={Ban}
          title={t('security.rateLimitTitle')}
          description={data?.rateLimitNote}
          bodyClassName="!p-0"
        >
          {q.isLoading && !data ? (
            <Skeleton className="m-4 h-32" />
          ) : (data?.rateLimitedIps.length ?? 0) === 0 ? (
            <p className="p-4 text-caption">{t('security.rateLimitEmpty')}</p>
          ) : (
            <div className="app-table-shell overflow-x-auto">
              <Table embedded stickyHeader zebra>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('security.colIp')}</TableHead>
                    <TableHead>{t('security.colCount')}</TableHead>
                    <TableHead>{t('security.colLatest')}</TableHead>
                    {canWrite ? (
                      <TableHead className="text-right">{t('security.colActions')}</TableHead>
                    ) : null}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data!.rateLimitedIps.map((row) => (
                    <TableRow key={row.ip}>
                      <TableCell className="font-mono text-xs">{row.ip}</TableCell>
                      <TableCell>{row.hits}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs">
                        {new Date(row.lastAt).toLocaleString('th-TH')}
                      </TableCell>
                      {canWrite ? (
                        <TableCell className="text-right">
                          <BlockIpQuickButton ip={row.ip} canWrite />
                        </TableCell>
                      ) : null}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </AdminPageSectionCard>
      </AdminPageSection>

      <AdminPageSection index={4}>
        <div className="grid gap-4 lg:grid-cols-2">
          <AdminPageSectionCard
            icon={ShieldAlert}
            title={t('security.suspiciousIpTitle')}
            description={t('security.suspiciousIpDesc', { days })}
            bodyClassName="!p-0"
          >
            {q.isLoading && !data ? (
              <Skeleton className="m-4 h-32" />
            ) : (data?.suspiciousIps.length ?? 0) === 0 ? (
              <p className="p-4 text-caption">{t('security.noSuspiciousIp')}</p>
            ) : (
              <div className="app-table-shell overflow-x-auto">
                <Table embedded stickyHeader zebra>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('security.colIp')}</TableHead>
                      <TableHead>{t('security.colAmount')}</TableHead>
                      <TableHead>{t('security.colLatest')}</TableHead>
                      {canWrite ? (
                        <TableHead className="text-right">{t('security.colActions')}</TableHead>
                      ) : null}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data!.suspiciousIps.map((row) => (
                      <TableRow key={row.ip}>
                        <TableCell className="font-mono text-xs">{row.ip}</TableCell>
                        <TableCell>{row.hits}</TableCell>
                        <TableCell className="whitespace-nowrap text-xs">
                          {new Date(row.lastAt).toLocaleString('th-TH')}
                        </TableCell>
                        {canWrite ? (
                          <TableCell className="text-right">
                            <BlockIpQuickButton ip={row.ip} canWrite />
                          </TableCell>
                        ) : null}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </AdminPageSectionCard>

          <AdminPageSectionCard
            icon={ShieldX}
            title={t('security.rbacDenyTitle')}
            description={t('security.rbacDenyFromMiddleware')}
            badge={
              data ? (
                <Badge variant="secondary" className="tabular-nums">
                  {data.denied.total}
                </Badge>
              ) : null
            }
            bodyClassName="!p-0"
          >
            <p className="border-b border-app/45 px-4 py-2 text-xs text-app-muted">
              <Link to="/admin/audit?status=denied" className="text-[var(--app-accent)] underline">
                {t('security.viewInAudit')}
              </Link>
            </p>
            {q.isLoading && !data ? (
              <Skeleton className="m-4 h-32" />
            ) : arrayLength(data?.denied?.items) === 0 ? (
              <p className="p-4 text-caption">{t('security.rbacDenyEmpty')}</p>
            ) : (
              <div className="app-table-shell overflow-x-auto">
                <Table embedded stickyHeader zebra>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('security.colTime')}</TableHead>
                      <TableHead>{t('security.colUser')}</TableHead>
                      <TableHead>{t('security.missingPermission')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data!.denied.items.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="whitespace-nowrap text-xs">
                          {new Date(row.createdAt).toLocaleString('th-TH')}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {row.actorId ?? '—'}
                          {row.ip ? (
                            <span className="mt-1 block text-app-muted">{row.ip}</span>
                          ) : null}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap items-center gap-1">
                            <span className="font-mono text-xs">{row.message ?? '—'}</span>
                            <Badge variant="destructive">{t('security.deniedBadge')}</Badge>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </AdminPageSectionCard>
        </div>
      </AdminPageSection>

      <AdminPageSection index={5}>
        {data ? (
          <BlockedIpCard items={data.blockedIps.items} canWrite={canWrite} />
        ) : q.isLoading && !data ? (
          <Skeleton className="h-48 rounded-card" />
        ) : null}
      </AdminPageSection>
    </AdminPageShell>
  )
}
