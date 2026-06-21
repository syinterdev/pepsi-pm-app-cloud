import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from 'chart.js'
import { useTranslation } from 'react-i18next'
import { Bar } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

type Point = { date: string; count: number }

export function FailedLoginChart({ series }: { series: Point[] }) {
  const { t, i18n } = useTranslation('admin')

  if (series.length === 0) {
    return <p className="py-8 text-center text-caption">{t('security.chartEmpty')}</p>
  }

  const labels = series.map((p) => {
    const d = new Date(`${p.date}T12:00:00`)
    return d.toLocaleDateString(i18n.language, { day: 'numeric', month: 'short' })
  })

  return (
    <Bar
      data={{
        labels,
        datasets: [
          {
            label: t('security.chartSeriesLabel'),
            data: series.map((p) => p.count),
            backgroundColor: 'rgba(220, 38, 38, 0.75)',
          },
        ],
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: { display: false },
        },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1 } },
        },
      }}
      height={220}
    />
  )
}
