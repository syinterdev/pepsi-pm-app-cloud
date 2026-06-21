import { readAdminDensity, subscribeAdminDensity } from '@/lib/admin-layout-preference'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { useSyncExternalStore, type ReactNode } from 'react'

const pageMotion = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] as const },
  },
}

/** Root wrapper for `/admin/*` pages — tour target, density, page enter (skill-theme.md §4). */
export function AdminPageRoot({
  tourTarget,
  children,
  className,
}: {
  tourTarget: string
  children: ReactNode
  className?: string
}) {
  const density = useSyncExternalStore(subscribeAdminDensity, readAdminDensity, () => 'cozy' as const)

  return (
    <motion.div
      data-tour={tourTarget}
      data-admin-density={density}
      className={cn(
        'admin-page-root w-full',
        density === 'compact' ? 'admin-density-compact' : 'admin-density-cozy',
        className,
      )}
      variants={pageMotion}
      initial="hidden"
      animate="show"
    >
      {children}
    </motion.div>
  )
}
