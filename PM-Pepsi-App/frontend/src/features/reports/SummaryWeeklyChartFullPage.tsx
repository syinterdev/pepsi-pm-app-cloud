/**
 * กราฟขยายเต็มจอ
 * เปิดแท็บใหม่จาก `/summary-weekly` (ลิงก์ "ดูกราฟแบบขยาย")
 */
import { hintsFromT } from '@/lib/i18n-hints'
import {
  AppPageHero,
  AppPageHeroActions,
  appPageHeroBtnClass,
} from '@/components/layout/AppPageHero'
import { AppPageContent } from '@/components/layout/AppPageContent'
import {
  AppPageSection,
  AppPageSectionCard,
} from '@/components/layout/AppPageShell'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import {
  defaultReportsDateRange,
  ReportsDateFilter,
} from '@/features/reports/ReportsDateFilter'
import { SummaryWeeklyUtilizationChart } from '@/features/reports/SummaryWeeklyUtilizationChart'
import { fetchSummaryWeekly } from '@/lib/api-public'
import { usePermission } from '@/lib/use-permission'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { AlertCircle, ArrowLeft, Maximize2, Printer, RefreshCcw } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export function SummaryWeeklyChartFullPage() {
  const { t } = useTranslation('reports')
  const { t: tc } = useTranslation('common')
  const navigate = useNavigate()
  const canRead = usePermission('reports.read')
  const [params] = useSearchParams()
  const variant = params.get('variant') === 'chart' ? 'chart' : 'chart2'
  const urlFrom = params.get('from') ?? undefined
  const urlTo = params.get('to') ?? undefined

  const initial = useMemo(() => {
    const base = defaultReportsDateRange(30)
    return {
      from: urlFrom ?? base.from,
      to: urlTo ?? base.to,
    }
  }, [urlFrom, urlTo])

  const [submitted, setSubmitted] = useState(initial)

  const q = useQuery({
    queryKey: ['summary-weekly', submitted, 'full'],
    queryFn: () => fetchSummaryWeekly({ from: submitted.from, to: submitted.to }),
    enabled: canRead,
    placeholderData: keepPreviousData,
  })

  const chart = q.data?.utilizationChart ?? []
  const variantLabel =
    variant === 'chart2' ? t('engUtil.fullVariantChart2') : t('engUtil.fullVariantChart')

  if (!canRead) {
    return (
      <div className="summary-weekly-chart-full flex min-h-screen items-center justify-center p-6">
        <EmptyState
          icon={AlertCircle}
          title={t('engUtil.fullAccessDenied')}
          description={
            <>
              {tc('rbac.requiresPermission')}{' '}
              <code className="text-xs">reports.read</code>
            </>
          }
          action={{
            label: t('engUtil.fullBack'),
            onClick: () => navigate('/summary-weekly'),
          }}
        />
      </div>
    )
  }

  const printTitle = t('engUtil.fullPrintTitle', { variant: variantLabel })

  return (
    <div className="summary-weekly-chart-full dashboard-page min-h-screen">
      <AppPageHero
        eyebrow={t('engUtil.fullEyebrow')}
        title={t('engUtil.fullTitle')}
        description={variantLabel}
        hints={hintsFromT(t, 'engUtil.fullHints')}
        meta={
          <p className="dashboard-hero__subtitle mt-1 flex items-center gap-2 text-sm opacity-90">
            <Maximize2 className="size-4 shrink-0" aria-hidden />
            {t('engUtil.fullMeta')}
          </p>
        }
        actions={
          <AppPageHeroActions>
            <Button
              variant="outline"
              size="sm"
              className={appPageHeroBtnClass}
              onClick={() => window.print()}
              disabled={!chart.length}
            >
              <Printer className="mr-1 size-4" aria-hidden />
              {t('engUtil.fullPrint')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={appPageHeroBtnClass}
              onClick={() => void q.refetch()}
              disabled={q.isFetching}
            >
              <RefreshCcw className={`mr-1 size-3.5 ${q.isFetching ? 'animate-spin' : ''}`} aria-hidden />
              {t('engUtil.refresh')}
            </Button>
            <Button variant="outline" size="sm" className={appPageHeroBtnClass} asChild>
              <Link to="/summary-weekly">
                <ArrowLeft className="mr-1 size-4" aria-hidden />
                {t('engUtil.fullBack')}
              </Link>
            </Button>
          </AppPageHeroActions>
        }
      />

      <AppPageContent className="scheduling-page pb-8">
        <AppPageSection index={0}>
          <div className="print-hidden">
            <ReportsDateFilter initial={submitted} onSearch={setSubmitted} />
          </div>
        </AppPageSection>

        <AppPageSection index={1}>
          {q.isLoading && !q.data ? (
            <Skeleton className="h-[min(70vh,700px)] w-full rounded-card" aria-label={t('engUtil.fullLoading')} />
          ) : q.isError ? (
            <EmptyState
              icon={AlertCircle}
              title={t('engUtil.fullLoadFailed')}
              description={(q.error as Error).message}
              action={{ label: tc('actions.retry'), onClick: () => void q.refetch() }}
            />
          ) : chart.length ? (
            <AppPageSectionCard
              icon={Maximize2}
              title={t('engUtil.fullSectionTitle')}
              description={
                q.data?.range
                  ? t('engUtil.fullRange', {
                      from: q.data.range.fromDate,
                      to: q.data.range.toDate,
                    })
                  : undefined
              }
              bodyClassName="print-chart-target !p-3 sm:!p-4"
            >
              <div className="mb-4 hidden print:block">
                <h1 className="text-xl font-semibold text-black">{printTitle}</h1>
                <p className="mt-1 text-sm text-zinc-600">
                  {t('engUtil.fullRange', {
                    from: q.data?.range?.fromDate ?? submitted.from,
                    to: q.data?.range?.toDate ?? submitted.to,
                  })}
                </p>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {t('engUtil.fullPrintedAt', { datetime: new Date().toLocaleString() })}
                </p>
              </div>
              <SummaryWeeklyUtilizationChart items={chart} variant={variant} layout="fullscreen" />
            </AppPageSectionCard>
          ) : (
            <EmptyState
              title={t('engUtil.fullEmpty')}
              description={t('engUtil.fullEmptyHint')}
              action={{
                label: t('engUtil.fullBack'),
                onClick: () => navigate('/summary-weekly'),
              }}
            />
          )}
        </AppPageSection>
      </AppPageContent>
    </div>
  )
}
