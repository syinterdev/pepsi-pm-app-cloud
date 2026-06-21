import { BRAND_LOGO } from '@/lib/brand-palette'
import { cn } from '@/lib/utils'
import type { ChartArea, ChartOptions } from 'chart.js'
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js'
import { useMemo } from 'react'
import { Line } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip)

export type KpiChartTone = 'pepsi-blue' | 'pepsi-red' | 'pepsi-orange'

type TonePalette = {
  line: string
  lineSoft: string
  fillTop: string
  fillBottom: string
  point: string
  grid: string
}

const TONE: Record<KpiChartTone, TonePalette> = {
  'pepsi-blue': {
    line: BRAND_LOGO.blueDark,
    lineSoft: 'rgba(0, 51, 102, 0.35)',
    fillTop: 'rgba(0, 51, 102, 0.38)',
    fillBottom: 'rgba(0, 51, 102, 0.02)',
    point: BRAND_LOGO.blueDark,
    grid: 'rgba(0, 51, 102, 0.1)',
  },
  'pepsi-red': {
    line: BRAND_LOGO.orange,
    lineSoft: 'rgba(247, 148, 29, 0.35)',
    fillTop: 'rgba(247, 148, 29, 0.34)',
    fillBottom: 'rgba(247, 148, 29, 0.02)',
    point: BRAND_LOGO.orange,
    grid: 'rgba(247, 148, 29, 0.1)',
  },
  'pepsi-orange': {
    line: BRAND_LOGO.orange,
    lineSoft: 'rgba(247, 148, 29, 0.35)',
    fillTop: 'rgba(247, 148, 29, 0.32)',
    fillBottom: 'rgba(247, 148, 29, 0.02)',
    point: BRAND_LOGO.orange,
    grid: 'rgba(247, 148, 29, 0.1)',
  },
}

function areaGradient(
  ctx: CanvasRenderingContext2D,
  area: ChartArea,
  palette: TonePalette,
): CanvasGradient {
  const g = ctx.createLinearGradient(0, area.top, 0, area.bottom)
  g.addColorStop(0, palette.fillTop)
  g.addColorStop(0.55, palette.fillBottom)
  g.addColorStop(1, 'transparent')
  return g
}

/** ช่วงแกน Y ให้เส้นไม่แบนเกินไปเมื่อค่าน้อย (เช่น 0–1) */
function yBounds(values: number[]): { min: number; max: number } {
  const rawMax = Math.max(...values, 0)
  const rawMin = Math.min(...values, 0)
  if (rawMax === 0 && rawMin === 0) {
    return { min: 0, max: 4 }
  }
  if (rawMax === rawMin) {
    const pad = Math.max(rawMax * 0.35, 1)
    return { min: 0, max: rawMax + pad }
  }
  const span = rawMax - rawMin
  const pad = Math.max(span * 0.18, 0.5)
  return {
    min: Math.max(0, rawMin - pad * 0.35),
    max: rawMax + pad,
  }
}

type Props = {
  labels: string[]
  data: number[]
  tone: KpiChartTone
  datasetLabel?: string
  className?: string
}

/** กราฟเส้น KPI — โค้งนุ่ม พื้นที่ไล่สี จุดโผล่เมื่อ hover */
export function KpiTrendChart({ labels, data, tone, datasetLabel, className }: Props) {
  const palette = TONE[tone]
  const bounds = useMemo(() => yBounds(data), [data])
  const label = datasetLabel ?? 'รายวัน'

  const chartData = useMemo(
    () => ({
      labels,
      datasets: [
        {
          label,
          data,
          borderColor: palette.line,
          pointBackgroundColor: palette.point,
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 5,
          pointHoverBorderWidth: 2,
          borderWidth: 2.75,
          fill: true,
          tension: 0.42,
          cubicInterpolationMode: 'monotone' as const,
          backgroundColor(context: { chart: { ctx: CanvasRenderingContext2D; chartArea?: ChartArea } }) {
            const { ctx, chartArea } = context.chart
            if (!chartArea) return palette.fillBottom
            return areaGradient(ctx, chartArea, palette)
          },
        },
      ],
    }),
    [labels, data, label, palette],
  )

  const options = useMemo<ChartOptions<'line'>>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: { top: 8, right: 6, bottom: 2, left: 2 } },
      interaction: { mode: 'index', intersect: false },
      animation: {
        duration: 720,
        easing: 'easeOutQuart',
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.94)',
          titleColor: '#f8fafc',
          bodyColor: '#e2e8f0',
          borderColor: 'rgba(255, 255, 255, 0.08)',
          borderWidth: 1,
          padding: 12,
          cornerRadius: 10,
          displayColors: false,
          titleFont: { size: 12, weight: 600 },
          bodyFont: { size: 13 },
          callbacks: {
            title: (items) => items[0]?.label ?? '',
            label: (ctx) => {
              const v = ctx.parsed.y
              return `${label}: ${v != null ? v.toLocaleString('th-TH') : '—'}`
            },
          },
        },
      },
      scales: {
        x: {
          border: { display: false },
          grid: { display: false },
          ticks: {
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: 4,
            padding: 6,
            font: { size: 10, weight: 500 },
            color: '#94a3b8',
          },
        },
        y: {
          min: bounds.min,
          max: bounds.max,
          border: { display: false },
          grid: {
            color: palette.grid,
            drawTicks: false,
          },
          ticks: {
            maxTicksLimit: 4,
            padding: 8,
            font: { size: 10 },
            color: '#94a3b8',
            callback: (v) => {
              const n = typeof v === 'number' ? v : Number(v)
              return Number.isInteger(n) ? String(n) : ''
            },
          },
        },
      },
      elements: {
        line: {
          borderCapStyle: 'round',
          borderJoinStyle: 'round',
        },
      },
    }),
    [bounds, label, palette.grid],
  )

  return (
    <div className={cn('dashboard-kpi-chart', className)} data-tone={tone}>
      <Line data={chartData} options={options} />
    </div>
  )
}

/** ป้ายวันที่ 7 วันย้อนหลัง (วันแรก = เก่าสุด) */
export function last7DayLabels(end = new Date()): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(end)
    d.setDate(d.getDate() - (6 - i))
    return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
  })
}
