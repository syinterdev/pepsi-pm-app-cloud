import type { BoardThemeId } from '@/lib/board-theme'
import { useTranslation } from 'react-i18next'

type Props = {
  value: BoardThemeId
  onChange: (theme: BoardThemeId) => void
}

export function BoardThemeToggle({ value, onChange }: Props) {
  const { t } = useTranslation('board')

  return (
    <div className="engineering-board__theme-toggle" role="group" aria-label={t('theme.toggle')}>
      {(['dark', 'light'] as const).map((id) => (
        <button
          key={id}
          type="button"
          className={
            value === id
              ? 'engineering-board__theme-btn engineering-board__theme-btn--active'
              : 'engineering-board__theme-btn'
          }
          aria-pressed={value === id}
          onClick={() => onChange(id)}
        >
          {id === 'dark' ? '🌙' : '☀️'} {t(`theme.${id}`)}
        </button>
      ))}
    </div>
  )
}
