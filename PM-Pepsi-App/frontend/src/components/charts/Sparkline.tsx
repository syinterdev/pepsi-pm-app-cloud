import { cn } from '@/lib/utils'
import { coerceNumberArray } from '@/lib/coerce-array'
import { useId, useMemo } from 'react'

export type SparklineTone =
  | 'pepsi-blue'
  | 'pepsi-red'
  | 'pepsi-orange'
  | 'pepsi-white'
  | 'neutral'

type Props = {
  data: number[]
  className?: string
  tone?: SparklineTone
  height?: number
  width?: number
  /** แสดงพื้นที่เติมใต้เส้น */
  fill?: boolean
}

function normalizeSeries(values: number[]): { min: number; max: number; points: number[] } {
  if (values.length === 0) return { min: 0, max: 0, points: [] }
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  return {
    min,
    max,
    points: values.map((v) => (v - min) / span),
  }
}

export function Sparkline({
  data,
  className,
  tone = 'pepsi-blue',
  height = 40,
  width = 120,
  fill = true,
}: Props) {
  const gradId = useId().replace(/:/g, '')
  const series = coerceNumberArray(data)
  const { points } = useMemo(() => normalizeSeries(series), [series])

  if (points.length < 2) {
    return (
      <svg
        width={width}
        height={height}
        className={cn('opacity-40', className)}
        aria-hidden
      >
        <line
          x1={0}
          y1={height / 2}
          x2={width}
          y2={height / 2}
          stroke="currentColor"
          strokeWidth={1.5}
          strokeDasharray="4 3"
        />
      </svg>
    )
  }

  const padY = 4
  const innerH = height - padY * 2
  const step = width / (points.length - 1)

  const linePoints = points
    .map((p, i) => {
      const x = i * step
      const y = padY + innerH * (1 - p)
      return `${x},${y}`
    })
    .join(' ')

  const areaPath = [
    `M 0,${height}`,
    ...points.map((p, i) => {
      const x = i * step
      const y = padY + innerH * (1 - p)
      return `L ${x},${y}`
    }),
    `L ${width},${height}`,
    'Z',
  ].join(' ')

  const stroke =
    tone === 'pepsi-red'
      ? 'var(--brand-pepsi-red)'
      : tone === 'pepsi-orange'
        ? 'var(--brand-logo-orange)'
        : tone === 'pepsi-white'
          ? 'rgba(255,255,255,0.95)'
          : tone === 'neutral'
            ? 'var(--app-text-muted)'
            : 'var(--brand-logo-blue-dark)'

  const fillTop =
    tone === 'pepsi-red'
      ? 'var(--brand-pepsi-red)'
      : tone === 'pepsi-orange'
        ? 'var(--brand-logo-orange)'
        : tone === 'pepsi-white'
          ? 'rgba(255,255,255,0.35)'
          : 'var(--brand-logo-blue-dark)'

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn('overflow-visible', className)}
      aria-hidden
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fillTop} stopOpacity={0.28} />
          <stop offset="100%" stopColor={fillTop} stopOpacity={0} />
        </linearGradient>
      </defs>
      {fill ? <path d={areaPath} fill={`url(#${gradId})`} /> : null}
      <polyline
        points={linePoints}
        fill="none"
        stroke={stroke}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={width}
        cy={padY + innerH * (1 - points[points.length - 1]!)}
        r={3}
        fill={stroke}
      />
    </svg>
  )
}

/** เปอร์เซ็นต์เปลี่ยนแปลง first→last (สำหรับ badge เล็ก) */
export function sparklineDelta(data: number[] | undefined | null): number | null {
  const series = coerceNumberArray(data)
  if (series.length < 2) return null
  const first = series[0]!
  const last = series[series.length - 1]!
  if (first === 0) return last > 0 ? 100 : 0
  return Math.round(((last - first) / first) * 100)
}
