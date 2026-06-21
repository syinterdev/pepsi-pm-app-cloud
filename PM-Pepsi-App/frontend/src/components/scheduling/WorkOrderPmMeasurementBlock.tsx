import type { WorkOrderTaskListItemApi, WoPmExecution, WoPmReading } from '@/api/schemas'
import { PmMeasurementLineChart, type PmDualYAxisConfig } from '@/components/scheduling/PmMeasurementLineChart'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { postWorkOrderPmReading } from '@/lib/api-public'
import {
  filterReadingsForTask,
  readingsToChartPoints,
} from '@/lib/pm-measurement-chart'
import {
  limitsFromLastReading,
  parseOptionalDbLimit,
  resolveVibrationDbLimits,
} from '@/lib/pm-vibration-limits'
import { cn } from '@/lib/utils'
import { useMutation } from '@tanstack/react-query'
import { Activity, LineChart } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

type Props = {
  orderId: string | null
  item: WorkOrderTaskListItemApi
  pmExecution: WoPmExecution
  onSaved: () => void
  highlighted?: boolean
  anchorId?: string
}

const KIND_OPTIONS = [
  { value: 'current_3phase' as const, labelKey: 'pmMeasurement.current3phase' as const },
  { value: 'vibration_dst_db' as const, labelKey: 'pmMeasurement.vibration3axis' as const },
]

const SELECT_CLASS =
  'flex h-9 w-full rounded-button border border-app bg-[var(--app-surface)] px-3 py-1 text-body-sm text-app focus-app-ring focus-visible:outline-none disabled:opacity-50'

function chartCopy(t: ReturnType<typeof useTranslation>['t'], kind: 'current_3phase' | 'vibration_dst_db') {
  if (kind === 'current_3phase') {
    return {
      title: t('pmMeasurement.currentTitle'),
      subtitle: t('pmMeasurement.currentSubtitle'),
    }
  }
  return {
    title: t('pmMeasurement.vibrationTitle'),
    subtitle: t('pmMeasurement.vibrationSubtitle'),
  }
}

function defaultAxisLabels(
  t: ReturnType<typeof useTranslation>['t'],
  kind: 'current_3phase' | 'vibration_dst_db',
): [string, string, string] {
  if (kind === 'vibration_dst_db') {
    return [t('pmMeasurement.dst'), t('pmMeasurement.db'), '']
  }
  return [t('pmMeasurement.phaseR'), t('pmMeasurement.phaseS'), t('pmMeasurement.phaseT')]
}

function defaultUnit(kind: 'current_3phase' | 'vibration_dst_db'): string {
  return kind === 'vibration_dst_db' ? '' : 'A'
}

function isVibrationDstDb(kind: 'current_3phase' | 'vibration_dst_db'): boolean {
  return kind === 'vibration_dst_db'
}

function fallbackAxisLabels(t: ReturnType<typeof useTranslation>['t']): [string, string, string] {
  return [
    t('pmMeasurement.valueN', { n: 1 }),
    t('pmMeasurement.valueN', { n: 2 }),
    t('pmMeasurement.valueN', { n: 3 }),
  ]
}

export function WorkOrderPmMeasurementBlock({
  orderId,
  item,
  pmExecution,
  onSaved,
  highlighted = false,
  anchorId,
}: Props) {
  const { t, i18n } = useTranslation(['scheduling', 'common'])
  const dateLocale = i18n.language.startsWith('th') ? 'th-TH' : 'en-US'
  const inferred =
    item.measurementKind === 'current_3phase' || item.measurementKind === 'vibration_dst_db'
      ? item.measurementKind
      : null
  const [kindOverride, setKindOverride] = useState<'current_3phase' | 'vibration_dst_db' | ''>(
    inferred ?? '',
  )
  const kind = inferred ?? (kindOverride || null)

  const [v1, setV1] = useState('')
  const [v2, setV2] = useState('')
  const [v3, setV3] = useState('')
  const [warningLimit, setWarningLimit] = useState('')
  const [alarmLimit, setAlarmLimit] = useState('')

  const taskReadings = useMemo(
    () =>
      filterReadingsForTask(
        pmExecution.readings,
        item.machine,
        item.pmlist,
        kind ?? undefined,
      ),
    [pmExecution.readings, item.machine, item.pmlist, kind],
  )

  useEffect(() => {
    const { warning, alarm } = limitsFromLastReading(taskReadings)
    setWarningLimit(warning)
    setAlarmLimit(alarm)
  }, [item.machine, item.pmlist, kind, taskReadings])

  const chartPoints = useMemo(() => readingsToChartPoints(taskReadings), [taskReadings])

  const axisLabels = useMemo((): [string, string, string] => {
    if (kind === 'vibration_dst_db') return defaultAxisLabels(t, kind)
    if (item.measurementKind !== 'none' && item.axisLabels[0]) return item.axisLabels
    if (kind) return defaultAxisLabels(t, kind)
    return fallbackAxisLabels(t)
  }, [kind, item.measurementKind, item.axisLabels, t])

  const unit =
    kind === 'vibration_dst_db' ? '' : item.unit || (kind ? defaultUnit(kind) : '')
  const chartMeta = kind ? chartCopy(t, kind) : null
  const vibrationDstDb = kind != null && isVibrationDstDb(kind)
  const valueFieldCount = vibrationDstDb ? 2 : 3

  const dualYAxis: PmDualYAxisConfig | null = vibrationDstDb
    ? {
        leftLabel: t('pmMeasurement.dst'),
        rightLabel: t('pmMeasurement.db'),
        leftSuggestedMin: 5,
        leftSuggestedMax: 10,
        rightSuggestedMin: 30,
        rightSuggestedMax: 50,
      }
    : null

  const latestLimits = useMemo(() => {
    const last = taskReadings[taskReadings.length - 1]
    return {
      warning: last?.warningLimit ?? null,
      alarm: last?.alarmLimit ?? null,
    }
  }, [taskReadings])

  const chartLimits = useMemo(() => {
    if (vibrationDstDb) {
      return resolveVibrationDbLimits(warningLimit, alarmLimit, latestLimits)
    }
    return latestLimits
  }, [vibrationDstDb, warningLimit, alarmLimit, latestLimits])

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!kind) throw new Error(t('pmMeasurement.selectKindFirst'))
      const n1 = Number(v1)
      const n2 = Number(v2)
      const n3 = vibrationDstDb ? null : Number(v3)
      if (vibrationDstDb) {
        if (![n1, n2].every((n) => Number.isFinite(n))) {
          throw new Error(t('pmMeasurement.fillDstDb'))
        }
      } else if (![n1, n2, n3].every((n) => Number.isFinite(n))) {
        throw new Error(t('pmMeasurement.fillAllThree'))
      }
      const warn = vibrationDstDb ? parseOptionalDbLimit(warningLimit) : null
      const alarm = vibrationDstDb ? parseOptionalDbLimit(alarmLimit) : null
      return postWorkOrderPmReading(orderId, {
        machine: item.machine,
        pmlist: item.pmlist,
        kind,
        v1: n1,
        v2: n2,
        v3: n3,
        warningLimit: warn,
        alarmLimit: alarm,
      })
    },
    onSuccess: () => {
      toast.success(
        t('pmMeasurement.savedTask', {
          machine: item.machine,
          pmlist: item.pmlist || '—',
        }),
      )
      setV1('')
      setV2('')
      setV3('')
      onSaved()
    },
    onError: (e: Error) => toast.error(e.message),
  })

  if (!kind && !pmExecution.canEdit && taskReadings.length === 0) return null

  return (
    <div
      id={anchorId}
      className={cn(
        'mt-3 space-y-3 rounded-card border p-4 shadow-sm scroll-mt-24',
        'app-tone-info-section app-tone-info-inner',
        highlighted && 'border-[var(--app-accent)] ring-2 ring-[var(--app-accent)]/40',
      )}
    >
      <div className="flex items-center gap-2 text-xs font-semibold app-tone-info-strong">
        <LineChart className="size-4 app-tone-info-icon" aria-hidden />
        {item.measurementTitle || t('pmMeasurement.defaultTitle')}
        {item.mpoint ? (
          <span className="font-normal text-app-muted">· {item.mpoint}</span>
        ) : null}
      </div>

      {!inferred && !kind && pmExecution.canEdit ? (
        <div className="space-y-2">
          <Label>{t('pmMeasurement.kindLabel')}</Label>
          <select
            className={SELECT_CLASS}
            value={kindOverride}
            onChange={(e) =>
              setKindOverride(e.target.value as 'current_3phase' | 'vibration_dst_db' | '')
            }
          >
            <option value="">{t('shared.selectPlaceholder')}</option>
            {KIND_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {t(o.labelKey)}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {kind ? (
        <>
          <PmMeasurementLineChart
            points={chartPoints}
            axisLabels={axisLabels}
            unit={unit}
            chartTitle={item.measurementTitle || chartMeta?.title}
            chartSubtitle={chartMeta?.subtitle}
            warningLimit={chartLimits.warning}
            alarmLimit={chartLimits.alarm}
            seriesCount={vibrationDstDb ? 2 : 3}
            dualYAxis={dualYAxis}
          />

          {taskReadings.length > 0 ? (
            <div className="app-table-shell overflow-x-auto rounded-button border border-app">
              <table className="w-full min-w-[280px] text-left text-xs">
                <thead className="bg-app-subtle/60 text-app-muted">
                  <tr>
                    <th className="px-2 py-1.5">{t('shared.time')}</th>
                    <th className="px-2 py-1.5">{axisLabels[0]}</th>
                    <th className="px-2 py-1.5">{axisLabels[1]}</th>
                    {!vibrationDstDb ? (
                      <th className="px-2 py-1.5">{axisLabels[2]}</th>
                    ) : null}
                  </tr>
                </thead>
                <tbody>
                  {taskReadings.map((r: WoPmReading) => (
                    <tr key={r.idreading} className="border-t border-app/60">
                      <td className="px-2 py-1.5 tabular-nums">
                        {new Date(r.measuredAt).toLocaleString(dateLocale, {
                          hour: '2-digit',
                          minute: '2-digit',
                          day: '2-digit',
                          month: '2-digit',
                        })}
                      </td>
                      <td className="px-2 py-1.5 tabular-nums">{r.v1}</td>
                      <td className="px-2 py-1.5 tabular-nums">{r.v2}</td>
                      {!vibrationDstDb ? (
                        <td className="px-2 py-1.5 tabular-nums">{r.v3}</td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {pmExecution.canEdit ? (
            <div className="space-y-3 border-t border-app/60 pt-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold app-tone-info-strong">
                <Activity className="size-3.5 app-tone-info-icon" aria-hidden />
                {kind === 'current_3phase'
                  ? t('pmMeasurement.saveCurrent3phase')
                  : t('pmMeasurement.saveVibrationDstDb')}
              </p>
              <div
                className={cn(
                  'grid gap-3',
                  valueFieldCount === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-3',
                )}
              >
                <div className="space-y-1.5">
                  <Label>{axisLabels[0]}</Label>
                  <Input inputMode="decimal" value={v1} onChange={(e) => setV1(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>{axisLabels[1]}</Label>
                  <Input inputMode="decimal" value={v2} onChange={(e) => setV2(e.target.value)} />
                </div>
                {!vibrationDstDb ? (
                  <div className="space-y-1.5">
                    <Label>{axisLabels[2]}</Label>
                    <Input inputMode="decimal" value={v3} onChange={(e) => setV3(e.target.value)} />
                  </div>
                ) : null}
              </div>
              {vibrationDstDb ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>{t('pmMeasurement.warningLabelDb')}</Label>
                    <Input
                      inputMode="decimal"
                      placeholder={t('pmMeasurement.warningPlaceholder')}
                      value={warningLimit}
                      onChange={(e) => setWarningLimit(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t('pmMeasurement.alarmLabelDb')}</Label>
                    <Input
                      inputMode="decimal"
                      placeholder={t('pmMeasurement.alarmPlaceholder')}
                      value={alarmLimit}
                      onChange={(e) => setAlarmLimit(e.target.value)}
                    />
                  </div>
                  <p className="sm:col-span-2 text-[11px] text-app-muted">
                    {t('pmMeasurement.limitsDbHint')}
                  </p>
                </div>
              ) : null}
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={saveMut.isPending}
                onClick={() => saveMut.mutate()}
              >
                {saveMut.isPending ? t('shared.saving') : t('pmMeasurement.saveReading')}
              </Button>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  )
}
