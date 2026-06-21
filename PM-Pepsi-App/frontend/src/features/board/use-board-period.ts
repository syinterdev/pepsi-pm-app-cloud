import {
  formatBoardPeriodRangeLabel,
  readBoardPeriod,
  resolveBoardPeriodDateRange,
  writeBoardPeriod,
  type BoardPeriodId,
} from '@/lib/board-period'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

export function useBoardPeriod() {
  const { t } = useTranslation('board')
  const [period, setPeriodState] = useState<BoardPeriodId>(() => readBoardPeriod())

  const range = useMemo(() => resolveBoardPeriodDateRange(period), [period])

  const rangeLabel = useMemo(
    () => formatBoardPeriodRangeLabel(period, range, t(`period.${period}`)),
    [period, range, t],
  )

  const setPeriod = useCallback((id: BoardPeriodId) => {
    writeBoardPeriod(id)
    setPeriodState(id)
  }, [])

  return { period, range, rangeLabel, setPeriod }
}
