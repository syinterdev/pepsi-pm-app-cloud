import { arrayLength } from '@/lib/coerce-array'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  fetchMasterPlanSearch,
  type MasterPlanDiscipline,
  type MasterPlanSearchItem,
} from '@/lib/master-plan-api'
import { cn } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { Search, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

type Props = {
  discipline: MasterPlanDiscipline
  value: string
  onChange: (value: string) => void
  onJumpToResult: (item: MasterPlanSearchItem) => void
  currentSheetMatchCount?: number
  loadedRowCount?: number
}

const MIN_QUERY_CHARS = 1
const DEBOUNCE_MS = 280

export function MasterPlanSearchBar({
  discipline,
  value,
  onChange,
  onJumpToResult,
  currentSheetMatchCount,
  loadedRowCount,
}: Props) {
  const { t } = useTranslation('masterData')
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [value])

  const trimmed = debounced.trim()
  const crossSheetQ = useQuery({
    queryKey: ['master-plan', 'search', discipline, trimmed],
    queryFn: () => fetchMasterPlanSearch(discipline, trimmed),
    enabled: trimmed.length >= MIN_QUERY_CHARS,
    placeholderData: (prev) => prev,
  })

  const items = crossSheetQ.data?.items ?? []
  const showResults = trimmed.length >= MIN_QUERY_CHARS && items.length > 0

  return (
    <div className="rounded-xl border border-[#2f5597]/35 bg-[#e9eff7]/90 p-3 shadow-sm ring-1 ring-white/10">
      <Label
        htmlFor="master-plan-search"
        className="text-xs font-semibold tracking-wide text-[#1f3864]"
      >
        {t('masterPlan.rowSearchLabel')}
      </Label>
      <div className="relative mt-1.5 max-w-2xl">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#2f5597]"
          aria-hidden
        />
        <Input
          id="master-plan-search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t('masterPlan.rowSearchPlaceholder')}
          className="h-10 border-[#2f5597]/40 bg-white pl-9 pr-9 text-sm text-[#1f3864] shadow-inner placeholder:text-[#1f3864]/45"
        />
        {value ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 size-8 -translate-y-1/2 text-[#1f3864]/70 hover:bg-[#dae3f3]/80 hover:text-[#1f3864]"
            onClick={() => onChange('')}
            aria-label={t('masterPlan.rowSearchClear')}
          >
            <X className="size-4" aria-hidden />
          </Button>
        ) : null}
      </div>

      {!value.trim() ? (
        <p className="mt-2 text-xs font-medium text-[#1f3864]/80">{t('masterPlan.rowSearchHint')}</p>
      ) : currentSheetMatchCount != null && loadedRowCount != null ? (
        <p className="mt-2 text-xs font-medium text-[#1f3864]">
          {t('masterPlan.rowSearchCurrentSheet', {
            matches: currentSheetMatchCount,
            loaded: loadedRowCount,
          })}
        </p>
      ) : null}

      {trimmed.length >= MIN_QUERY_CHARS && crossSheetQ.isFetching ? (
        <p className="mt-2 text-xs font-medium text-[#1f3864]/80">{t('masterPlan.rowSearchLoading')}</p>
      ) : null}

      {showResults ? (
        <div className="mt-2 max-w-3xl rounded-lg border border-[#2f5597]/30 bg-white p-2 shadow-sm">
          <p className="px-1 pb-1 text-[10px] font-semibold uppercase tracking-wide text-[#2f5597]">
            {t('masterPlan.rowSearchWorkbook', { count: items.length })}
          </p>
          <ul className="max-h-56 space-y-1 overflow-y-auto">
            {items.map((item) => (
              <li key={item.rowId}>
                <button
                  type="button"
                  onClick={() => onJumpToResult(item)}
                  className={cn(
                    'w-full rounded-md px-2 py-1.5 text-left text-xs transition-colors',
                    'hover:bg-[#dae3f3]/80 sm:text-body-sm',
                  )}
                >
                  <span className="font-medium text-[#1f3864]">{item.sheetName}</span>
                  <span className="text-[#1f3864]/70">
                    {' '}
                    · {t('masterPlan.changelogRow', { row: item.rowIndex })}
                  </span>
                  {item.label ? (
                    <span className="mt-0.5 block truncate text-[#1f3864]/85">{item.label}</span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {trimmed.length >= MIN_QUERY_CHARS &&
      !crossSheetQ.isFetching &&
      crossSheetQ.data != null && arrayLength(crossSheetQ.data.items) === 0 ? (
        <p className="mt-2 text-xs font-medium text-[#1f3864]/80">{t('masterPlan.rowSearchEmpty')}</p>
      ) : null}
    </div>
  )
}
