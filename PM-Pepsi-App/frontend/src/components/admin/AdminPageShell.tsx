import { AdminPageContent } from '@/components/admin/AdminPageContent'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminPageRoot } from '@/components/admin/AdminPageRoot'
import { AppPageHeroHints } from '@/components/layout/AppPageHero'
import { coerceStringArray } from '@/lib/coerce-array'
import { SchedulingPageStack } from '@/components/scheduling/SchedulingPageLayout'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

/** fade-up section — เดียวกับแอปหลัก */
export {
  SchedulingPageSection as AdminPageSection,
  SchedulingSection as AdminPageSectionCard,
  schedulingFadeUp as adminPageFadeUp,
} from '@/components/scheduling/SchedulingPageLayout'

/** รูปแบบมาตรฐาน Admin: Root → Header (+ hints) → animated content */
export function AdminPageShell({
  tourTarget,
  title,
  description,
  eyebrow,
  hints,
  heroMeta,
  headerActions,
  contentClassName,
  stack = true,
  children,
}: {
  tourTarget: string
  title: string
  description?: string
  eyebrow?: string
  hints?: string[]
  heroMeta?: ReactNode
  headerActions?: ReactNode
  contentClassName?: string
  stack?: boolean
  children: ReactNode
}) {
  const safeHints = coerceStringArray(hints)
  const meta =
    safeHints.length > 0 ? (
      <>
        <AppPageHeroHints hints={safeHints} />
        {heroMeta}
      </>
    ) : (
      heroMeta
    )

  const body = stack ? <SchedulingPageStack>{children}</SchedulingPageStack> : children

  return (
    <AdminPageRoot tourTarget={tourTarget}>
      <AdminPageHeader title={title} description={description} eyebrow={eyebrow} meta={meta}>
        {headerActions}
      </AdminPageHeader>
      <AdminPageContent className={cn('admin-page-stack pb-8', contentClassName)}>
        {body}
      </AdminPageContent>
    </AdminPageRoot>
  )
}
