import { Sparkline, type SparklineTone } from '@/components/charts/Sparkline'
import { useTranslation } from 'react-i18next'

export type BoardKpiItem = {
  label: string
  value: string
  hint: string
  trend: number[]
  tone: SparklineTone
  /** ค่ายาว (เช่น วันที่นำเข้า) — ลดขนาดตัวเลข */
  compactValue?: boolean
}

type Props = {
  items: BoardKpiItem[]
  loading?: boolean
  /** อยู่ในโหมดสไลด์โซน D */
  carousel?: boolean
}

/** โซน A — KPI 4 การ์ด (อ่านจากระยะ ~3 m) */
export function BoardKpiZone({ items, loading, carousel = false }: Props) {
  const { t } = useTranslation('board')
  return (
    <section
      className={
        carousel
          ? 'engineering-board__zone engineering-board__zone--a engineering-board__kpi-row engineering-board__kpi-row--carousel'
          : 'engineering-board__zone engineering-board__zone--a engineering-board__kpi-row'
      }
      aria-label={t('zoneAAria')}
    >
      <p className="engineering-board__zone-tag">{t('zoneA')}</p>
      <div className="engineering-board__grid">
        {loading && items.length === 0
          ? Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="engineering-board__kpi engineering-board__kpi--skeleton" />
            ))
          : items.map((k) => (
              <div
                key={k.label}
                className="engineering-board__kpi"
                data-tone={k.tone}
              >
                <p className="engineering-board__kpi-label">{k.label}</p>
                <p
                  className={
                    k.compactValue
                      ? 'engineering-board__kpi-value engineering-board__kpi-value--compact'
                      : 'engineering-board__kpi-value'
                  }
                >
                  {k.value}
                </p>
                <p className="engineering-board__kpi-hint">{k.hint}</p>
                <div className="engineering-board__kpi-spark">
                  <Sparkline data={k.trend} tone={k.tone} width={120} height={36} />
                </div>
              </div>
            ))}
      </div>
    </section>
  )
}
