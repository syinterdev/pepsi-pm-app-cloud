import { AppCard } from '@/components/layout/AppCard'
import { AppPageSection, AppPageSectionCard, AppPageShell } from '@/components/layout/AppPageShell'
import { ProfilePanel } from '@/features/settings/ProfilePanel'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { apiUrl, getApiBaseUrl } from '@/lib/api-client'
import { fetchPublicHealth } from '@/lib/health-api'
import { fetchUsers } from '@/lib/api-public'
import { appLocaleToBcp47 } from '@/lib/app-locale'
import { usePermission } from '@/lib/use-permission'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { LanguagePreferencePanel } from '@/features/settings/LanguagePreferencePanel'
import { TelegramLinkPanel } from '@/features/settings/TelegramLinkPanel'
import { AlertCircle, Globe, MessageCircle, RefreshCcw, Settings } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function SettingsPage() {
  const { t, i18n } = useTranslation()
  const canRead = usePermission('admin.settings.read')
  const locale = appLocaleToBcp47(i18n.language === 'th' ? 'th' : 'en')

  const health = useQuery({
    queryKey: ['health'],
    queryFn: fetchPublicHealth,
    enabled: canRead,
    placeholderData: keepPreviousData,
    retry: 1,
  })

  const users = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
    enabled: canRead,
    placeholderData: keepPreviousData,
  })

  if (!canRead) {
    return (
      <AppPageShell title={t('settings.title')} description={t('settings.description')}>
        <EmptyState
          icon={AlertCircle}
          title={t('settings.noAccess')}
          description={
            <>
              {t('settings.noAccessDesc')}{' '}
              <code className="text-xs">admin.settings.read</code>
            </>
          }
        />
      </AppPageShell>
    )
  }

  return (
    <AppPageShell
      title={t('settings.title')}
      description={t('settings.description')}
      hints={[
        t('settings.tabs.profile'),
        t('settings.tabs.language'),
        t('settings.tabs.telegram'),
        t('settings.hintApiHealth'),
      ]}
      contentClassName="mx-auto max-w-4xl"
    >
      <AppPageSection index={0}>
      <AppPageSectionCard
        icon={Settings}
        title={t('settings.title')}
        description={`${t('settings.tabs.profile')} · ${t('settings.tabs.language')} · ${t('settings.tabs.telegram')} · ${t('settings.tabs.connection')}`}
      >
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="flex h-auto flex-wrap gap-1">
          <TabsTrigger value="profile">{t('settings.tabs.profile')}</TabsTrigger>
          <TabsTrigger value="language" className="gap-1.5">
            <Globe className="size-3.5" aria-hidden />
            {t('settings.tabs.language')}
          </TabsTrigger>
          <TabsTrigger value="telegram" className="gap-1.5">
            <MessageCircle className="size-3.5" aria-hidden />
            {t('settings.tabs.telegram')}
          </TabsTrigger>
          <TabsTrigger value="connection">{t('settings.tabs.connection')}</TabsTrigger>
          <TabsTrigger value="users">{t('settings.tabs.users')}</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4">
          <ProfilePanel />
        </TabsContent>

        <TabsContent value="language" className="mt-4">
          <LanguagePreferencePanel />
        </TabsContent>

        <TabsContent value="telegram" className="mt-4">
          <TelegramLinkPanel />
        </TabsContent>

        <TabsContent value="connection" className="mt-4 space-y-4">
          <AppCard pad="compact" className="space-y-2">
            <h3 className="text-body-sm font-semibold text-app">{t('settings.connection.apiAddress')}</h3>
            <p className="text-body-sm">
              <span className="font-medium">VITE_API_URL:</span>{' '}
              <code className="rounded bg-app-muted px-2 py-1 text-xs">
                {getApiBaseUrl() || t('settings.connection.viteEmpty')}
              </code>
            </p>
            <p className="text-body-sm">
              {t('settings.connection.health')}:{' '}
              <code className="rounded bg-app-muted px-2 py-1 text-xs">
                {apiUrl('/api/v1/health')}
              </code>
            </p>
            <p className="text-xs text-app-muted">{t('settings.connection.envHint')}</p>
          </AppCard>

          <AppCard pad="compact">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-body-sm font-semibold text-app">{t('settings.connection.apiHealth')}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void health.refetch()}
                disabled={health.isFetching}
              >
                <RefreshCcw
                  className={`mr-1 size-3.5 ${health.isFetching ? 'animate-spin' : ''}`}
                  aria-hidden
                />
                {t('settings.connection.refresh')}
              </Button>
            </div>
            {health.isLoading && !health.data ? (
              <div className="mt-3 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-full max-w-md" />
              </div>
            ) : health.isError ? (
              <EmptyState
                icon={AlertCircle}
                className="mt-3 border-0 bg-transparent py-6"
                title={t('settings.connection.connectFailed')}
                description={(health.error as Error).message}
                action={{
                  label: t('actions.retry'),
                  onClick: () => void health.refetch(),
                }}
              />
            ) : health.data ? (
              <dl className="mt-3 grid gap-2 text-body-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-app-muted">{t('settings.connection.status')}</dt>
                  <dd>
                    <Badge className="app-tone-success-fill">{t('settings.connection.ready')}</Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-app-muted">{t('settings.connection.serverTime')}</dt>
                  <dd className="tabular-nums">
                    {health.data.time
                      ? new Date(health.data.time).toLocaleString(locale)
                      : '—'}
                  </dd>
                </div>
              </dl>
            ) : null}
          </AppCard>
        </TabsContent>

        <TabsContent value="users" className="mt-4">
          {users.isLoading && !users.data ? (
            <Skeleton className="h-40 w-full rounded-card" />
          ) : users.isError ? (
            <EmptyState
              icon={AlertCircle}
              title={t('settings.users.loadFailed')}
              description={(users.error as Error).message}
              action={{ label: t('actions.retry'), onClick: () => void users.refetch() }}
            />
          ) : (
            <AppCard pad="compact" className="p-0">
              <div className="app-table-shell overflow-x-auto">
                <Table embedded stickyHeader zebra>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>{t('settings.users.colUsername')}</TableHead>
                      <TableHead>{t('settings.users.colRole')}</TableHead>
                      <TableHead>{t('settings.users.colActive')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(users.data ?? []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="p-0">
                          <EmptyState
                            className="border-0 bg-transparent py-8"
                            title={t('settings.users.empty')}
                          />
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.data?.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell>{u.id}</TableCell>
                          <TableCell className="font-mono text-body-sm">{u.username}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{u.role}</Badge>
                          </TableCell>
                          <TableCell>
                            {u.active ? t('settings.users.yes') : t('settings.users.no')}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </AppCard>
          )}
        </TabsContent>
      </Tabs>
      </AppPageSectionCard>
      </AppPageSection>
    </AppPageShell>
  )
}
