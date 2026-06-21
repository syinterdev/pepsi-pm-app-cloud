import type { worktimeSummaryOverallResponseSchema } from '@/api/schemas'
import { EmptyState } from '@/components/ui/empty-state'
import { Label } from '@/components/ui/label'
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from 'chart.js'
import type { ChartData, ChartOptions } from 'chart.js'
import { BarChart3, CircleDot, LayoutGrid, Table2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Bar, Doughnut } from 'react-chartjs-2'
import type { z } from 'zod'
import './worktime-pm-completion.css'

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend)

type SummaryData = z.infer<typeof worktimeSummaryOverallResponseSchema>

type ViewMode = 'cards' | 'rings' | 'bars' | 'table'

type KpiDef = {
  id: string
  title: string
  planned: number
  completed: number
  accent: string
  showBacklog?: boolean
}

function clampPct(planned: number, completed: number): number {
  if (planned <= 0) return completed > 0 ? 100 : 0
  return Math.min(100, Math.round((completed / planned) * 1000) / 10)
}

/** พื้น panel เข้มเสมอ — แกนกราฟต้องสว่างไม่ขึ้นกับ light/dark ทั้งแอป */
const PANEL_CHART_COLORS = {
  text: '#f1f5f9',
  muted: '#cbd5e1',
  grid: 'rgba(148, 163, 184, 0.28)',
  track: 'rgba(255, 255, 255, 0.14)',
  tooltipBg: 'rgba(15, 23, 42, 0.94)',
  tooltipText: '#f8fafc',
} as const

type PanelChartColors = typeof PANEL_CHART_COLORS

function kpiBarLabel(
  kpiId: string,
  monthLabel: string,
  weekShort: string,
  t: (key: string, opts?: Record<string, unknown>) => string,
): string {
  switch (kpiId) {
    case 'y-total':
      return t('worktimePm.kpiBarTotalYear')
    case 'y-done':
      return t('worktimePm.kpiBarTotalYearDone')
    case 'm-total':
      return monthLabel
    case 'm-done':
      return `${monthLabel} ✓`
    case 'w-total':
      return weekShort
    case 'w-done':
      return `${weekShort} ✓`
    case 'backlog':
      return t('worktimePm.kpiBacklogShort')
    default:
      return kpiId
  }
}

function panelChartOptions(
  colors: PanelChartColors,
  axis: 'vertical' | 'horizontal',
): Pick<ChartOptions<'bar'>, 'plugins' | 'scales' | 'layout'> {
  const tick = {
    color: colors.text,
    font: { size: 11, weight: 'bold' as const },
  }
  return {
    layout: { padding: { left: 4, right: 12, top: 8, bottom: 8 } },
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: colors.text, boxWidth: 14, padding: 14, font: { size: 12 } },
      },
      tooltip: {
        backgroundColor: colors.tooltipBg,
        titleColor: colors.tooltipText,
        bodyColor: colors.tooltipText,
        borderColor: 'rgba(255,255,255,0.15)',
        borderWidth: 1,
      },
    },
    scales:
      axis === 'horizontal'
        ? {
            x: {
              beginAtZero: true,
              ticks: tick,
              grid: { color: colors.grid },
              border: { color: colors.grid },
            },
            y: {
              ticks: { ...tick, autoSkip: false },
              grid: { display: false },
              border: { display: false },
            },
          }
        : {
            x: {
              ticks: { ...tick, maxRotation: 0, minRotation: 0, autoSkip: false },
              grid: { display: false },
              border: { color: colors.grid },
            },
            y: {
              beginAtZero: true,
              ticks: tick,
              grid: { color: colors.grid },
              border: { display: false },
            },
          },
  }
}

function ViewToggle({
  mode,
  onChange,
}: {
  mode: ViewMode
  onChange: (m: ViewMode) => void
}) {
  const { t } = useTranslation('manhours')
  const items: { id: ViewMode; labelKey: string; icon: typeof LayoutGrid }[] = [
    { id: 'cards', labelKey: 'worktimePm.viewCards', icon: LayoutGrid },
    { id: 'rings', labelKey: 'worktimePm.viewRings', icon: CircleDot },
    { id: 'bars', labelKey: 'worktimePm.viewBars', icon: BarChart3 },
    { id: 'table', labelKey: 'worktimePm.viewTable', icon: Table2 },
  ]
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label={t('worktimePm.viewAria')}>
      {items.map(({ id, labelKey, icon: Icon }) => (
        <button
          key={id}
          type="button"
          data-active={mode === id}
          className="worktime-pm-panel__view-btn inline-flex items-center gap-1.5 rounded-button px-3 py-1.5 text-xs font-medium transition-colors"
          onClick={() => onChange(id)}
        >
          <Icon className="size-3.5" aria-hidden />
          {t(labelKey)}
        </button>
      ))}
    </div>
  )
}

function KpiCards({ kpis }: { kpis: KpiDef[] }) {
  const { t } = useTranslation('manhours')
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
      {kpis.map((k) => {
        const displayPct = k.showBacklog
          ? clampPct(k.planned, k.completed)
          : clampPct(k.planned, k.completed)
        return (
          <div
            key={k.id}
            className="worktime-pm-panel__kpi-card rounded-xl px-3 py-3"
          >
            <p className="worktime-pm-panel__kpi-muted text-[11px] font-semibold uppercase tracking-wide">
              {k.title}
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-[var(--wt-pm-text)]">
              {(k.showBacklog ? k.completed : k.planned).toLocaleString('th-TH')}
            </p>
            {!k.showBacklog ? (
              <p className="worktime-pm-panel__kpi-muted mt-0.5 text-xs">
                {t('worktimePm.doneOf', {
                  done: k.completed.toLocaleString(),
                  pct: String(displayPct),
                })}
              </p>
            ) : (
              <p className="worktime-pm-panel__kpi-muted mt-0.5 text-xs">{t('worktimePm.backlog')}</p>
            )}
            <div className="worktime-pm-panel__progress-track mt-2 h-2 overflow-hidden rounded-full">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, displayPct)}%`, backgroundColor: k.accent }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function KpiRings({ kpis }: { kpis: KpiDef[] }) {
  const { t } = useTranslation('manhours')
  const trackColor = PANEL_CHART_COLORS.track
  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
      {kpis.map((k) => {
        const pct = clampPct(k.planned, k.completed)
        const p = Math.max(0, Math.min(100, pct))
        return (
          <div key={k.id} className="flex flex-col items-center">
            <div className="relative size-[120px] sm:size-[132px]">
              <Doughnut
                data={{
                  labels: [t('worktimePm.chartValue'), t('worktimePm.chartRemaining')],
                  datasets: [
                    {
                      data: [p, Math.max(0, 100 - p)],
                      backgroundColor: [k.accent, trackColor],
                      borderWidth: 0,
                    },
                  ],
                }}
                options={{
                  plugins: { legend: { display: false }, tooltip: { enabled: true } },
                  cutout: '68%',
                }}
              />
              <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
                <div>
                  <p className="text-xl font-bold tabular-nums text-[var(--wt-pm-text)] sm:text-2xl">
                    {(k.showBacklog ? k.completed : k.planned).toLocaleString('th-TH')}
                  </p>
                  {!k.showBacklog ? (
                    <p className="worktime-pm-panel__kpi-muted text-[10px]">
                      {k.completed}/{k.planned}
                    </p>
                  ) : (
                    <p className="worktime-pm-panel__kpi-muted text-[10px]">{t('worktimePm.backlogShort')}</p>
                  )}
                </div>
              </div>
            </div>
            <p className="mt-2 max-w-[9rem] text-center text-xs font-semibold leading-snug text-[var(--wt-pm-text)]">
              {k.title}
            </p>
          </div>
        )
      })}
    </div>
  )
}

function KpiBarChart({
  kpis,
  monthLabel,
  weekShort,
}: {
  kpis: KpiDef[]
  monthLabel: string
  weekShort: string
}) {
  const { t } = useTranslation('manhours')
  const labels = kpis.map((k) => kpiBarLabel(k.id, monthLabel, weekShort, t))
  const data: ChartData<'bar'> = {
    labels,
    datasets: [
      {
        label: t('worktimePm.chartPlanned'),
        data: kpis.map((k) => k.planned),
        backgroundColor: 'rgba(253, 186, 116, 0.92)',
        borderRadius: 4,
        barThickness: 14,
      },
      {
        label: t('worktimePm.chartDoneBacklog'),
        data: kpis.map((k) => k.completed),
        backgroundColor: kpis.map((k) =>
          k.showBacklog ? 'rgba(239, 68, 68, 0.9)' : 'rgba(34, 197, 94, 0.9)',
        ),
        borderRadius: 4,
        barThickness: 14,
      },
    ],
  }
  const options: ChartOptions<'bar'> = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    ...panelChartOptions(PANEL_CHART_COLORS, 'horizontal'),
    datasets: {
      bar: { categoryPercentage: 0.72, barPercentage: 0.85 },
    },
  }
  return (
    <div
      className="worktime-pm-panel__chart w-full min-w-0"
      style={{ height: Math.max(280, kpis.length * 52) }}
    >
      <Bar data={data} options={options} />
    </div>
  )
}

function PmByLineSection({
  rows,
  viewMode,
}: {
  rows: SummaryData['pmByLine']
  viewMode: ViewMode
}) {
  const { t } = useTranslation('manhours')
  const colors = PANEL_CHART_COLORS
  const lineRows = rows.slice(0, 12).map((row) => ({
    label:
      row.prolinedescrip?.trim() ||
      (row.productline.trim() ? row.productline : t('worktimePm.unknown')),
    planned: row.planned,
  }))
  const max = Math.max(1, ...lineRows.map((r) => r.planned))

  if (!lineRows.length) {
    return (
      <EmptyState
        className="worktime-pm-panel__empty border-0 py-8"
        title={t('worktimePm.byLineEmpty')}
        description={t('worktimePm.byLineEmptyHint')}
      />
    )
  }

  if (viewMode === 'table') {
    return (
      <table className="worktime-pm-panel__table">
        <thead>
          <tr>
            <th>{t('worktimePm.colLine')}</th>
            <th className="tabular-nums">{t('worktimePm.colPlannedWo')}</th>
            <th className="tabular-nums">{t('worktimePm.colPctOfMax')}</th>
          </tr>
        </thead>
        <tbody>
          {lineRows.map((row) => (
            <tr key={row.label}>
              <td>{row.label}</td>
              <td className="tabular-nums font-semibold">{row.planned}</td>
              <td className="tabular-nums text-[var(--wt-pm-muted)]">
                {Math.round((row.planned / max) * 100)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  if (viewMode === 'bars') {
    const data: ChartData<'bar'> = {
      labels: lineRows.map((r) => r.label),
      datasets: [
        {
          label: t('worktimePm.chartWo'),
          data: lineRows.map((r) => r.planned),
          backgroundColor: 'rgba(168,85,247,0.88)',
          borderRadius: 8,
        },
      ],
    }
    const options: ChartOptions<'bar'> = {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      ...panelChartOptions(colors, 'horizontal'),
      plugins: {
        ...panelChartOptions(colors, 'horizontal').plugins,
        legend: { display: false },
      },
      datasets: {
        bar: {
          barThickness: Math.min(36, Math.max(18, 320 / lineRows.length)),
        },
      },
    }
    return (
      <div
        className="worktime-pm-panel__chart w-full min-w-0"
        style={{ height: Math.max(200, lineRows.length * 44) }}
      >
        <Bar data={data} options={options} />
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {lineRows.map((row) => {
        const w = Math.max(8, (row.planned / max) * 100)
        return (
          <div key={row.label} className="worktime-pm-panel__line-row rounded-xl px-3 py-2.5">
            <div className="mb-1 flex items-center justify-between gap-2 text-sm">
              <span className="min-w-0 truncate font-semibold">{row.label}</span>
              <span className="worktime-pm-panel__line-value shrink-0 tabular-nums font-bold">
                {t('worktimePm.woCount', { n: row.planned })}
              </span>
            </div>
            <div className="worktime-pm-panel__progress-track h-3 overflow-hidden rounded-full">
              <div
                className="worktime-pm-panel__line-bar-fill h-full rounded-full"
                style={{ width: `${w}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export type WorktimePmCompletionPanelProps = {
  data: SummaryData
  year: number
  month: string
  week: string
  yearOptions: number[]
  weekOptions: { value: string; label: string }[]
  onYearChange: (y: number) => void
  onMonthChange: (m: string) => void
  onWeekChange: (w: string) => void
}

export function WorktimePmCompletionPanel({
  data,
  year,
  month,
  week,
  yearOptions,
  weekOptions,
  onYearChange,
  onMonthChange,
  onWeekChange,
}: WorktimePmCompletionPanelProps) {
  const { t } = useTranslation('manhours')
  const [viewMode, setViewMode] = useState<ViewMode>('cards')

  const monthLabel = (() => {
    const m = Number(month.slice(5, 7))
    const fmt = new Intl.DateTimeFormat('en-US', { month: 'short' })
    return Number.isFinite(m) && m >= 1 && m <= 12
      ? fmt.format(new Date(2020, m - 1, 1)).toUpperCase()
      : 'MONTH'
  })()
  const weekShort = week.trim() ? week.replace(/^(\d{4})-W/, 'WK') : 'WK'

  const kpis: KpiDef[] = useMemo(
    () => [
      {
        id: 'y-total',
        title: 'TOTAL PM',
        planned: data.pmYear.totalPmPlanned,
        completed: data.pmYear.totalPmCompleted,
        accent: 'rgba(253,186,116,0.95)',
      },
      {
        id: 'y-done',
        title: 'TOTAL PM COMPLETED',
        planned: data.pmYear.totalPmPlanned,
        completed: data.pmYear.totalPmCompleted,
        accent: 'rgba(34,197,94,0.95)',
      },
      {
        id: 'm-total',
        title: `TOTAL PM ${monthLabel}`,
        planned: data.pmMonth.totalPmPlanned,
        completed: data.pmMonth.totalPmCompleted,
        accent: 'rgba(168,85,247,0.95)',
      },
      {
        id: 'm-done',
        title: `TOTAL PM ${monthLabel} COMPLETED`,
        planned: data.pmMonth.totalPmPlanned,
        completed: data.pmMonth.totalPmCompleted,
        accent: 'rgba(34,197,94,0.75)',
      },
      {
        id: 'w-total',
        title: `TOTAL PM ${weekShort}`,
        planned: data.pmWeek.totalPmPlanned,
        completed: data.pmWeek.totalPmCompleted,
        accent: 'rgba(59,130,246,0.95)',
      },
      {
        id: 'w-done',
        title: `TOTAL PM ${weekShort} COMPLETED`,
        planned: data.pmWeek.totalPmPlanned,
        completed: data.pmWeek.totalPmCompleted,
        accent: 'rgba(168,85,247,0.9)',
      },
      {
        id: 'backlog',
        title: 'BACKLOG',
        planned: data.pmYear.totalPmPlanned,
        completed: data.pmYear.backlog,
        accent: 'rgba(239,68,68,0.95)',
        showBacklog: true,
      },
    ],
    [data, monthLabel, weekShort],
  )

  const kpiTableRows = kpis.map((k) => ({
    title: k.title,
    planned: k.planned,
    completed: k.showBacklog ? k.completed : k.completed,
    pct: k.showBacklog
      ? clampPct(k.planned, k.completed)
      : clampPct(k.planned, k.completed),
  }))

  return (
    <div className="worktime-pm-panel space-y-4">
      <section className="worktime-pm-panel__shell p-4 sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="worktime-pm-panel__title text-base font-semibold sm:text-lg">
              {t('worktimePm.panelTitle', { year })}
            </h2>
            <p className="worktime-pm-panel__muted mt-0.5 text-xs">{t('worktimePm.panelSubtitle')}</p>
          </div>
          <ViewToggle mode={viewMode} onChange={setViewMode} />
        </div>

        <div className="worktime-pm-panel__filter mt-4 grid gap-2 sm:grid-cols-3">
          <div className="space-y-1">
            <Label htmlFor="worktime-summary-year">{t('worktimePm.filterYear')}</Label>
            <select
              id="worktime-summary-year"
              className="flex h-9 w-full min-w-[8rem] rounded-button px-3 text-body-sm shadow-sm"
              value={year}
              onChange={(e) => onYearChange(Number(e.target.value))}
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="worktime-summary-month">{t('worktimePm.filterMonth')}</Label>
            <input
              id="worktime-summary-month"
              type="month"
              className="flex h-9 w-full min-w-[10rem] rounded-button px-3 text-body-sm shadow-sm"
              value={month}
              onChange={(e) => onMonthChange(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="worktime-summary-week">{t('worktimePm.filterWeek')}</Label>
            <select
              id="worktime-summary-week"
              className="flex h-9 w-full min-w-[10rem] rounded-button px-3 text-body-sm shadow-sm"
              value={week}
              onChange={(e) => onWeekChange(e.target.value)}
            >
              {weekOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-5">
          {viewMode === 'cards' ? <KpiCards kpis={kpis} /> : null}
          {viewMode === 'rings' ? <KpiRings kpis={kpis} /> : null}
          {viewMode === 'bars' ? (
            <KpiBarChart kpis={kpis} monthLabel={monthLabel} weekShort={weekShort} />
          ) : null}
          {viewMode === 'table' ? (
            <table className="worktime-pm-panel__table">
              <thead>
                <tr>
                  <th>{t('worktimePm.tableMetric')}</th>
                  <th className="tabular-nums">{t('worktimePm.tablePlanned')}</th>
                  <th className="tabular-nums">{t('worktimePm.tableDoneBacklog')}</th>
                  <th className="tabular-nums">%</th>
                </tr>
              </thead>
              <tbody>
                {kpiTableRows.map((row) => (
                  <tr key={row.title}>
                    <td>{row.title}</td>
                    <td className="tabular-nums">{row.planned}</td>
                    <td className="tabular-nums">{row.completed}</td>
                    <td className="tabular-nums">{row.pct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </div>
      </section>

      <section className="worktime-pm-panel__shell p-4 sm:p-5">
        <h3 className="worktime-pm-panel__title text-center text-sm font-semibold tracking-wide">
          {t('worktimePm.byLineTitle', { week: weekShort })}
        </h3>
        <p className="worktime-pm-panel__muted mt-1 text-center text-xs">{t('worktimePm.byLineSubtitle')}</p>
        <div className="mt-4">
          <PmByLineSection rows={data.pmByLine} viewMode={viewMode} />
        </div>
      </section>
    </div>
  )
}
