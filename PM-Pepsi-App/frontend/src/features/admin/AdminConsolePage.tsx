import { AdminKpiCard } from '@/components/admin/AdminKpiCard'
import { hintsFromT } from '@/lib/i18n-hints'
import { AdminKpiGrid } from '@/components/admin/AdminKpiGrid'
import { AdminPageSection, AdminPageShell } from '@/components/admin/AdminPageShell'
import { Skeleton } from '@/components/ui/skeleton'
import { countAccessibleAdminSections } from '@/lib/admin-sections'
import { fetchAdminHealth } from '@/lib/admin-health-api'
import { useAuthUser, usePermission } from '@/lib/use-permission'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Activity, AlertCircle, History, LayoutGrid, RefreshCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslation } from 'react-i18next'

const stagger = {
  show: { transition: { staggerChildren: 0.06 } },
}

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] as const } },
}

export function AdminConsolePage() {
  const { t } = useTranslation('admin')
  const authUser = useAuthUser()
  const canHealth = usePermission('admin.health.read')
  const healthQ = useQuery({
    queryKey: ['admin', 'health', 'console'],
    queryFn: () => fetchAdminHealth('D:\\'),
    enabled: canHealth,
    staleTime: 30_000,
    retry: 1,
    placeholderData: keepPreviousData,
  })

  const moduleCount = countAccessibleAdminSections(authUser?.permissions)

  return (
    <AdminPageShell
      tourTarget="admin-console"
      title={t('console.title')}
      description={t('console.description')}
      hints={hintsFromT(t, 'console.hints')}
      headerActions={
        canHealth ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="admin-toolbar-btn"
            onClick={() => void healthQ.refetch()}
            disabled={healthQ.isFetching}
          >
            <RefreshCcw
              className={`mr-1 size-3.5 ${healthQ.isFetching ? 'animate-spin' : ''}`}
              aria-hidden
            />
            {t('console.refresh')}
          </Button>
        ) : null
      }
    >
        <AdminPageSection index={0}>
        <motion.div variants={stagger} initial="hidden" animate="show">
        <AdminKpiGrid>
          {canHealth && healthQ.isLoading ? (
            <>
              <motion.div variants={item}>
                <Skeleton className="h-28 rounded-card" />
              </motion.div>
              <motion.div variants={item}>
                <Skeleton className="h-28 rounded-card" />
              </motion.div>
            </>
          ) : null}

          {canHealth && healthQ.isError ? (
            <motion.div variants={item}>
              <AdminKpiCard
                tone="danger"
                icon={AlertCircle}
                label={t('console.healthApi')}
                value={t('console.healthLoadFailed')}
                hint={
                  healthQ.error instanceof Error
                    ? healthQ.error.message
                    : t('console.healthLoadHint')
                }
              />
            </motion.div>
          ) : null}

          {canHealth && healthQ.data ? (
            <>
              <motion.div variants={item}>
                <AdminKpiCard
                  tone={healthQ.data.db.status === 'ok' ? 'info' : 'danger'}
                  icon={Activity}
                  label={t('console.database')}
                  value={
                    healthQ.data.db.latencyMs != null ? `${healthQ.data.db.latencyMs} ms` : '—'
                  }
                  hint={healthQ.data.db.status}
                />
              </motion.div>
              <motion.div variants={item}>
                <AdminKpiCard
                  tone={
                    healthQ.data.migration.pendingCount > 0 ? 'warning' : 'success'
                  }
                  label={t('console.migration')}
                  value={`${healthQ.data.migration.appliedCount}/${healthQ.data.migration.totalFiles}`}
                  hint={t('console.pending', { count: healthQ.data.migration.pendingCount })}
                />
              </motion.div>
            </>
          ) : null}

          {!canHealth ? (
            <motion.div variants={item}>
              <AdminKpiCard
                tone="default"
                icon={Activity}
                label={t('console.health')}
                value="—"
                hint={t('console.noHealthPermission')}
              />
            </motion.div>
          ) : null}

          <motion.div variants={item}>
            <AdminKpiCard
              tone="default"
              icon={LayoutGrid}
              label={t('console.modulesAccessible')}
              value={`${moduleCount.accessible}/${moduleCount.total}`}
              hint={t('console.modulesHint')}
            />
          </motion.div>

          <motion.div variants={item}>
            <AdminKpiCard
              tone="success"
              icon={History}
              label={t('console.adminTour')}
              value={moduleCount.total}
              hint={t('console.tourHint')}
            />
          </motion.div>
        </AdminKpiGrid>
        </motion.div>
        </AdminPageSection>
    </AdminPageShell>
  )
}
