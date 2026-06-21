import { AppCard } from '@/components/layout/AppCard'
import {
  FilterDateDrawer,
  FilterDateDrawerTrigger,
} from '@/components/layout/FilterDateDrawer'
import { Button } from '@/components/ui/button'
import { PEPSI_WORK_WEEK_HELP } from '@/lib/pepsi-work-week'
import { DatePicker } from '@/components/ui/date-picker'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { format, subDays } from 'date-fns'
import { Search } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

export type ReportsDateFilterValue = {
  from: string
  to: string
  weeksBack?: number
}

export function defaultReportsDateRange(days = 30): ReportsDateFilterValue {
  const to = new Date()
  const from = subDays(to, days)
  return {
    from: format(from, 'yyyy-MM-dd'),
    to: format(to, 'yyyy-MM-dd'),
  }
}

type Props = {
  initial?: ReportsDateFilterValue
  showWeeksBack?: boolean
  onSearch: (value: ReportsDateFilterValue) => void
}

export function ReportsDateFilter({ initial, showWeeksBack, onSearch }: Props) {
  const { t } = useTranslation('reports')

  function formatSummary(from: string, to: string): string {
    if (from && to) return t('dateFilter.summaryRange', { from, to })
    if (from || to) return from || to
    return t('dateFilter.summaryEmpty')
  }
  const base = initial ?? defaultReportsDateRange()
  const [fromDate, setFromDate] = useState(base.from)
  const [toDate, setToDate] = useState(base.to)
  const [weeksBack, setWeeksBack] = useState(String(base.weeksBack ?? 8))
  const [drawerOpen, setDrawerOpen] = useState(false)

  const applyDisabled = !fromDate || !toDate

  const apply = () => {
    onSearch({
      from: fromDate,
      to: toDate,
      weeksBack: showWeeksBack ? Number(weeksBack) || 8 : undefined,
    })
  }

  const fields = (
    <>
      <div className="space-y-1">
        <Label htmlFor="reports-from">{t('dateFilter.from')}</Label>
        <DatePicker id="reports-from" value={fromDate} onChange={setFromDate} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="reports-to">{t('dateFilter.to')}</Label>
        <DatePicker id="reports-to" value={toDate} onChange={setToDate} />
      </div>
      {showWeeksBack ? (
        <div className="space-y-1">
          <Label htmlFor="reports-weeks">{t('dateFilter.weeksBack')}</Label>
          <Input
            id="reports-weeks"
            type="number"
            min={4}
            max={16}
            className="w-full sm:w-24"
            value={weeksBack}
            onChange={(e) => setWeeksBack(e.target.value)}
          />
        </div>
      ) : null}
    </>
  )

  return (
    <div className="space-y-2">
      <p className="text-xs text-app-muted">{PEPSI_WORK_WEEK_HELP}</p>

      <FilterDateDrawerTrigger
        summary={formatSummary(fromDate, toDate)}
        onOpen={() => setDrawerOpen(true)}
      />

      <FilterDateDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title={t('dateFilter.drawerTitle')}
        summary={formatSummary(fromDate, toDate)}
        applyDisabled={applyDisabled}
        applyLabel={t('dateFilter.apply')}
        onApply={apply}
      >
        <div className="space-y-4">{fields}</div>
      </FilterDateDrawer>

      <AppCard pad="compact" className="hidden flex-wrap items-end gap-3 lg:flex">
        {fields}
        <Button
          type="button"
          data-testid="reports-date-apply"
          disabled={applyDisabled}
          onClick={apply}
        >
          <Search className="mr-2 size-4" aria-hidden />
          {t('dateFilter.apply')}
        </Button>
      </AppCard>

    </div>
  )
}
