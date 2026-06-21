import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

/** เนื้อหาหน้าแอปหลัก — padding สอดคล้อง `admin-page-content` */
export function AppPageContent({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={cn('app-page-content', className)}>{children}</div>
}
