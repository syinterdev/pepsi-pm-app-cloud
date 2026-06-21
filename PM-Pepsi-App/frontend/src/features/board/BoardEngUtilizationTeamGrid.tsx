import { EngUtilizationTeamGrid } from '@/features/reports/EngUtilizationTeamGrid'
import { boardPersonnelAvatarUrl } from '@/lib/board-personnel-avatar'
import { toEngUtilizationChartRows } from '@/lib/eng-utilization-chart'
import type { SummaryWeeklyRow } from '@/api/schemas'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

type Props = {
  rows: SummaryWeeklyRow[] | undefined
  loading: boolean
  error: Error | null
  rangeLabel: string
  showRca: boolean
}

export function BoardEngUtilizationTeamGrid({
  rows,
  loading,
  error,
  rangeLabel,
  showRca,
}: Props) {
  const { t } = useTranslation('board')

  const people = useMemo(() => {
    const all = rows ? toEngUtilizationChartRows(rows) : []
    return [...all].sort((a, b) => b.hrHour - a.hrHour)
  }, [rows])

  return (
    <section className="engineering-board__panel engineering-board__panel--team">
      <div className="engineering-board__panel-head">
        <h2 className="engineering-board__panel-title">
          {t('util.teamGridTitle', { label: rangeLabel })}
          <span className="engineering-board__panel-badge">{people.length}</span>
        </h2>
      </div>
      {loading ? (
        <p className="text-body-sm opacity-60">{t('util.loadingPeople')}</p>
      ) : error ? (
        <p className="text-body-sm text-form-error">{error.message}</p>
      ) : (
        <div className="engineering-board__team-scroll">
          <EngUtilizationTeamGrid
            people={people}
            showRca={showRca}
            variant="kiosk"
            imageUrl={boardPersonnelAvatarUrl}
          />
        </div>
      )}
    </section>
  )
}
