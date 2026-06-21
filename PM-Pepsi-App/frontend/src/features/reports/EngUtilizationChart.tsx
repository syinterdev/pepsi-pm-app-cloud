/**
 * Eng Utilization — `new file/Eng Utilization 2026.xlsx` (Summary Daily/Weekly/Monthly)
 * ข้อมูลจาก `POST /api/v1/reports/summary-weekly` (tbmanhours + view_order + confirmation)
 */
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
import type { EngUtilizationChartRow } from '@/lib/eng-utilization-chart'
import { readCssVar } from '@/lib/css-tokens'
import { useTranslation } from 'react-i18next'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

type Props = {
  items: EngUtilizationChartRow[]
  layout?: 'compact' | 'fullscreen'
  showRca?: boolean
  /** แกน/legend สีอ่อนสำหรับ Engineering Board */
  kioskDark?: boolean
}

export function EngUtilizationChart({
  items: chartRows,
  layout = 'compact',
  showRca = false,
  kioskDark = false,
}: Props) {
  const { t } = useTranslation('reports')
  const isFull = layout === 'fullscreen'
  const tickColor = kioskDark ? 'rgba(248, 250, 252, 0.72)' : undefined
  const titleColor = kioskDark ? readCssVar('--app-text') : undefined
  const gridColor = kioskDark ? 'rgba(255, 255, 255, 0.1)' : undefined
  const legendColor = kioskDark ? 'rgba(248, 250, 252, 0.85)' : undefined

  if (chartRows.length === 0) {
    return (
      <p
        className={
          kioskDark
            ? 'py-8 text-center text-body-sm text-white/60'
            : 'py-8 text-center text-caption'
        }
      >
        {t('summaryWeekly.chart.empty')}
      </p>
    )
  }

  const datasets = [
    {
      label: '% PM',
      data: chartRows.map((c) => c.percentPm),
      backgroundColor: 'rgba(16, 185, 129, 0.85)',
      stack: 'util',
    },
    {
      label: '% Reactive',
      data: chartRows.map((c) => c.percentReactive),
      backgroundColor: 'rgba(244, 63, 94, 0.85)',
      stack: 'util',
    },
  ]

  if (showRca) {
    datasets.push({
      label: '% RCA',
      data: chartRows.map((c) => c.percentRca),
      backgroundColor: 'rgba(139, 92, 246, 0.85)',
      stack: 'util',
    })
  }

  const chart = (
    <Bar
      data={{
        labels: chartRows.map((c) => c.label),
        datasets,
      }}
      options={{
        responsive: true,
        maintainAspectRatio: !isFull,
        aspectRatio: isFull ? undefined : 1.6,
        plugins: {
          title: {
            display: true,
            text: 'Eng Utilization (% ต่อ HR hour)',
            font: { size: isFull ? 18 : 14 },
            color: titleColor,
          },
          legend: {
            position: 'top',
            labels: legendColor ? { color: legendColor, boxWidth: 14 } : undefined,
          },
          tooltip: {
            callbacks: {
              afterBody: (tooltipItems) => {
                const idx = tooltipItems[0]?.dataIndex
                if (idx == null) return []
                const row = chartRows[idx]
                if (!row) return []
                return [
                  `PM ${row.pmHours.toFixed(1)} ชม.`,
                  `Reactive ${row.reactiveHours.toFixed(1)} ชม.`,
                  `RCA ${row.rcaHours.toFixed(1)} ชม.`,
                  `HR ${row.hrHour.toFixed(1)} ชม.`,
                  `Total (Excel) ${row.percentTotalExcel.toFixed(2)}%`,
                ]
              },
            },
          },
        },
        scales: {
          x: {
            stacked: true,
            ticks: {
              maxRotation: isFull ? 55 : 45,
              minRotation: isFull ? 45 : 35,
              autoSkip: chartRows.length > 20,
              font: { size: isFull ? 11 : 10 },
              color: tickColor,
            },
            grid: gridColor ? { color: gridColor } : undefined,
          },
          y: {
            stacked: true,
            min: 0,
            max: 100,
            title: {
              display: true,
              text: '% ของ HR hour',
              color: titleColor,
            },
            ticks: {
              callback: (v) => `${v}%`,
              color: tickColor,
            },
            grid: gridColor ? { color: gridColor } : undefined,
          },
        },
      }}
    />
  )

  if (isFull) return chart

  return (
    <div className="relative h-[min(70vh,520px)] w-full min-w-0">
      <div className="h-full w-full min-w-[min(100%,480px)] sm:min-w-0">{chart}</div>
    </div>
  )
}
