import { AppPageSection, AppPageSectionCard, AppPageShell } from '@/components/layout/AppPageShell'
import { hintsFromT } from '@/lib/i18n-hints'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { QueryLoadErrorState } from '@/components/ui/query-load-error'
import { TableSkeletonRows } from '@/components/ui/table-skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { fetchUserLog } from '@/lib/api-public'
import { appLocaleToBcp47 } from '@/lib/app-locale'
import { usePermission } from '@/lib/use-permission'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { AlertCircle, History, RefreshCcw } from 'lucide-react'
import { useTranslation } from 'react-i18next'

function formatClientIp(ip: string | null | undefined, localhostLabel: string): string {
  if (!ip?.trim()) return '—'
  const v = ip.trim()
  if (v === '::1' || v === '::ffff:127.0.0.1') return localhostLabel
  return v
}

function formatServerHost(host: string | null | undefined): string {
  if (!host?.trim()) return '—'
  return host.trim()
}

export function UserLogPage() {
  const { t, i18n } = useTranslation('userLog')
  const canRead = usePermission('user-log.read')
  const locale = appLocaleToBcp47(i18n.language === 'th' ? 'th' : 'en')

  const formatAction = (action: string): string => {
    const a = action.toLowerCase()
    if (a === 'login') return t('actionLogin')
    if (a === 'logout') return t('actionLogout')
    return action
  }

  const q = useQuery({
    queryKey: ['user-log', 50, 0],
    queryFn: () => fetchUserLog({ limit: 50, offset: 0 }),
    enabled: canRead,
    placeholderData: keepPreviousData,
    retry: 1,
  })

  const rows = q.data ?? []

  if (!canRead) {
    return (
      <AppPageShell title={t('title')} description={t('description')}>
        <EmptyState
          icon={AlertCircle}
          title={t('noAccess')}
          description={
            <>
              {t('noAccessDesc')}{' '}
              <code className="text-xs">user-log.read</code>
            </>
          }
        />
      </AppPageShell>
    )
  }

  return (
    <AppPageShell
      title={t('title')}
      description={t('description')}
      hints={hintsFromT(t, 'hints')}
      headerActions={
        <>
          <Badge variant="secondary" className="text-xs">
            {t('recentCount', { count: rows.length })}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void q.refetch()}
            disabled={q.isFetching}
          >
            <RefreshCcw className={`mr-1 size-3.5 ${q.isFetching ? 'animate-spin' : ''}`} aria-hidden />
            {t('refresh')}
          </Button>
        </>
      }
    >
      <AppPageSection index={0}>
      {q.isError && !q.data ? (
        <QueryLoadErrorState
          title={t('loadFailed')}
          error={q.error}
          action={{ label: t('actions.retry', { ns: 'common' }), onClick: () => void q.refetch() }}
        />
      ) : (
        <AppPageSectionCard icon={History} title={t('cardTitle')} description={t('cardDesc')} bodyClassName="!p-0">
          <div
            className="app-table-shell overflow-x-auto"
            aria-busy={q.isLoading && !q.data ? true : undefined}
          >
            <Table embedded stickyHeader zebra>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">{t('colSeq')}</TableHead>
                  <TableHead>{t('colDateTime')}</TableHead>
                  <TableHead>{t('colStatus')}</TableHead>
                  <TableHead>{t('colUserIp')}</TableHead>
                  <TableHead>{t('colServer')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {q.isLoading && !q.data ? (
                  <TableSkeletonRows rows={10} columns={5} narrowFirstColumn />
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="p-0">
                      <EmptyState
                        className="border-0 bg-transparent py-10"
                        title={t('emptyTitle')}
                        description={t('emptyDesc')}
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row, idx) => (
                    <TableRow key={row.id}>
                      <TableCell className="tabular-nums">{idx + 1}</TableCell>
                      <TableCell className="whitespace-nowrap text-body-sm tabular-nums">
                        {row.actionTime
                          ? new Date(row.actionTime).toLocaleString(locale)
                          : '—'}
                      </TableCell>
                      <TableCell>{formatAction(row.action)}</TableCell>
                      <TableCell className="font-mono text-xs tabular-nums">
                        {formatClientIp(row.userIp, t('localhost'))}
                      </TableCell>
                      <TableCell className="font-mono text-xs tabular-nums">
                        {formatServerHost(row.myIp)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </AppPageSectionCard>
      )}
      </AppPageSection>
    </AppPageShell>
  )
}
