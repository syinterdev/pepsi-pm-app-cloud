import { EngUtilizationChart } from '@/features/reports/EngUtilizationChart'
import { toEngUtilizationChartRows } from '@/lib/eng-utilization-chart'
import type { SummaryWeeklyRow } from '@/api/schemas'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

const BOARD_CHART_TOP_N = 12

type Props = {
  rows: SummaryWeeklyRow[] | undefined
  loading: boolean
  error: Error | null
  rangeLabel: string
  showRca: boolean
  kioskDark?: boolean
}

export function BoardEngUtilizationStackedChart({
  rows,
  loading,
  error,
  rangeLabel,
  showRca,
  kioskDark = true,
}: Props) {
  const { t } = useTranslation('board')

  const chartRows = useMemo(() => {
    const all = rows ? toEngUtilizationChartRows(rows) : []
    return [...all].sort((a, b) => b.hrHour - a.hrHour).slice(0, BOARD_CHART_TOP_N)
  }, [rows])

  return (
    <section className="engineering-board__panel engineering-board__panel--chart">
      <div className="engineering-board__panel-head">
        <h2 className="engineering-board__panel-title engineering-board__panel-title--flush">
          {t('util.stackedTitle', { label: rangeLabel })}
        </h2>
      </div>
      {loading ? (
        <p className="text-body-sm opacity-60">{t('util.loadingChart')}</p>
      ) : error ? (
        <p className="text-body-sm text-form-error">{error.message}</p>
      ) : (
        <div className="engineering-board__chart-zone">
          <EngUtilizationChart
            items={chartRows}
            layout="fullscreen"
            showRca={showRca}
            kioskDark={kioskDark}
          />
        </div>
      )}
      {!loading && !error && chartRows.length > 0 ? (
        <p className="engineering-board__panel-foot">
          {t('util.chartFoot', { count: chartRows.length })}
        </p>
      ) : null}
    </section>
  )
}
