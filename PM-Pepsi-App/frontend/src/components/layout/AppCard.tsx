import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { appCardPadClass, type AppCardPad } from '@/lib/card-padding'
import { cn } from '@/lib/utils'
import type { ComponentProps } from 'react'

const appCardSurface =
  'app-card border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text)] shadow-none'

type AppCardProps = ComponentProps<typeof Card> & {
  /** default 24px · compact 16px (ฟิลเตอร์) · none */
  pad?: AppCardPad
}

/** การ์ดเนื้อหาแอปหลัก — padding ตาม `--app-card-padding*` */
export function AppCard({ className, pad = 'none', ...props }: AppCardProps) {
  return (
    <Card className={cn(appCardSurface, appCardPadClass(pad), className)} {...props} />
  )
}

export function AppCardHeader({ className, ...props }: ComponentProps<typeof CardHeader>) {
  return <CardHeader className={className} {...props} />
}

export function AppCardTitle({ className, ...props }: ComponentProps<typeof CardTitle>) {
  return (
    <CardTitle
      className={cn('text-[var(--app-text)]', className)}
      {...props}
    />
  )
}

export function AppCardDescription({
  className,
  ...props
}: ComponentProps<typeof CardDescription>) {
  return (
    <CardDescription
      className={cn('text-[var(--app-text-muted)]', className)}
      {...props}
    />
  )
}

export function AppCardContent({ className, ...props }: ComponentProps<typeof CardContent>) {
  return <CardContent className={className} {...props} />
}

/** กล่องตาราง/ฟอร์ม — เงาเดียวกับ app-card แต่ไม่ยกเมื่อ hover */
export function AppTableShell({
  className,
  ...props
}: ComponentProps<'div'>) {
  return <div className={cn('app-table-shell', className)} {...props} />
}
