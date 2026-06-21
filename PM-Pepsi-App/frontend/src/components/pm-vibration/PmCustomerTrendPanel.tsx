import type { WorkOrderTaskListItemApi, WoPmExecution, WoPmReading } from '@/api/schemas'
import {
  PmMeasurementLineChart,
  type PmDualYAxisConfig,
} from '@/components/scheduling/PmMeasurementLineChart'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { postPmReadingsBatch } from '@/lib/api-public'
import { filterReadingsForTask, readingsToChartPoints } from '@/lib/pm-measurement-chart'
import { findMeasureTask, type PmTaskFocus } from '@/lib/pm-vibration-deep-link'
import {
  limitsFromLastReading,
  parseOptionalDbLimit,
  resolveVibrationDbLimits,
} from '@/lib/pm-vibration-limits'
import { useMutation } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import './sap-wo-print-form.css'

type TrendRow = {
  key: string
  time: string
  v1: string
  v2: string
  v3: string
}

type Props = {
  kind: 'current_3phase' | 'vibration_dst_db'
  orderId: string | null
  tasks: WorkOrderTaskListItemApi[]
  pmExecution?: WoPmExecution
  canWrite: boolean
  onSaved: () => void
  /** Deep link / Master Plan — pre-select task by machine + pmlist */
  focusTask?: PmTaskFocus | null
}

function emptyTrendRow(): TrendRow {
  return { key: crypto.randomUUID(), time: '08:00', v1: '', v2: '', v3: '' }
}

function formatTimeLabel(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false })
}

function readingsToTrendRows(readings: WoPmReading[]): TrendRow[] {
  return readings
    .slice()
    .sort((a, b) => a.measuredAt.localeCompare(b.measuredAt))
    .map((r) => ({
      key: String(r.idreading),
      time: formatTimeLabel(r.measuredAt),
      v1: String(r.v1),
      v2: String(r.v2),
      v3: String(r.v3 ?? ''),
    }))
}

function rowHasValues(row: TrendRow, isVibration: boolean): boolean {
  if (isVibration) return Boolean(row.v1.trim() || row.v2.trim())
  return Boolean(row.v1.trim() || row.v2.trim() || row.v3.trim())
}

export function PmCustomerTrendPanel({
  kind,
  orderId,
  tasks,
  pmExecution,
  canWrite,
  onSaved,
  focusTask = null,
}: Props) {
  const { t } = useTranslation('pmVibration')
  const isVibration = kind === 'vibration_dst_db'
  const valueFields = isVibration ? (['v1', 'v2'] as const) : (['v1', 'v2', 'v3'] as const)

  const task = useMemo(() => {
    if (tasks.length === 0) return undefined
    if (focusTask) {
      const match = findMeasureTask(tasks, focusTask.machine, focusTask.pmlist)
      if (match) return match
    }
    return tasks[0]
  }, [tasks, focusTask])
  const enabled = Boolean(orderId) && canWrite

  const taskReadings = useMemo(() => {
    if (!pmExecution || !task) return []
    return filterReadingsForTask(pmExecution.readings, task.machine, task.pmlist, kind)
  }, [pmExecution, task, kind])

  const [rows, setRows] = useState<TrendRow[]>([emptyTrendRow(), emptyTrendRow(), emptyTrendRow()])
  const [warningLimit, setWarningLimit] = useState('')
  const [alarmLimit, setAlarmLimit] = useState('')

  useEffect(() => {
    if (taskReadings.length > 0) {
      setRows(readingsToTrendRows(taskReadings))
      const { warning, alarm } = limitsFromLastReading(taskReadings)
      setWarningLimit(warning)
      setAlarmLimit(alarm)
    } else {
      setRows([emptyTrendRow(), emptyTrendRow(), emptyTrendRow()])
      setWarningLimit('')
      setAlarmLimit('')
    }
  }, [orderId, task?.machine, task?.pmlist, kind, taskReadings])

  const chartPoints = useMemo(() => {
    if (taskReadings.length > 0) return readingsToChartPoints(taskReadings)
    return rows
      .filter((r) => rowHasValues(r, isVibration))
      .map((r) => ({
        label: r.time,
        v1: Number(r.v1),
        v2: Number(r.v2),
        v3: isVibration ? null : Number(r.v3),
      }))
      .filter((p) => {
        if (isVibration) return [p.v1, p.v2].every((n) => Number.isFinite(n))
        return [p.v1, p.v2, p.v3].every((n) => Number.isFinite(n))
      })
  }, [taskReadings, rows, isVibration])

  const axisLabels: [string, string, string] = isVibration
    ? [t('dstDistortion'), t('db'), '']
    : [t('phaseR'), t('phaseS'), t('phaseT')]

  const dualYAxis: PmDualYAxisConfig | null = isVibration
    ? {
        leftLabel: t('dst'),
        rightLabel: t('db'),
        leftSuggestedMin: 5,
        leftSuggestedMax: 10,
        rightSuggestedMin: 30,
        rightSuggestedMax: 50,
      }
    : null

  const unit = isVibration ? '' : t('trend.unitCurrent')
  const title = isVibration ? t('trend.vibrationTitle') : t('trend.currentTitle')
  const subtitle = isVibration ? t('trend.vibrationSubtitle') : t('trend.currentSubtitle')

  const latestLimits = useMemo(() => {
    const last = taskReadings[taskReadings.length - 1]
    return {
      warning: last?.warningLimit ?? null,
      alarm: last?.alarmLimit ?? null,
    }
  }, [taskReadings])

  const chartLimits = useMemo(() => {
    if (!isVibration) return { warning: null as number | null, alarm: null as number | null }
    return resolveVibrationDbLimits(warningLimit, alarmLimit, latestLimits)
  }, [isVibration, warningLimit, alarmLimit, latestLimits])

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!orderId || !task) throw new Error(t('selectWoFirst'))
      const filledRows = rows.filter((row) => rowHasValues(row, isVibration))
      if (filledRows.length === 0) {
        throw new Error(isVibration ? t('valuesRequiredDstDb') : t('valuesRequired'))
      }
      const today = new Date().toISOString().slice(0, 10)
      const items = filledRows.map((row) => {
        const n1 = Number(row.v1)
        const n2 = Number(row.v2)
        const n3 = isVibration ? null : Number(row.v3)
        if (isVibration) {
          if (![n1, n2].every((n) => Number.isFinite(n))) {
            throw new Error(t('valuesRequiredDstDb'))
          }
        } else if (![n1, n2, n3].every((n) => Number.isFinite(n))) {
          throw new Error(t('valuesRequired'))
        }
        const [hh, mm] = row.time.split(':')
        const measuredAt = new Date(`${today}T${hh || '00'}:${mm || '00'}:00`).toISOString()
        const warn = isVibration ? parseOptionalDbLimit(warningLimit) : null
        const alarm = isVibration ? parseOptionalDbLimit(alarmLimit) : null
        return {
          machine: task.machine,
          pmlist: task.pmlist,
          kind,
          measuredAt,
          v1: n1,
          v2: n2,
          v3: n3,
          warningLimit: warn,
          alarmLimit: alarm,
        }
      })
      return postPmReadingsBatch({ orderId, items })
    },
    onSuccess: (res) => {
      if (res.imported > 0 && task) {
        toast.success(
          t('savedTaskTrend', {
            count: res.imported,
            machine: task.machine,
            pmlist: task.pmlist,
          }),
        )
      }
      if (res.failed > 0) toast.error(t('failedRows', { count: res.failed }))
      onSaved()
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const loadFromSaved = () => {
    if (taskReadings.length === 0) {
      toast.info(t('trend.noSavedReadings'))
      return
    }
    setRows(readingsToTrendRows(taskReadings))
    toast.success(t('trend.loadedSaved', { count: taskReadings.length }))
  }

  return (
    <section className="sap-wo-print overflow-hidden" aria-label={title}>
      <div className="border-b border-black px-[0.6rem] py-2">
        <p className="text-sm font-bold">{title}</p>
        <p className="text-[11px]">{subtitle}</p>
        {task ? (
          <p className="mt-1 text-[11px] text-app-muted">
            {t('trend.taskLabel')}: {task.machine}
            {task.pmlist ? ` · ${task.pmlist}` : ''}
          </p>
        ) : (
          <p className="app-tone-warning-label mt-1 text-[11px]">{t('trend.noTaskHint')}</p>
        )}
      </div>

      <div className="p-3">
        <PmMeasurementLineChart
          points={chartPoints}
          axisLabels={axisLabels}
          unit={unit}
          chartTitle={title}
          chartSubtitle={subtitle}
          seriesCount={isVibration ? 2 : 3}
          dualYAxis={dualYAxis}
          warningLimit={chartLimits.warning}
          alarmLimit={chartLimits.alarm}
        />
      </div>

      {isVibration ? (
        <div className="grid gap-2 px-[0.6rem] pb-2 sm:grid-cols-2">
          <label className="flex flex-col gap-0.5 text-[11px]">
            <span className="font-semibold">{t('warningLabelDb')}</span>
            <input
              className="sap-wo-print__input"
              inputMode="decimal"
              value={warningLimit}
              disabled={!enabled}
              onChange={(e) => setWarningLimit(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-0.5 text-[11px]">
            <span className="font-semibold">{t('alarmLabelDb')}</span>
            <input
              className="sap-wo-print__input"
              inputMode="decimal"
              value={alarmLimit}
              disabled={!enabled}
              onChange={(e) => setAlarmLimit(e.target.value)}
            />
          </label>
          <p className="sm:col-span-2 text-[10px] text-app-muted">{t('limitsDbHint')}</p>
        </div>
      ) : null}

      <p className="px-[0.6rem] pb-1 text-[11px] font-semibold">{t('trend.tableTitle')}</p>

      <div className="px-[0.6rem] pb-2">
        <table className="sap-wo-print__measure-table">
          <thead>
            <tr>
              <th>{t('trend.timeColumn')}</th>
              <th>{axisLabels[0]}</th>
              <th>{axisLabels[1]}</th>
              {!isVibration ? <th>{axisLabels[2]}</th> : null}
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key}>
                <td>
                  <Input
                    type="time"
                    className="h-7 border-0 border-b border-app bg-transparent px-1 text-xs shadow-none"
                    value={row.time}
                    disabled={!enabled}
                    onChange={(e) =>
                      setRows((prev) =>
                        prev.map((r) => (r.key === row.key ? { ...r, time: e.target.value } : r)),
                      )
                    }
                  />
                </td>
                {valueFields.map((field) => (
                  <td key={field}>
                    <input
                      className="sap-wo-print__input"
                      inputMode="decimal"
                      value={row[field]}
                      disabled={!enabled}
                      onChange={(e) =>
                        setRows((prev) =>
                          prev.map((r) =>
                            r.key === row.key ? { ...r, [field]: e.target.value } : r,
                          ),
                        )
                      }
                    />
                  </td>
                ))}
                <td>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    disabled={!enabled || rows.length <= 1}
                    onClick={() => setRows((prev) => prev.filter((r) => r.key !== row.key))}
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="sap-wo-print__actions flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!enabled}
          onClick={() => setRows((prev) => [...prev, emptyTrendRow()])}
        >
          <Plus className="size-4" aria-hidden />
          {t('addRow')}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!orderId || !task}
          onClick={loadFromSaved}
        >
          {t('trend.loadSaved')}
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={!enabled || !task || saveMut.isPending}
          onClick={() => saveMut.mutate()}
        >
          {saveMut.isPending ? t('saving') : t('trend.saveTable')}
        </Button>
        {!orderId ? (
          <span className="self-center text-xs text-app-muted">{t('trend.selectWoHint')}</span>
        ) : null}
      </div>
    </section>
  )
}
