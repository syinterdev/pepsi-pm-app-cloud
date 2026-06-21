import { AdminAccessDenied } from '@/components/admin/AdminAccessDenied'
import { AdminBreadcrumb } from '@/components/admin/AdminBreadcrumb'
import { AdminPageRoot } from '@/components/admin/AdminPageRoot'
import { AdminPepsiStripe } from '@/components/admin/AdminPepsiStripe'
import { AdminDensityToggle } from '@/components/admin/AdminDensityToggle'
import { AdminTour } from '@/components/admin/AdminTour'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { Button } from '@/components/ui/button'
import { hasSeenAdminTourAsync } from '@/lib/admin-tour-pref'
import { ADMIN_READ_PERMISSIONS } from '@/lib/admin-sections'
import { readAdminDensity, subscribeAdminDensity } from '@/lib/admin-layout-preference'
import { useAnyPermission } from '@/lib/use-permission'
import { cn } from '@/lib/utils'
import { AnimatePresence, motion } from 'framer-motion'
import { Compass } from 'lucide-react'
import { useEffect, useState, useSyncExternalStore } from 'react'
import { useTranslation } from 'react-i18next'
import { Outlet, useLocation } from 'react-router-dom'

const outletMotion = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const },
}

export function AdminLayout() {
  const { t } = useTranslation('admin')
  const location = useLocation()
  const canAdmin = useAnyPermission(ADMIN_READ_PERMISSIONS)
  const [runTour, setRunTour] = useState(false)
  const density = useSyncExternalStore(subscribeAdminDensity, readAdminDensity, () => 'cozy' as const)

  useEffect(() => {
    if (!canAdmin || !location.pathname.startsWith('/admin')) return
    let cancelled = false
    let timeoutId: ReturnType<typeof setTimeout> | undefined
    void (async () => {
      const seen = await hasSeenAdminTourAsync()
      if (cancelled || seen) return
      timeoutId = setTimeout(() => setRunTour(true), 600)
    })()
    return () => {
      cancelled = true
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [canAdmin, location.pathname])

  if (!canAdmin) {
    return (
      <AdminPageRoot tourTarget="admin-console">
        <AdminAccessDenied message={t('accessDenied.layout')} />
      </AdminPageRoot>
    )
  }

  return (
    <div
      className={cn(
        'admin-layout-shell admin-theme-prototype flex min-h-full w-full flex-col',
        density === 'compact' ? 'admin-density-compact' : 'admin-density-cozy',
      )}
    >
      <AdminTour run={runTour} onRunChange={setRunTour} />
      <AdminPepsiStripe className="h-1.5" />
      <div className="admin-layout-glass flex w-full shrink-0 flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <AdminBreadcrumb />
        <div className="flex flex-wrap items-center gap-2">
          <AdminDensityToggle />
          <ThemeToggle variant="compact" className="admin-toolbar-btn" />
          <Button
            type="button"
            size="sm"
            className="admin-toolbar-btn admin-toolbar-primary"
            onClick={() => setRunTour(true)}
            aria-label={t('layout.tourAria')}
          >
            <Compass className="mr-1 size-4" />
            {t('layout.tour')}
          </Button>
        </div>
      </div>
      <div className="w-full flex-1">
        <AnimatePresence mode="wait">
          <motion.div key={location.pathname} {...outletMotion} className="w-full">
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
