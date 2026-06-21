import { Card } from '@/components/ui/card'
import { appCardPadClass, type AppCardPad } from '@/lib/card-padding'
import { cn } from '@/lib/utils'
import type { ComponentProps } from 'react'

type AdminCardProps = ComponentProps<typeof Card> & {
  pad?: AppCardPad
}

/** Elevated glass card inside `/admin/*` — padding ตรง AppCard (`--app-card-padding*`) */
export function AdminCard({ className, pad = 'none', ...props }: AdminCardProps) {
  return <Card className={cn('admin-card', appCardPadClass(pad), className)} {...props} />
}

