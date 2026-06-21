import { AppPageHero } from '@/components/layout/AppPageHero'
import { adminSectionGroupLabel } from '@/lib/admin-breadcrumb'
import { adminSectionForPath } from '@/lib/admin-sections'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'

/** Page title bar — gradient hero เดียวกับ `/calendar` (`AppPageHero` / `dashboard-hero`) */
export function AdminPageHeader({
  title,
  description,
  eyebrow,
  meta,
  children,
  className,
}: {
  title: string
  description?: string
  /** override กลุ่มเมนู (ค่าเริ่มต้นจาก path ปัจจุบัน) */
  eyebrow?: string
  /** hint chips + meta ใต้หัวข้อ */
  meta?: ReactNode
  children?: ReactNode
  className?: string
}) {
  const { t } = useTranslation('admin')
  const { pathname } = useLocation()
  const section = adminSectionForPath(pathname)
  const groupLabel = adminSectionGroupLabel(section, t)
  const eyebrowText = eyebrow ?? groupLabel ?? t('breadcrumb.admin')

  return (
    <AppPageHero
      compact
      className={cn('admin-page-header', className)}
      eyebrow={eyebrowText}
      title={title}
      description={description}
      meta={meta}
      actions={children}
    />
  )
}
