import { KpiStatCard } from '@/components/kpi/KpiStatCard'
import { KpiStatGrid } from '@/components/kpi/KpiStatGrid'
import { SchedulingSection } from '@/components/scheduling/SchedulingPageLayout'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import type { z } from 'zod'
import type { workOrderFilterDetailResponseSchema } from '@/api/schemas'
import { APP_INTERACTIVE_MOTION_SUBTLE } from '@/lib/app-motion'
import { BarChart3, Filter } from 'lucide-react'
import { useTranslation } from 'react-i18next'

type FilterDetailData = z.infer<typeof workOrderFilterDetailResponseSchema>

type FilterDetailSummaryProps = {
  title: string
  subtitle?: string
  data: FilterDetailData | undefined
  isLoading: boolean
  isError: boolean
  error?: Error | null
  teamOnly?: boolean
  isLivePreview?: boolean
  isRefreshing?: boolean
  collapsible?: boolean
  defaultOpen?: boolean
}

export function FilterDetailSummary({
  title,
  subtitle,
  data,
  isLoading,
  isError,
  error,
  teamOnly = false,
  isLivePreview = false,
  isRefreshing = false,
  collapsible = false,
  defaultOpen = true,
}: FilterDetailSummaryProps) {
  const { t, i18n } = useTranslation('scheduling')
  const locale = i18n.language.startsWith('th') ? 'th-TH' : 'en-US'

  const badge = (
    <>
      {isLivePreview ? (
        <Badge variant="outline" className="app-tone-warning-badge">
          {t('filterDetail.livePreview')}
        </Badge>
      ) : null}
      {isRefreshing ? (
        <Badge variant="secondary" className="text-app-muted">
          {t('filterDetail.syncing')}
        </Badge>
      ) : null}
    </>
  )

  const collapsedHint = isLoading
    ? t('filterDetail.collapsedLoading')
    : isError
      ? t('filterDetail.collapsedError')
      : data
        ? t('filterDetail.collapsedSummary', {
            orders: data.totalOrders.toLocaleString(locale),
            percent: data.completionPercent,
          })
        : t('filterDetail.collapsedDefault')

  return (
    <SchedulingSection
      icon={BarChart3}
      title={title}
      description={subtitle}
      badge={badge}
      collapsible={collapsible}
      defaultOpen={defaultOpen}
      collapsedHint={collapsedHint}
      bodyClassName="space-y-4"
    >
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full rounded-card" />
          <Skeleton className="h-20 w-full rounded-card" />
        </div>
      ) : isError ? (
        <p className="text-body-sm text-form-error">
          {(error as Error)?.message ?? t('filterDetail.loadFailed')}
        </p>
      ) : data ? (
        <>
          {!teamOnly ? (
            <KpiStatCard
              tone="amber"
              label={t('filterDetail.workOrderLabel')}
              value={data.totalOrders}
              className={APP_INTERACTIVE_MOTION_SUBTLE}
              footer={
                <>
                  <p className="text-app-muted">
                    {t('filterDetail.closedFooter', {
                      count: data.completionCount,
                      percent: data.completionPercent,
                    })}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {data.byWkzb.map((x) => (
                      <Badge key={x.code} variant="secondary" title={x.label}>
                        {x.code}={x.count}
                      </Badge>
                    ))}
                  </div>
                </>
              }
            />
          ) : null}

          <KpiStatGrid className="sm:grid-cols-2 lg:grid-cols-4">
            <KpiStatCard
              tone="emerald"
              label={t('filterDetail.teamA')}
              value={data.teamA.count}
              className={APP_INTERACTIVE_MOTION_SUBTLE}
              footer={
                <>
                  <p className="text-app-muted">{t('shared.workMin')}</p>
                  <p className="tabular-nums">{data.teamA.workSumMinutes}</p>
                </>
              }
            />
            <KpiStatCard
              tone="rose"
              label={t('filterDetail.teamB')}
              value={data.teamB.count}
              className={APP_INTERACTIVE_MOTION_SUBTLE}
              footer={
                <>
                  <p className="text-app-muted">{t('shared.workMin')}</p>
                  <p className="tabular-nums">{data.teamB.workSumMinutes}</p>
                </>
              }
            />
            <KpiStatCard
              tone="info"
              label={t('filterDetail.teamEE')}
              value={data.teamEE.count}
              className={APP_INTERACTIVE_MOTION_SUBTLE}
              footer={
                <>
                  <p className="text-app-muted">{t('shared.workMin')}</p>
                  <p className="tabular-nums">{data.teamEE.workSumMinutes}</p>
                </>
              }
            />
            <KpiStatCard
              tone="amber"
              label={t('filterDetail.teamUT')}
              value={data.teamUT.count}
              className={APP_INTERACTIVE_MOTION_SUBTLE}
              footer={
                <>
                  <p className="text-app-muted">{t('shared.workMin')}</p>
                  <p className="tabular-nums">{data.teamUT.workSumMinutes}</p>
                </>
              }
            />
          </KpiStatGrid>
        </>
      ) : (
        <EmptyState
          icon={Filter}
          title={t('filterDetail.emptyTitle')}
          description={t('filterDetail.emptyDesc')}
        />
      )}
    </SchedulingSection>
  )
}
