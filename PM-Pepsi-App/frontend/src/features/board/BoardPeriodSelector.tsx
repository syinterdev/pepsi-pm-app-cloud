import {
  BOARD_PERIOD_OPTIONS,
  type BoardPeriodId,
} from '@/lib/board-period'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'

export function BoardPeriodSelector({
  value,
  onChange,
  className,
}: {
  value: BoardPeriodId
  onChange: (id: BoardPeriodId) => void
  className?: string
}) {
  const { t } = useTranslation('board')

  return (
    <div
      className={cn('engineering-board__period', className)}
      role="group"
      aria-label={t('period.aria')}
    >
      {BOARD_PERIOD_OPTIONS.map((opt) => (
        <button
          key={opt.id}
          type="button"
          className={cn(
            'engineering-board__period-btn',
            value === opt.id && 'engineering-board__period-btn--active',
          )}
          aria-pressed={value === opt.id}
          onClick={() => onChange(opt.id)}
        >
          {t(`period.${opt.id}`)}
        </button>
      ))}
    </div>
  )
}
