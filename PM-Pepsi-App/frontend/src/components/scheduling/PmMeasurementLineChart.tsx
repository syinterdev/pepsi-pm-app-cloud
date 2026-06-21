import type { PmChartPoint } from '@/lib/pm-measurement-chart'
import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

export type PmDualYAxisConfig = {
  leftLabel: string
  rightLabel: string
  leftSuggestedMin?: number
  leftSuggestedMax?: number
  rightSuggestedMin?: number
  rightSuggestedMax?: number
}

type Props = {
  points: PmChartPoint[]
  axisLabels: [string, string, string]
  unit: string
  chartTitle?: string
  chartSubtitle?: string
  warningLimit?: number | null
  alarmLimit?: number | null
  /** Vibration Dst/dB — plot 2 series only (no third axis) */
  seriesCount?: 2 | 3
  /** Dst on left Y · dB on right Y (vibration trend) */
  dualYAxis?: PmDualYAxisConfig | null
}

export function PmMeasurementLineChart({
  points,
  axisLabels,
  unit,
  chartTitle,
  chartSubtitle,
  warningLimit,
  alarmLimit,
  seriesCount = 3,
  dualYAxis = null,
}: Props) {
  if (points.length === 0) {
    return (
      <p className="rounded-button border border-dashed border-app px-3 py-6 text-center text-xs text-app-muted">
        ยังไม่มีค่าวัด — บันทึกครั้งแรกเพื่อเริ่มกราฟแนวโน้ม
      </p>
    )
  }

  const labels = points.map((p) => p.label)
  const useDualAxis = Boolean(dualYAxis) && seriesCount === 2

  const limitPlugin = {
    id: 'pmLimits',
    afterDraw(chart: ChartJS) {
      const yScale = useDualAxis ? chart.scales.y1 : chart.scales.y
      if (!yScale) return
      const ctx = chart.ctx
      const drawLine = (value: number | null | undefined, color: string, text: string) => {
        if (value == null || !Number.isFinite(value)) return
        const y = yScale.getPixelForValue(value)
        if (!Number.isFinite(y)) return
        ctx.save()
        ctx.strokeStyle = color
        ctx.setLineDash([6, 4])
        ctx.beginPath()
        ctx.moveTo(chart.chartArea.left, y)
        ctx.lineTo(chart.chartArea.right, y)
        ctx.stroke()
        ctx.fillStyle = color
        ctx.font = '11px sans-serif'
        if (useDualAxis) {
          ctx.textAlign = 'right'
          ctx.fillText(text, chart.chartArea.right - 4, y - 4)
        } else {
          ctx.fillText(text, chart.chartArea.left + 4, y - 4)
        }
        ctx.restore()
      }
      drawLine(warningLimit, 'rgba(234, 179, 8, 0.9)', 'Warning')
      drawLine(alarmLimit, 'rgba(239, 68, 68, 0.9)', 'Alarm')
    },
  }

  const datasetBase = (index: 0 | 1) => {
    const colors = [
      { border: 'rgb(37, 99, 235)', bg: 'rgba(37, 99, 235, 0.15)' },
      { border: 'rgb(22, 163, 74)', bg: 'rgba(22, 163, 74, 0.15)' },
    ] as const
    const valueKey = index === 0 ? 'v1' : 'v2'
    return {
      label: axisLabels[index],
      data: points.map((p) => p[valueKey]),
      borderColor: colors[index].border,
      backgroundColor: colors[index].bg,
      tension: 0.2,
      ...(useDualAxis ? { yAxisID: index === 0 ? 'y' : 'y1' } : {}),
    }
  }

  return (
    <div className="rounded-button border border-app bg-[var(--app-surface)] p-3">
      {chartTitle ? (
        <p className="mb-1 text-sm font-semibold text-app">{chartTitle}</p>
      ) : null}
      {chartSubtitle ? (
        <p className="mb-2 text-xs text-app-muted">{chartSubtitle}</p>
      ) : null}
      <Line
        plugins={[limitPlugin]}
        data={{
          labels,
          datasets: [
            datasetBase(0),
            datasetBase(1),
            ...(seriesCount === 3
              ? [
                  {
                    label: axisLabels[2],
                    data: points.map((p) => p.v3),
                    borderColor: 'rgb(234, 88, 12)',
                    backgroundColor: 'rgba(234, 88, 12, 0.15)',
                    tension: 0.2,
                  },
                ]
              : []),
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom' },
            title: {
              display: true,
              text: chartTitle ?? (unit ? `แนวโน้ม (${unit})` : 'แนวโน้มค่าวัด'),
              font: { size: 12 },
            },
          },
          scales: useDualAxis
            ? {
                y: {
                  type: 'linear',
                  display: true,
                  position: 'left',
                  title: { display: true, text: dualYAxis!.leftLabel },
                  suggestedMin: dualYAxis!.leftSuggestedMin,
                  suggestedMax: dualYAxis!.leftSuggestedMax,
                  beginAtZero: false,
                },
                y1: {
                  type: 'linear',
                  display: true,
                  position: 'right',
                  title: { display: true, text: dualYAxis!.rightLabel },
                  suggestedMin: dualYAxis!.rightSuggestedMin,
                  suggestedMax: dualYAxis!.rightSuggestedMax,
                  beginAtZero: false,
                  grid: { drawOnChartArea: false },
                },
              }
            : {
                y: {
                  title: { display: !!unit, text: unit },
                  beginAtZero: false,
                },
              },
        }}
        height={220}
      />
    </div>
  )
}
