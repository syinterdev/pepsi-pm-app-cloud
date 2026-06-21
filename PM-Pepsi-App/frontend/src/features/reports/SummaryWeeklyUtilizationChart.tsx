/**
 * Technician Utilizations
 */
import type { SummaryWeeklyUtilizationBar } from '@/api/schemas'
import { readCssVar } from '@/lib/css-tokens'
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import { useTranslation } from 'react-i18next'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

export type SummaryWeeklyChartVariant = 'chart' | 'chart2'

type Props = {
  items: SummaryWeeklyUtilizationBar[]
  variant?: SummaryWeeklyChartVariant
  /** compact = ในหน้าหลัก, fullscreen = ขยายเต็มจอ */
  layout?: 'compact' | 'fullscreen'
  /** ป้าย/แกนสีอ่อนสำหรับ Engineering Board (พื้นหลังเข้ม) */
  kioskDark?: boolean
}

function barColors(count: number, variant: SummaryWeeklyChartVariant): string[] {
  if (variant === 'chart2') {
    return Array.from({ length: count }, (_, i) => `hsl(${(i * 47) % 360} 55% 45%)`)
  }
  return Array.from({ length: count }, () => 'rgba(24,24,27,0.85)')
}

export function SummaryWeeklyUtilizationChart({
  items,
  variant = 'chart2',
  layout = 'compact',
  kioskDark = false,
}: Props) {
  const { t } = useTranslation('reports')
  const isFull = layout === 'fullscreen'
  const tickColor = kioskDark ? 'rgba(248, 250, 252, 0.7)' : undefined
  const titleColor = kioskDark ? readCssVar('--app-text') : undefined
  const gridColor = kioskDark ? 'rgba(255, 255, 255, 0.08)' : undefined

  return (
    <Bar
      data={{
        labels: items.map((c) => c.idwkctr),
        datasets: [
          {
            label: t('engUtil.chartDatasetSummary'),
            data: items.map((c) => c.summaryHours),
            backgroundColor: barColors(items.length, variant),
          },
        ],
      }}
      options={{
        responsive: true,
        maintainAspectRatio: !isFull,
        aspectRatio: isFull ? undefined : 2,
        plugins: {
          title: {
            display: true,
            text: t('engUtil.chartTitle'),
            font: { size: isFull ? 18 : 14 },
            color: titleColor,
          },
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) =>
                t('engUtil.chartTooltipHours', { n: ctx.parsed.y ?? 0 }),
            },
          },
        },
        scales: {
          x: {
            ticks: {
              maxRotation: isFull ? 45 : 0,
              autoSkip: items.length > 24,
              color: tickColor,
            },
            grid: { color: gridColor },
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: t('engUtil.chartYAxis'),
              color: tickColor,
            },
            ticks: { color: tickColor },
            grid: { color: gridColor },
          },
        },
      }}
      height={isFull ? 500 : undefined}
    />
  )
}
