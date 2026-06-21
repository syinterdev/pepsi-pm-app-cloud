import type { PersonnelConfirmRow } from '@/api/schemas'
import { Clock, ImageIcon, Users } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

type Props = {
  selectedIds: number[]
  items: PersonnelConfirmRow[]
}

export function MassConfirmSelectionSummary({ selectedIds, items }: Props) {
  const { t } = useTranslation('personnel')

  const stats = useMemo(() => {
    const selected = items.filter((it) => selectedIds.includes(it.idiw37))
    if (selected.length === 0) return null
    const avgClose = Math.round(
      selected.reduce((sum, row) => sum + row.percentClose, 0) / selected.length,
    )
    const withConfirm = selected.filter((row) => row.hasConfirm).length
    const fullyClosed = selected.filter((row) => row.percentClose >= 100).length
    const planDates = selected
      .map((row) => row.bscStart)
      .filter((d): d is string => Boolean(d?.trim()))
    const planRange =
      planDates.length > 0
        ? `${planDates.sort()[0]} – ${planDates.sort().at(-1)}`
        : null
    return { count: selected.length, avgClose, withConfirm, fullyClosed, planRange }
  }, [items, selectedIds])

  if (!stats) return null

  return (
    <div
      className="app-tone-info-callout flex flex-col gap-2 rounded-xl border px-3 py-3 text-sm sm:flex-row sm:flex-wrap sm:items-center sm:gap-4"
      role="status"
    >
      <p className="font-medium text-app">
        {t('confirm.massSummary.selected', { count: stats.count })}
      </p>
      <p className="flex items-center gap-1.5 text-xs text-app-muted">
        <Users className="size-3.5 shrink-0" aria-hidden />
        {t('confirm.massSummary.avgClose', { percent: stats.avgClose })}
        {' · '}
        {t('confirm.massSummary.fullyClosed', { count: stats.fullyClosed })}
      </p>
      <p className="flex items-center gap-1.5 text-xs text-app-muted">
        <ImageIcon className="size-3.5 shrink-0" aria-hidden />
        {t('confirm.massSummary.withConfirm', { count: stats.withConfirm })}
      </p>
      {stats.planRange ? (
        <p className="flex items-center gap-1.5 text-xs text-app-muted">
          <Clock className="size-3.5 shrink-0" aria-hidden />
          {t('confirm.massSummary.planRange', { range: stats.planRange })}
        </p>
      ) : null}
      <p className="text-caption sm:min-w-[12rem] sm:flex-1">{t('confirm.massSummary.hint')}</p>
    </div>
  )
}
