import { Button } from '@/components/ui/button'
import { APP_INTERACTIVE_MOTION } from '@/lib/app-motion'
import {
  WORK_ORDER_TEAM_OPTIONS,
  type WorkOrderTeamField,
} from '@/lib/wo-team'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'

type Props = {
  selectedCount: number
  totalCount: number
  disabled?: boolean
  saving?: boolean
  onApplyTeam: (team: WorkOrderTeamField) => void
  onSave: () => void
}

export function WoConfirmationTeamBar({
  selectedCount,
  totalCount,
  disabled = false,
  saving = false,
  onApplyTeam,
  onSave,
}: Props) {
  const { t } = useTranslation('workOrders')

  return (
    <div className="app-tone-info-callout flex flex-col gap-3 rounded-xl border px-3 py-3 sm:flex-row sm:flex-wrap sm:items-center">
      <p className="text-xs font-medium text-app tabular-nums">
        {t('teamBulk.selected', { count: selectedCount, total: totalCount })}
      </p>
      <div className="flex flex-wrap items-center gap-3 text-xs">
        {WORK_ORDER_TEAM_OPTIONS.map((code) => (
          <label key={code} className="flex cursor-pointer items-center gap-1.5">
            <input
              type="radio"
              name="wo-bulk-team"
              className="accent-[var(--app-accent)]"
              disabled={disabled || saving || selectedCount === 0}
              onChange={() => onApplyTeam(code)}
            />
            {t('teamBulk.teamLabel', { team: code })}
          </label>
        ))}
        <label className="flex cursor-pointer items-center gap-1.5 text-app-muted">
          <input
            type="radio"
            name="wo-bulk-team"
            className="accent-[var(--app-accent)]"
            disabled={disabled || saving || selectedCount === 0}
            onChange={() => onApplyTeam('')}
          />
          {t('teamBulk.clearTeam')}
        </label>
      </div>
      <Button
        type="button"
        size="sm"
        className={cn('shrink-0', APP_INTERACTIVE_MOTION)}
        disabled={disabled || saving || selectedCount === 0}
        onClick={onSave}
      >
        {saving ? t('teamBulk.saving') : t('teamBulk.saveBatch')}
      </Button>
      <p className="text-caption sm:min-w-[12rem] sm:flex-1">{t('teamBulk.hint')}</p>
    </div>
  )
}
