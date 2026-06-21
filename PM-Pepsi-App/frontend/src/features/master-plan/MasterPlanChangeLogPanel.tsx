import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  exportMasterPlanChangesCsv,
  formatMasterPlanChangeValue,
} from '@/features/master-plan/master-plan-changelog'
import {
  fetchMasterPlanChanges,
  type MasterPlanDiscipline,
  type MasterPlanWorkbook,
} from '@/lib/master-plan-api'
import { useQuery } from '@tanstack/react-query'
import { Calendar, Download, ExternalLink, User } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

/** Force light inputs — app dark theme makes `text-app` white on white fields */
const FIELD_CLASS =
  'h-10 border-slate-300 bg-white text-sm text-slate-900 shadow-sm placeholder:text-slate-500 focus-visible:border-[#2f5597] focus-visible:ring-[#2f5597]/30 [color-scheme:light]'

const LABEL_CLASS = 'text-sm font-semibold text-slate-700'

type MasterPlanChangeLogPanelProps = {
  discipline: MasterPlanDiscipline
  sheets: MasterPlanWorkbook['sheets']
  open: boolean
  onOpenChange: (open: boolean) => void
  onJumpToRow: (sheetId: number, rowId: number, rowIndex?: number) => void
}

function toFromIso(date: string): string | undefined {
  if (!date.trim()) return undefined
  return `${date}T00:00:00.000Z`
}

function toToIso(date: string): string | undefined {
  if (!date.trim()) return undefined
  return `${date}T23:59:59.999Z`
}

function formatWhen(iso: string, locale: string): string {
  try {
    return new Date(iso).toLocaleString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

export function MasterPlanChangeLogPanel({
  discipline,
  sheets,
  open,
  onOpenChange,
  onJumpToRow,
}: MasterPlanChangeLogPanelProps) {
  const { t, i18n } = useTranslation('masterData')
  const [sheetId, setSheetId] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [changedBy, setChangedBy] = useState('')
  const [fieldName, setFieldName] = useState('')

  const queryParams = useMemo(
    () => ({
      discipline,
      sheetId: sheetId ? Number(sheetId) : undefined,
      from: toFromIso(fromDate),
      to: toToIso(toDate),
      changedBy: changedBy.trim() || undefined,
      fieldName: fieldName.trim() || undefined,
      limit: 200,
    }),
    [changedBy, discipline, fieldName, fromDate, sheetId, toDate],
  )

  const changesQ = useQuery({
    queryKey: ['master-plan', 'changes', queryParams],
    queryFn: () => fetchMasterPlanChanges(queryParams),
    enabled: open,
    placeholderData: (prev) => prev,
  })

  const items = changesQ.data?.items ?? []
  const total = changesQ.data?.total ?? 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size="full"
        className="flex max-h-[min(92dvh,860px)] flex-col gap-0 overflow-hidden border-slate-200 bg-white p-0 text-slate-900 [color-scheme:light] [&_[data-dialog-close]]:text-white [&_[data-dialog-close]]:opacity-90 [&_[data-dialog-close]]:hover:opacity-100"
      >
        <DialogHeader className="border-b border-[#1f3864]/30 bg-gradient-to-r from-[#2f5597] to-[#4472c4] px-6 py-5 pr-14 text-left">
          <DialogTitle className="text-lg font-bold text-white">
            {t('masterPlan.changelogTitle')}
          </DialogTitle>
          <DialogDescription className="text-sm text-white/90">
            {t('masterPlan.changelogSubtitle', { discipline })}
          </DialogDescription>
        </DialogHeader>

        <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <Label className={LABEL_CLASS}>{t('masterPlan.changelogSheet')}</Label>
              <select
                value={sheetId}
                onChange={(e) => setSheetId(e.target.value)}
                className={`${FIELD_CLASS} w-full rounded-md px-3`}
              >
                <option value="">{t('masterPlan.changelogAllSheets')}</option>
                {sheets.map((sheet) => (
                  <option key={sheet.id} value={sheet.id}>
                    {sheet.sheetName}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className={LABEL_CLASS}>{t('masterPlan.changelogFrom')}</Label>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className={FIELD_CLASS}
              />
            </div>

            <div className="space-y-1.5">
              <Label className={LABEL_CLASS}>{t('masterPlan.changelogTo')}</Label>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className={FIELD_CLASS}
              />
            </div>

            <div className="space-y-1.5">
              <Label className={LABEL_CLASS}>{t('masterPlan.changedBy')}</Label>
              <Input
                value={changedBy}
                onChange={(e) => setChangedBy(e.target.value)}
                placeholder={t('masterPlan.changelogChangedByPlaceholder')}
                className={FIELD_CLASS}
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2 lg:col-span-2">
              <Label className={LABEL_CLASS}>{t('masterPlan.changelogColumn')}</Label>
              <Input
                value={fieldName}
                onChange={(e) => setFieldName(e.target.value)}
                placeholder={t('masterPlan.changelogColumnPlaceholder')}
                className={FIELD_CLASS}
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-medium text-slate-700">
              {t('masterPlan.changelogCount', { shown: items.length, total })}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 border-slate-300 bg-white text-sm font-medium text-slate-800 hover:bg-slate-100"
              disabled={items.length === 0}
              onClick={() => exportMasterPlanChangesCsv(items, `master-plan-${discipline}-changelog.csv`)}
            >
              <Download className="size-4" />
              {t('masterPlan.changelogExport')}
            </Button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-slate-100 px-6 py-4">
          {changesQ.isLoading && !changesQ.data ? (
            <p className="text-sm text-slate-600">{t('masterPlan.loadingMore')}</p>
          ) : changesQ.isError ? (
            <p className="text-sm font-medium text-red-700">{t('masterPlan.changelogLoadFailed')}</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-slate-600">{t('masterPlan.changelogEmpty')}</p>
          ) : (
            <ul className="space-y-3">
              {items.map((item) => {
                const before = formatMasterPlanChangeValue(item.before)
                const after = formatMasterPlanChangeValue(item.after)
                return (
                  <li
                    key={item.id}
                    className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 space-y-2">
                        <p className="text-base font-semibold text-[#1f3864]">
                          {item.sheetName ?? `#${item.sheetId}`}
                          {item.rowIndex != null
                            ? ` · ${t('masterPlan.changelogRow', { row: item.rowIndex })}`
                            : ''}
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-800">
                            <Calendar className="size-4 shrink-0 text-[#2f5597]" aria-hidden />
                            <span className="text-xs font-bold uppercase tracking-wide text-[#2f5597]">
                              {t('masterPlan.changedAt')}
                            </span>
                            <span className="font-semibold text-slate-900">
                              {formatWhen(item.changedAt, i18n.language)}
                            </span>
                          </span>
                          <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-[#dae3f3] px-3 py-1.5 text-sm text-slate-900">
                            <User className="size-4 shrink-0 text-[#2f5597]" aria-hidden />
                            <span className="text-xs font-bold uppercase tracking-wide text-[#2f5597]">
                              {t('masterPlan.changedBy')}
                            </span>
                            <span className="font-bold">{item.changedBy}</span>
                          </span>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-9 shrink-0 gap-1.5 border-slate-300 bg-white text-sm font-medium text-slate-800 hover:bg-slate-100"
                        onClick={() => {
                          onJumpToRow(item.sheetId, item.rowId, item.rowIndex)
                          onOpenChange(false)
                        }}
                      >
                        <ExternalLink className="size-4" />
                        {t('masterPlan.changelogJumpRow')}
                      </Button>
                    </div>

                    {item.fieldName ? (
                      <p className="mt-3 text-sm font-semibold text-slate-800">{item.fieldName}</p>
                    ) : null}

                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2.5">
                        <p className="text-xs font-bold uppercase tracking-wide text-red-800">
                          {t('masterPlan.before')}
                        </p>
                        <p className="mt-1 break-words text-sm font-semibold text-red-950">
                          {before || '—'}
                        </p>
                      </div>
                      <div className="rounded-lg border border-green-300 bg-green-50 px-3 py-2.5">
                        <p className="text-xs font-bold uppercase tracking-wide text-green-800">
                          {t('masterPlan.after')}
                        </p>
                        <p className="mt-1 break-words text-sm font-semibold text-green-950">
                          {after || '—'}
                        </p>
                      </div>
                    </div>

                    {item.comment ? (
                      <p className="mt-2 text-sm italic text-slate-600">{item.comment}</p>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
