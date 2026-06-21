import { cn } from '@/lib/utils'

export type PepsiStripeVariant = 'default' | 'sidebar'

/** แถบ 6 สีโลโก้ลูกค้า (น้ำเงินเข้ม · ส้ม · เขียวเข้ม · เขียวอ่อน · ฟ้า · ขาว) */
export function PepsiStripe({
  className,
  variant = 'default',
}: {
  className?: string
  variant?: PepsiStripeVariant
}) {
  return (
    <div
      className={cn(
        'admin-pepsi-stripe w-full shrink-0',
        variant === 'sidebar' ? 'pepsi-stripe--sidebar' : 'h-1',
        className,
      )}
      role="presentation"
      aria-hidden
    />
  )
}
