import { cn } from '@/lib/utils'
import type { ComponentProps } from 'react'

/** เนื้อหาหลักใต้ `AdminPageHeader` — padding จาก `.admin-page-content` ใน `index.css` */
export function AdminPageContent({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('admin-page-content', className)} {...props} />
}
