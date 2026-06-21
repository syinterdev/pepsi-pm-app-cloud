import type { ReportsImportCoverage } from '@/api/schemas'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'

type Props = {
  coverage: ReportsImportCoverage
  rowCount: number
  onApplySapRange: (from: string, to: string) => void
}

export function SummaryWeeklyImportHint({ coverage, rowCount, onApplySapRange }: Props) {
  const { t } = useTranslation('reports')

  const hasSap = coverage.iw37nCount > 0
  const hasMh = coverage.manhourCount > 0
  const emptyInRange =
    rowCount === 0 && coverage.workOrdersInRange === 0 && (hasSap || hasMh)
  const wrongRange = hasSap && !coverage.rangeOverlapsSap && coverage.suggestedSapRange

  if (!hasSap && !hasMh) {
    return (
      <div className="app-callout app-tone-warning-callout text-sm">
        {t('summaryWeekly.importHint.noData')}
      </div>
    )
  }

  if (!emptyInRange && !wrongRange) {
    return (
      <div className="app-callout app-callout--emerald space-y-1 text-sm">
        <p>
          {t('summaryWeekly.importHint.readyLead', {
            count: coverage.iw37nCount.toLocaleString(),
          })}
        </p>
        {coverage.iw37nBscstartFrom && coverage.iw37nBscstartTo ? (
          <p className="text-app-muted">
            {t('summaryWeekly.importHint.iw37nRange', {
              from: coverage.iw37nBscstartFrom,
              to: coverage.iw37nBscstartTo,
            })}
          </p>
        ) : null}
        {hasMh && coverage.manhourWorkdayFrom && coverage.manhourWorkdayTo ? (
          <p className="text-app-muted">
            {t('summaryWeekly.importHint.manhourRange', {
              from: coverage.manhourWorkdayFrom,
              to: coverage.manhourWorkdayTo,
            })}
          </p>
        ) : null}
        {coverage.workOrdersInRange > 0 ? (
          <p className="text-app-muted">
            {t('summaryWeekly.importHint.woInRange', {
              count: coverage.workOrdersInRange.toLocaleString(),
            })}
          </p>
        ) : null}
      </div>
    )
  }

  const suggested = coverage.suggestedSapRange

  return (
    <div className={cn('app-callout app-tone-warning-callout space-y-2 text-sm')}>
      <p>
        {t('summaryWeekly.importHint.wrongRange', {
          from: coverage.iw37nBscstartFrom ?? '',
          to: coverage.iw37nBscstartTo ?? '',
        })}
      </p>
      {suggested ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="border-app bg-[var(--app-surface)]"
          onClick={() => onApplySapRange(suggested.from, suggested.to)}
        >
          {t('summaryWeekly.importHint.applySapRange', {
            from: suggested.from,
            to: suggested.to,
          })}
        </Button>
      ) : null}
      {!hasMh ? (
        <p className="text-xs text-app-muted">{t('summaryWeekly.importHint.noManhour')}</p>
      ) : null}
    </div>
  )
}
