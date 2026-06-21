import { cn } from '@/lib/utils'
import type { ComponentProps } from 'react'

/** แถว KPI 3 คอลัมน์ — ใช้คู่ `KpiStatCard` บน calendar / work-orders */
export function KpiStatGrid({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('grid gap-2 sm:grid-cols-3', className)} {...props} />
}
