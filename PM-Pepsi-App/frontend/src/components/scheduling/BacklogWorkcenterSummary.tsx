import { KpiStatCard } from '@/components/kpi/KpiStatCard'
import { KpiStatGrid } from '@/components/kpi/KpiStatGrid'
import { SchedulingSection } from '@/components/scheduling/SchedulingPageLayout'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import type { backlogFilterDetailResponseSchema } from '@/api/schemas'
import { arrayLength } from '@/lib/coerce-array'
import { APP_INTERACTIVE_MOTION_SUBTLE } from '@/lib/app-motion'
import { useI18nFormat } from '@/lib/use-i18n-format'
import { Users } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { z } from 'zod'

type BacklogDetail = z.infer<typeof backlogFilterDetailResponseSchema>

type Props = {
  data: BacklogDetail | undefined
  isLoading: boolean
  isError: boolean
  error?: Error | null
  isRefreshing?: boolean
  collapsible?: boolean
  defaultOpen?: boolean
}

export function BacklogWorkcenterSummary({
  data,
  isLoading,
  isError,
  error,
  isRefreshing = false,
  collapsible = false,
  defaultOpen = true,
}: Props) {
  const { t } = useTranslation('scheduling')
  const { bcp47 } = useI18nFormat()

  const collapsedHint = useMemo(() => {
    if (isLoading) return t('backlog.wcSummary.collapsedLoading')
    if (isError) return t('backlog.wcSummary.collapsedError')
    if (data) {
      return t('backlog.wcSummary.collapsedSummary', {
        orders: data.totalOrders.toLocaleString(bcp47),
        techs: arrayLength(data.byWorkcenter).toLocaleString(bcp47),
      })
    }
    return t('backlog.wcSummary.collapsedDefault')
  }, [isLoading, isError, data, t, bcp47])

  return (
    <SchedulingSection
      icon={Users}
      title={t('backlog.wcSummary.title')}
      description={t('backlog.wcSummary.description')}
      collapsible={collapsible}
      defaultOpen={defaultOpen}
      collapsedHint={collapsedHint}
      badge={
        isRefreshing ? (
          <Badge variant="secondary" className="text-app-muted">
            {t('backlog.wcSummary.syncing')}
          </Badge>
        ) : null
      }
      bodyClassName="space-y-4"
    >
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full rounded-card" />
          <Skeleton className="h-20 w-full rounded-card" />
        </div>
      ) : isError ? (
        <p className="text-body-sm text-form-error">
          {(error as Error)?.message ?? t('backlog.wcSummary.loadFailed')}
        </p>
      ) : data ? (
        <>
          <KpiStatCard
            tone="amber"
            label={t('backlog.wcSummary.totalOrders')}
            value={data.totalOrders}
            footer={
              <p className="text-app-muted">
                {t('backlog.wcSummary.totalFooter', {
                  techCount: arrayLength(data.byWorkcenter).toLocaleString(bcp47),
                  closed: data.completionCount.toLocaleString(bcp47),
                  percent: data.completionPercent,
                })}
              </p>
            }
          />

          {arrayLength(data.byWorkcenter) > 0 ? (
            <KpiStatGrid className="sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {(data.byWorkcenter ?? []).map((wc) => (
                <KpiStatCard
                  key={wc.code}
                  tone="info"
                  label={wc.code}
                  value={wc.count}
                  className={APP_INTERACTIVE_MOTION_SUBTLE}
                  footer={
                    <>
                      <p className="truncate text-app-muted" title={wc.label}>
                        {wc.label.replace(`${wc.code} = `, '')}
                      </p>
                      <p className="mt-1 tabular-nums text-app-muted">
                        {t('backlog.wcSummary.workMinutes', { minutes: wc.workSumMinutes })}
                      </p>
                    </>
                  }
                />
              ))}
            </KpiStatGrid>
          ) : (
            <EmptyState
              icon={Users}
              title={t('backlog.wcSummary.emptyTitle')}
              description={t('backlog.wcSummary.emptyDesc')}
            />
          )}
        </>
      ) : (
        <EmptyState
          icon={Users}
          title={t('backlog.wcSummary.pendingTitle')}
          description={t('backlog.wcSummary.pendingDesc')}
        />
      )}
    </SchedulingSection>
  )
}
