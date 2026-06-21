import { cn } from '@/lib/utils'
import type { ComponentProps } from 'react'

/** แถว KPI บน Admin Console / Security — 4 คอลัมน์บน desktop */
export function AdminKpiGrid({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn('admin-kpi-grid grid gap-4 sm:grid-cols-2 lg:grid-cols-4', className)}
      {...props}
    />
  )
}
