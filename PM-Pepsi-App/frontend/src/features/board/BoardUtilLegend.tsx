import { useTranslation } from 'react-i18next'

type Props = {
  showRca: boolean
}

export function BoardUtilLegend({ showRca }: Props) {
  const { t } = useTranslation('board')

  return (
    <div className="engineering-board__legend" aria-hidden>
      <span className="engineering-board__legend-item engineering-board__legend-item--pm">
        {t('util.legendPm')}
      </span>
      <span className="engineering-board__legend-item engineering-board__legend-item--re">
        {t('util.legendReactive')}
      </span>
      {showRca ? (
        <span className="engineering-board__legend-item engineering-board__legend-item--rca">
          {t('util.legendRca')}
        </span>
      ) : null}
    </div>
  )
}
