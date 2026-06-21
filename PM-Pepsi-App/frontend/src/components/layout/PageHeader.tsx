import { AppPageHero } from '@/components/layout/AppPageHero'
import type { ReactNode } from 'react'

/** @deprecated ใช้ `AppPageHero` โดยตรง — wrapper คงไว้เพื่อ backward compat */
export function PageHeader({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children?: ReactNode
  className?: string
}) {
  return (
    <AppPageHero title={title} description={description} actions={children} />
  )
}
