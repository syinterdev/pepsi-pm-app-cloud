import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { MasterPlanWorkbook } from '@/lib/master-plan-api'
import { cn } from '@/lib/utils'
import { Command } from 'cmdk'
import { Check, ChevronDown, Search } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

/** EE/ME use scrollable tabs (≤16 sheets); PK (37) uses search dropdown — UAT A5 ≤3 clicks STAX→BCP */
export const MASTER_PLAN_SHEET_TAB_LIMIT = 16

export function masterPlanSheetCommandValue(sheetName: string, rowCount: number): string {
  return `${sheetName} ${rowCount}`
}

/** Same filter semantics as cmdk search in the sheet picker. */
export function filterMasterPlanSheetsByQuery<T extends { sheetName: string; rowCount: number }>(
  sheets: T[],
  query: string,
): T[] {
  const q = query.trim().toLowerCase()
  if (!q) return sheets
  return sheets.filter((sheet) =>
    masterPlanSheetCommandValue(sheet.sheetName, sheet.rowCount).toLowerCase().includes(q),
  )
}

type SheetSummary = MasterPlanWorkbook['sheets'][number]

type MasterPlanSheetPickerProps = {
  sheets: SheetSummary[]
  selectedSheetId: number | null
  onSelect: (sheetId: number) => void
}

function sheetTabClass(active: boolean): string {
  return cn(
    'shrink-0 rounded-t-md border border-b-0 px-3 py-1.5 text-xs font-medium transition-colors',
    active
      ? 'border-[#2f5597]/50 bg-[#2f5597] text-white'
      : 'border-transparent bg-[#e9eff7] text-[#1f3864] hover:bg-[#dae3f3]',
  )
}

function SheetRowCount({ count, active }: { count: number; active?: boolean }) {
  const { t } = useTranslation('masterData')
  return (
    <span
      className={cn(
        'tabular-nums',
        active ? 'text-white/80' : 'text-[#1f3864]/60',
      )}
    >
      ({t('masterPlan.rowCount', { count })})
    </span>
  )
}

function SheetTabs({
  sheets,
  selectedSheetId,
  onSelect,
}: MasterPlanSheetPickerProps) {
  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-max gap-0.5 border-b-2 border-[#2f5597]/30 pb-0">
        {sheets.map((sheet) => {
          const active = sheet.id === selectedSheetId
          return (
            <button
              key={sheet.id}
              type="button"
              onClick={() => onSelect(sheet.id)}
              className={sheetTabClass(active)}
            >
              <span className="whitespace-nowrap">
                {sheet.sheetName}{' '}
                <SheetRowCount count={sheet.rowCount} active={active} />
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function SheetSearchPicker({
  sheets,
  selectedSheetId,
  onSelect,
}: MasterPlanSheetPickerProps) {
  const { t } = useTranslation('masterData')
  const [open, setOpen] = useState(false)
  const selected = sheets.find((s) => s.id === selectedSheetId) ?? sheets[0]

  const triggerLabel = selected
    ? `${selected.sheetName} (${t('masterPlan.rowCount', { count: selected.rowCount })})`
    : t('masterPlan.sheetPickerPlaceholder')

  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-app-muted">
        {t('masterPlan.sheetPickerLabel')}
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            aria-expanded={open}
            className="h-10 w-full max-w-md justify-between gap-2 border-[#2f5597]/30 bg-[#e9eff7]/40 font-normal text-[#1f3864] hover:bg-[#dae3f3]/60 sm:w-auto sm:min-w-[min(100%,20rem)]"
          >
            <span className="truncate text-left text-xs sm:text-body-sm">{triggerLabel}</span>
            <ChevronDown className="size-4 shrink-0 opacity-60" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[min(calc(100vw-2rem),24rem)] p-0">
          <Command label={t('masterPlan.sheetSearch')} shouldFilter>
            <div className="flex items-center gap-2 border-b border-app/60 px-3">
              <Search className="size-4 shrink-0 opacity-50" aria-hidden />
              <span className="sr-only">{t('masterPlan.sheetSearch')}</span>
              <Command.Input
                aria-label={t('masterPlan.sheetSearch')}
                placeholder={t('masterPlan.sheetSearchPlaceholder')}
                className="h-10 w-full bg-transparent text-sm text-app outline-none placeholder:text-app-muted"
              />
            </div>
            <Command.List className="max-h-72 overflow-y-auto p-1.5">
              <Command.Empty className="py-6 text-center text-xs text-app-muted">
                {t('masterPlan.sheetSearchEmpty')}
              </Command.Empty>
              <Command.Group>
                {sheets.map((sheet) => (
                  <Command.Item
                    key={sheet.id}
                    value={masterPlanSheetCommandValue(sheet.sheetName, sheet.rowCount)}
                    onSelect={() => {
                      onSelect(sheet.id)
                      setOpen(false)
                    }}
                    className="flex cursor-pointer items-center justify-between gap-3 rounded-md px-2 py-2 text-xs aria-selected:bg-[#dae3f3]/80 sm:text-body-sm"
                  >
                    <span className="min-w-0 flex-1 truncate">{sheet.sheetName}</span>
                    <span className="flex shrink-0 items-center gap-2 tabular-nums text-app-muted">
                      {t('masterPlan.rowCount', { count: sheet.rowCount })}
                      {sheet.id === selectedSheetId ? (
                        <Check className="size-4 text-[#2f5597]" aria-hidden />
                      ) : (
                        <span className="size-4" aria-hidden />
                      )}
                    </span>
                  </Command.Item>
                ))}
              </Command.Group>
            </Command.List>
          </Command>
        </PopoverContent>
      </Popover>
      <p className="text-xs text-app-muted">
        {t('masterPlan.sheetCount', { count: sheets.length })}
      </p>
    </div>
  )
}

export function MasterPlanSheetPicker(props: MasterPlanSheetPickerProps) {
  if (props.sheets.length > MASTER_PLAN_SHEET_TAB_LIMIT) {
    return <SheetSearchPicker {...props} />
  }
  return <SheetTabs {...props} />
}
