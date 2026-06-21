import { cn } from '@/lib/utils'

const sizeClass = {
  sm: 'size-7',
  md: 'size-9',
  lg: 'size-11',
  xl: 'size-12',
} as const

export type PepsiBrandMarkProps = {
  className?: string
  /** ขนาดวงกลม — พาเลตโลโก้ใหม่ (ส้มบน / แถบขาวกลาง / น้ำเงินเข้มล่าง) */
  size?: keyof typeof sizeClass
}

/** มาร์กวงกลมตามบรีฟลูกค้า — เฉดสีจริงใช้จาก asset โลโก้เมื่อลูกค้าส่งมอบ */
export function PepsiBrandMark({ className, size = 'md' }: PepsiBrandMarkProps) {
  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 overflow-hidden rounded-full border border-white/30 shadow-sm',
        sizeClass[size],
        className,
      )}
      aria-hidden
    >
      <span className="absolute inset-x-0 top-0 h-1/2 bg-[var(--brand-logo-orange)]" />
      <span className="absolute inset-x-0 bottom-0 h-1/2 bg-[var(--brand-logo-blue-dark)]" />
      <span className="absolute left-0 right-0 top-1/2 z-[1] h-0.5 -translate-y-1/2 bg-[var(--brand-logo-white)]" />
    </span>
  )
}
