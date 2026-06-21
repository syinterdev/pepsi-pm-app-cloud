import type { z } from 'zod'
import type { workOrderModalDetailSchema } from '@/api/schemas'
import { Button } from '@/components/ui/button'
import { SapPrintFormBrandLogo } from '@/components/pm-vibration/SapPrintFormBrandLogo'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import './sap-wo-print-form.css'

type WoHeader = z.infer<typeof workOrderModalDetailSchema>['woHeader']
type PmListLine = NonNullable<WoHeader['operationLongText']>[number]

function formatPmListLine(line: PmListLine): string {
  const machine = line.machine.trim()
  const pmlist = line.pmlist.trim()
  if (machine && pmlist) return `${machine} — ${pmlist}`
  return machine || pmlist || '—'
}

export type SapPrintVibrationRow = {
  key: string
  machine: string
  pmlist: string
  v1: string
  v2: string
}

export type SapPrintCurrentRow = {
  key: string
  machine: string
  pmlist: string
  v1: string
  v2: string
  v3: string
}

export type SapPrintCompletion = {
  completionDate: string
  timeStart: string
  timeEnd: string
  completed: '' | 'Y' | 'N'
  completedBy: string
}

function displayField(value: string | undefined): string {
  const v = (value ?? '').trim()
  return v || '—'
}

function Inline({ label, value }: { label: string; value: string }) {
  const display = displayField(value)
  return (
    <span>
      <span className="sap-wo-print__inline">{label}:</span> <span>{display}</span>
    </span>
  )
}

function WoBarcode({ value }: { value: string }) {
  if (!value.trim()) return null
  const bars = value.split('').flatMap((ch) => {
    const n = ch.charCodeAt(0)
    return [Math.max(1, n % 3), 1, Math.max(1, n % 4)]
  })
  const width = bars.length * 3
  return (
    <svg
      className="sap-wo-print__barcode"
      viewBox={`0 0 ${width} 32`}
      preserveAspectRatio="none"
      aria-hidden
    >
      {bars.map((w, i) => (
        <rect key={`${i}-${w}`} x={i * 3} y={0} width={w} height={32} fill="#000" />
      ))}
    </svg>
  )
}

type Props = {
  header: WoHeader
  currentRows: SapPrintCurrentRow[]
  vibrationRows?: SapPrintVibrationRow[]
  vibrationWarningLimit?: string
  vibrationAlarmLimit?: string
  measuredAtLocal: string
  completion: SapPrintCompletion
  canWrite: boolean
  saving?: boolean
  savingVibration?: boolean
  selectWoHint?: string
  onCurrentRowChange: (key: string, field: 'v1' | 'v2' | 'v3', value: string) => void
  onVibrationRowChange?: (key: string, field: 'v1' | 'v2', value: string) => void
  onVibrationLimitsChange?: (field: 'warning' | 'alarm', value: string) => void
  onMeasuredAtChange: (value: string) => void
  onCompletionChange: (patch: Partial<SapPrintCompletion>) => void
  onSave: () => void
  onSaveVibration?: () => void
}

export function WorkOrderPmSapPrintForm({
  header,
  currentRows,
  vibrationRows = [],
  vibrationWarningLimit = '',
  vibrationAlarmLimit = '',
  measuredAtLocal,
  completion,
  canWrite,
  saving,
  savingVibration,
  selectWoHint,
  onCurrentRowChange,
  onVibrationRowChange,
  onVibrationLimitsChange,
  onMeasuredAtChange,
  onCompletionChange,
  onSave,
  onSaveVibration,
}: Props) {
  const { t } = useTranslation('pmVibration')

  const pmListLines = useMemo(() => {
    const fromHeader = header.operationLongText ?? []
    if (fromHeader.length > 0) return fromHeader
    return currentRows.map((row, index) => ({
      lineNo: index + 1,
      machine: row.machine,
      pmlist: row.pmlist,
    }))
  }, [header.operationLongText, currentRows])

  const man = displayField(header.man)
  const machineRunStatus = displayField(header.machineRunStatus)

  return (
    <section className="sap-wo-print" aria-label={t('formHeader.sectionAria')}>
      <div className="sap-wo-print__top">
        <div>
          <span className="sap-wo-print__wo-label">{t('formHeader.workOrder')}:</span>{' '}
          <span className="sap-wo-print__wo-number">{header.wkorder || '—'}</span>
        </div>
        <SapPrintFormBrandLogo />
      </div>
      <WoBarcode value={header.wkorder} />
      {header.printMetaLine ? <p className="sap-wo-print__meta">{header.printMetaLine}</p> : null}

      <hr className="sap-wo-print__rule" />

      <div className="sap-wo-print__row">
        <div className="sap-wo-print__pair">
          <Inline label={t('formHeader.functionalLocation')} value={header.functionalLocation} />
        </div>
        <div className="sap-wo-print__pair sap-wo-print__pair--right">
          <Inline label={t('formHeader.descriptionFl')} value={header.descriptionLine1} />
        </div>
      </div>
      <div className="sap-wo-print__row">
        <div className="sap-wo-print__pair">
          <Inline label={t('formHeader.equipment')} value={header.equipment} />
        </div>
        <div className="sap-wo-print__pair sap-wo-print__pair--right">
          <Inline label={t('formHeader.descriptionEquipment')} value={header.descriptionLine2} />
        </div>
      </div>

      <hr className="sap-wo-print__rule" />

      <div className="sap-wo-print__grid-2">
        <div>
          <div className="sap-wo-print__row">
            <Inline label={t('formHeader.startDate')} value={header.startDate} />
          </div>
          <div className="sap-wo-print__row">
            <Inline label={t('formHeader.activityType')} value={header.activityType} />
          </div>
          <div className="sap-wo-print__row">
            <Inline label={t('formHeader.revision')} value={header.revision} />
          </div>
        </div>
        <div>
          <div className="sap-wo-print__row">
            <Inline label={t('formHeader.man')} value={man} />
          </div>
          <div className="sap-wo-print__row">
            <Inline label={t('formHeader.machineRunStatus')} value={machineRunStatus} />
          </div>
        </div>
      </div>

      <hr className="sap-wo-print__rule" />

      <div className="sap-wo-print__row">
        <Inline label={t('formHeader.headerShortText')} value={header.headerShortText} />
      </div>

      <hr className="sap-wo-print__rule" />

      <div className="sap-wo-print__row">
        <div className="sap-wo-print__pair">
          <Inline label={t('formHeader.operation')} value={header.operationNumber} />
        </div>
        <div className="sap-wo-print__pair sap-wo-print__pair--right">
          <Inline label={t('formHeader.workCentre')} value={header.operationWorkCentre} />
        </div>
      </div>
      <div className="sap-wo-print__row">
        <div className="sap-wo-print__pair">
          <Inline label={t('formHeader.operationText')} value={header.operationText} />
        </div>
        <div className="sap-wo-print__pair sap-wo-print__pair--right">
          <Inline label={t('formHeader.unloadingPoint')} value={header.unloadingPoint} />
        </div>
      </div>

      <hr className="sap-wo-print__rule" />

      <p className="sap-wo-print__longtext-title">{t('paperForm.operationLongText')}</p>
      {pmListLines.length > 0 ? (
        <ol className="sap-wo-print__pm-list">
          {pmListLines.map((line) => (
            <li key={`${line.lineNo}-${line.machine}-${line.pmlist}`}>
              {formatPmListLine(line)}
            </li>
          ))}
        </ol>
      ) : (
        <p className="sap-wo-print__pm-list-empty">{t('noTasks')}</p>
      )}

      <p className="sap-wo-print__longtext-sub">{t('paperForm.current3PhaseTitle')}</p>

      <div className="px-[0.6rem] pb-2">
        <table className="sap-wo-print__measure-table">
          <thead>
            <tr>
              <th className="text-left">{t('paperForm.machineColumn')}</th>
              <th>{t('phaseR')}</th>
              <th>{t('phaseS')}</th>
              <th>{t('phaseT')}</th>
            </tr>
          </thead>
          <tbody>
            {currentRows.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center text-[10px]">
                  {t('noTasks')}
                </td>
              </tr>
            ) : (
              currentRows.map((row) => (
                <tr key={row.key}>
                  <td>
                    <span>{row.machine || row.pmlist || '—'}</span>
                    {row.machine ? (
                      <span className="mt-0.5 block text-[10px] leading-tight">
                        {t('paperForm.taskLineSuffix')}
                      </span>
                    ) : null}
                  </td>
                  {(['v1', 'v2', 'v3'] as const).map((field) => (
                    <td key={field}>
                      <input
                        className="sap-wo-print__input"
                        inputMode="decimal"
                        value={row[field]}
                        disabled={!canWrite}
                        aria-label={`${row.machine} ${field}`}
                        onChange={(e) => onCurrentRowChange(row.key, field, e.target.value)}
                      />
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {vibrationRows.length > 0 ? (
        <>
          <p className="sap-wo-print__longtext-sub">{t('paperForm.vibrationDstDbTitle')}</p>
          <div className="px-[0.6rem] pb-2">
            <table className="sap-wo-print__measure-table">
              <thead>
                <tr>
                  <th className="text-left">{t('paperForm.machineColumn')}</th>
                  <th>{t('dst')}</th>
                  <th>{t('db')}</th>
                </tr>
              </thead>
              <tbody>
                {vibrationRows.map((row) => (
                  <tr key={row.key}>
                    <td>
                      <span>{row.machine || row.pmlist || '—'}</span>
                      {row.pmlist ? (
                        <span className="mt-0.5 block text-[10px] leading-tight text-app-muted">
                          {row.pmlist}
                        </span>
                      ) : null}
                    </td>
                    {(['v1', 'v2'] as const).map((field) => (
                      <td key={field}>
                        <input
                          className="sap-wo-print__input"
                          inputMode="decimal"
                          value={row[field]}
                          disabled={!canWrite}
                          aria-label={`${row.machine} ${field === 'v1' ? t('dst') : t('db')}`}
                          onChange={(e) => onVibrationRowChange?.(row.key, field, e.target.value)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <label className="flex flex-col gap-0.5 text-[11px]">
              <span className="font-semibold">{t('warningLabelDb')}</span>
              <input
                className="sap-wo-print__input"
                inputMode="decimal"
                value={vibrationWarningLimit}
                disabled={!canWrite}
                onChange={(e) => onVibrationLimitsChange?.('warning', e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-0.5 text-[11px]">
              <span className="font-semibold">{t('alarmLabelDb')}</span>
              <input
                className="sap-wo-print__input"
                inputMode="decimal"
                value={vibrationAlarmLimit}
                disabled={!canWrite}
                onChange={(e) => onVibrationLimitsChange?.('alarm', e.target.value)}
              />
            </label>
            <p className="sm:col-span-2 text-[10px] text-app-muted">{t('limitsDbHint')}</p>
          </div>
        </>
      ) : null}

      <div className="sap-wo-print__row">
        <span>{t('paperForm.measuredAt')}:</span>
        <input
          type="datetime-local"
          className="sap-wo-print__input sap-wo-print__input--left max-w-[14rem]"
          value={measuredAtLocal}
          disabled={!canWrite}
          onChange={(e) => onMeasuredAtChange(e.target.value)}
        />
      </div>

      <hr className="sap-wo-print__rule" />

      <div className="sap-wo-print__completion">
        <p className="font-bold">{t('paperForm.completionTitle')}</p>
        <div className="sap-wo-print__completion-grid">
          <label className="flex items-center gap-2">
            <span>{t('paperForm.completionDate')}:</span>
            <input
              type="date"
              className="sap-wo-print__input sap-wo-print__input--left flex-1"
              value={completion.completionDate}
              disabled={!canWrite}
              onChange={(e) => onCompletionChange({ completionDate: e.target.value })}
            />
          </label>
          <label className="flex items-center gap-2">
            <span>{t('paperForm.duration')}:</span>
            <input
              type="time"
              className="sap-wo-print__input w-[5.5rem]"
              value={completion.timeStart}
              disabled={!canWrite}
              onChange={(e) => onCompletionChange({ timeStart: e.target.value })}
            />
            <span>–</span>
            <input
              type="time"
              className="sap-wo-print__input w-[5.5rem]"
              value={completion.timeEnd}
              disabled={!canWrite}
              onChange={(e) => onCompletionChange({ timeEnd: e.target.value })}
            />
          </label>
          <label className="flex items-center gap-2">
            <span>{t('paperForm.completed')}:</span>
            <select
              className="sap-wo-print__input sap-wo-print__input--left max-w-[5rem]"
              value={completion.completed}
              disabled={!canWrite}
              onChange={(e) =>
                onCompletionChange({ completed: e.target.value as SapPrintCompletion['completed'] })
              }
            >
              <option value="">—</option>
              <option value="Y">Y</option>
              <option value="N">N</option>
            </select>
          </label>
          <label className="flex items-center gap-2">
            <span>{t('paperForm.completedBy')}:</span>
            <input
              className="sap-wo-print__input sap-wo-print__input--left flex-1"
              value={completion.completedBy}
              disabled={!canWrite}
              onChange={(e) => onCompletionChange({ completedBy: e.target.value })}
            />
          </label>
        </div>
      </div>

      <div className="sap-wo-print__actions flex flex-wrap gap-2">
        {!canWrite && selectWoHint ? (
          <p className="app-tone-warning-label mb-2 w-full text-xs">{selectWoHint}</p>
        ) : null}
        {currentRows.length > 0 ? (
          <Button type="button" size="sm" disabled={!canWrite || saving} onClick={onSave}>
            {saving ? t('saving') : t('paperForm.saveCurrentReadings')}
          </Button>
        ) : null}
        {vibrationRows.length > 0 ? (
          <Button
            type="button"
            size="sm"
            disabled={!canWrite || savingVibration || !onSaveVibration}
            onClick={() => onSaveVibration?.()}
          >
            {savingVibration ? t('saving') : t('paperForm.saveVibrationReadings')}
          </Button>
        ) : null}
      </div>
    </section>
  )
}
