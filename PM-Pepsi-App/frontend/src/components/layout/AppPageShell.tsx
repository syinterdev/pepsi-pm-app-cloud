import { AppPageContent } from '@/components/layout/AppPageContent'
import { AppPageHero, AppPageHeroHints } from '@/components/layout/AppPageHero'
import { coerceStringArray } from '@/lib/coerce-array'
import { SchedulingPageStack } from '@/components/scheduling/SchedulingPageLayout'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

/** แต่ละบล็อกในหน้า — fade-up เหมือน `/calendar` */
export {
  SchedulingPageSection as AppPageSection,
  SchedulingPageStack,
  SchedulingSection as AppPageSectionCard,
  schedulingFadeUp,
} from '@/components/scheduling/SchedulingPageLayout'

/** รูปแบบมาตรฐานหน้าแอป: hero gradient + animated content stack */
export function AppPageShell({
  title,
  description,
  eyebrow,
  headerActions,
  hints,
  heroMeta,
  contentClassName,
  /** ห่อ children ด้วย `SchedulingPageStack` (fade-up ต่อ section) */
  stack = true,
  children,
}: {
  title: string
  description?: string
  eyebrow?: string
  headerActions?: ReactNode
  /** chip คำอธิบายสั้นบน hero — แบบ `/calendar` */
  hints?: string[]
  /** meta แทน/เพิ่ม hints ถ้าต้องการ custom */
  heroMeta?: ReactNode
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
    <div className="dashboard-page min-h-full w-full">
      <AppPageHero
        title={title}
        description={description}
        eyebrow={eyebrow}
        actions={headerActions}
        meta={meta}
      />
      <AppPageContent className={cn('scheduling-page pb-8', contentClassName)}>{body}</AppPageContent>
    </div>
  )
}
