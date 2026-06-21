import { PmMeasurementLineChart } from '@/components/scheduling/PmMeasurementLineChart'
import { Skeleton } from '@/components/ui/skeleton'
import type { BoardPmReadingsResponse } from '@/lib/board-pm-readings-api'
import { useI18nFormat } from '@/lib/use-i18n-format'
import { Activity, LineChart } from 'lucide-react'
import { useTranslation } from 'react-i18next'

type Props = {
  data: BoardPmReadingsResponse | undefined
  loading: boolean
  error: Error | null
  carousel?: boolean
  rangeLabel: string
}

export function BoardPmReadingsPanel({
  data,
  loading,
  error,
  carousel = false,
  rangeLabel,
}: Props) {
  const { t } = useTranslation('board')
  const { bcp47 } = useI18nFormat()
  const groups = data?.groups ?? []
  const showSkeleton = loading && !data

  const formatLatest = (iso: string): string => {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return '—'
    return d.toLocaleString(bcp47, {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <section
      className={
        carousel
          ? 'engineering-board__panel engineering-board__panel--pm-readings'
          : 'engineering-board__panel engineering-board__panel--pm-readings'
      }
      aria-label={t('pmReadingsAria')}
    >
      <div className="engineering-board__panel-head">
        <div>
          <p className="engineering-board__zone-tag">{t('zoneC')}</p>
          <h2 className="engineering-board__panel-title engineering-board__panel-title--flush">
            <LineChart className="inline size-[1.1em] align-[-0.15em] mr-1" aria-hidden />
            {t('pmReadingsTitle')}
          </h2>
          <p className="engineering-board__activity-sub">
            {t('pmReadingsSub', {
              label: rangeLabel,
              count: data?.summary.totalReadings ?? 0,
            })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!loading && data ? (
            <span className="engineering-board__panel-badge">{groups.length}</span>
          ) : null}
        </div>
      </div>

      {error ? (
        <p className="engineering-board__activity-error">{error.message}</p>
      ) : showSkeleton ? (
        <div className="engineering-board__pm-readings-grid">
          <Skeleton className="h-36 rounded-card opacity-60" />
          <Skeleton className="h-36 rounded-card opacity-60" />
        </div>
      ) : groups.length === 0 ? (
        <p className="engineering-board__empty">{t('pmReadingsEmpty')}</p>
      ) : (
        <div className="engineering-board__pm-readings-scroll">
          <div className="engineering-board__pm-readings-grid">
            {groups.map((g) => (
              <article
                key={`${g.wkorder}-${g.machine}-${g.pmlist}`}
                className="engineering-board__pm-reading-card"
              >
                <header className="engineering-board__pm-reading-head">
                  <p className="engineering-board__pm-reading-wo">WO {g.wkorder}</p>
                  <p className="engineering-board__pm-reading-meta">
                    <Activity className="inline size-3 align-[-0.1em]" aria-hidden />{' '}
                    {g.kindLabel}
                  </p>
                  <p className="engineering-board__pm-reading-machine truncate" title={g.machine}>
                    {g.machine}
                  </p>
                  <p className="engineering-board__pm-reading-pmlist truncate" title={g.pmlist}>
                    {g.pmlist}
                  </p>
                  <p className="engineering-board__pm-reading-latest">
                    {t('latest', { time: formatLatest(g.latestAt) })} · {g.latestV1} / {g.latestV2}{' '}
                    / {g.latestV3} {g.unit}
                  </p>
                </header>
                <div className="engineering-board__pm-reading-chart">
                  <PmMeasurementLineChart
                    points={g.points}
                    axisLabels={g.axisLabels}
                    unit={g.unit}
                  />
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
