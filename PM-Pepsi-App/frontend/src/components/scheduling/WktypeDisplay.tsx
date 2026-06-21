import { formatWktypeDisplayWithMat } from '@/lib/wktype-zd-mapping'

type WktypeDisplayProps = {
  code: string
  mat?: string | null
  className?: string
}

/** คอลัมน์ Type — Maint Code · ZB · ZD (ZD02 PM มีรหัส Maint ด้านหน้า) */
export function WktypeDisplay({ code, mat, className }: WktypeDisplayProps) {
  const d = formatWktypeDisplayWithMat(code, mat)
  return (
    <span className={className ?? 'text-xs'} title={d.tooltip}>
      <span className="font-mono">{d.primary}</span>
    </span>
  )
}
