import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'

export type BoardTeamId = 'all' | 'A' | 'B' | 'EE' | 'UT'

const TEAM_IDS: readonly BoardTeamId[] = ['all', 'A', 'B', 'EE', 'UT'] as const

export function BoardTeamSelector({
  value,
  onChange,
  className,
}: {
  value: BoardTeamId
  onChange: (id: BoardTeamId) => void
  className?: string
}) {
  const { t } = useTranslation('board')

  return (
    <div
      className={cn('engineering-board__period', className)}
      role="group"
      aria-label={t('team.aria')}
    >
      {TEAM_IDS.map((id) => (
        <button
          key={id}
          type="button"
          className={cn(
            'engineering-board__period-btn',
            value === id && 'engineering-board__period-btn--active',
          )}
          aria-pressed={value === id}
          onClick={() => onChange(id)}
        >
          {t(`team.${id}`)}
        </button>
      ))}
    </div>
  )
}
