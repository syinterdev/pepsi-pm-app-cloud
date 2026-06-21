import { ModulePortalCard } from '@/components/portal/ModulePortalCard'
import { PortalShell } from '@/components/portal/PortalShell'
import { portalGridMotion } from '@/features/portal/portal-motion'
import { EmptyState } from '@/components/ui/empty-state'
import { QueryLoadErrorState } from '@/components/ui/query-load-error'
import { Skeleton } from '@/components/ui/skeleton'
import { motion, useReducedMotion } from 'framer-motion'
import { getStoredAuthUser } from '@/features/auth/login-api'
import { resolvePostLoginPathForUserst } from '@/lib/primary-roles'
import { fetchPortalModules, requestModuleHandoff, type PortalModule } from '@/lib/portal-api'
import {
  isPortalAutoSkipEnabled,
  isPortalEnabled,
  PORTAL_DEFERRED_PATH_KEY,
  PORTAL_PATH,
} from '@/lib/portal-enabled'
import { arrayLength } from '@/lib/coerce-array'
import { useQuery } from '@tanstack/react-query'
import { LayoutGrid } from 'lucide-react'
import { useCallback, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

function PortalSkeleton() {
  return (
    <div className="portal-page__grid">
      {[1, 2, 3].map((n) => (
        <Skeleton key={n} className="min-h-[11.5rem] rounded-card" />
      ))}
    </div>
  )
}

function PortalModuleGrid({
  modules,
  onOpen,
}: {
  modules: PortalModule[]
  onOpen: (mod: PortalModule) => void
}) {
  const reduceMotion = useReducedMotion()
  const Wrapper = reduceMotion ? 'div' : motion.div
  const wrapperProps = reduceMotion
    ? { className: 'portal-page__grid' }
    : { className: 'portal-page__grid', ...portalGridMotion }

  return (
    <Wrapper {...wrapperProps}>
      {modules.map((mod, index) => (
        <ModulePortalCard
          key={mod.code}
          module={mod}
          motionIndex={index}
          onOpen={() => onOpen(mod)}
        />
      ))}
    </Wrapper>
  )
}

export function PortalPage() {
  const { t, i18n } = useTranslation(['portal', 'common'])
  const navigate = useNavigate()

  const q = useQuery({
    queryKey: ['portal-modules'],
    queryFn: fetchPortalModules,
    staleTime: 60_000,
    retry: 1,
  })

  useEffect(() => {
    if (!q.isError) return
    toast.error(t('loadError'))
  }, [q.isError, t])

  const handoffBusy = useRef(false)

  const runExternalHandoff = useCallback(
    async (mod: PortalModule) => {
      if (handoffBusy.current) return
      handoffBusy.current = true
      try {
        const { redirectUrl } = await requestModuleHandoff(mod.code)
        window.location.assign(redirectUrl)
      } catch {
        toast.error(t('handoffError'))
        handoffBusy.current = false
      }
    },
    [t],
  )

  useEffect(() => {
    if (!isPortalAutoSkipEnabled() || !q.data) return
    const { autoRedirect, modules } = q.data
    if (autoRedirect) {
      if (autoRedirect.startsWith('http://') || autoRedirect.startsWith('https://')) {
        window.location.assign(autoRedirect)
        return
      }
      navigate(autoRedirect, { replace: true })
      return
    }
    if (Array.isArray(modules) && modules.length === 1) {
      const only = modules[0]
      if (only?.ready && only.handoff === 'code_exchange') {
        void runExternalHandoff(only)
      }
    }
  }, [q.data, navigate, runExternalHandoff])

  const openModule = useCallback(
    (mod: PortalModule) => {
      const localeIsTh = i18n.language.startsWith('th')
      const name = localeIsTh ? mod.nameTh : mod.nameEn

      if (!mod.ready) {
        toast.info(t('toast.comingSoon', { name }))
        return
      }

      if (mod.code === 'pm') {
        const deferred = sessionStorage.getItem(PORTAL_DEFERRED_PATH_KEY)
        sessionStorage.removeItem(PORTAL_DEFERRED_PATH_KEY)
        const user = getStoredAuthUser()
        const target =
          deferred && deferred !== PORTAL_PATH
            ? deferred
            : mod.entryUrl || resolvePostLoginPathForUserst(user?.userst, '/plan-calendar')
        navigate(target)
        return
      }

      if (mod.handoff === 'code_exchange') {
        void runExternalHandoff(mod)
        return
      }

      if (mod.external && mod.entryUrl) {
        window.location.assign(mod.entryUrl)
        return
      }

      toast.info(t('toast.comingSoon', { name }))
    },
    [i18n.language, navigate, runExternalHandoff, t],
  )

  if (!isPortalEnabled()) {
    const user = getStoredAuthUser()
    return <Navigate to={resolvePostLoginPathForUserst(user?.userst, '/plan-calendar')} replace />
  }

  if (
    q.isLoading ||
    (isPortalAutoSkipEnabled() && q.data?.autoRedirect && arrayLength(q.data?.modules) === 1)
  ) {
    return (
      <PortalShell>
        <PortalSkeleton />
      </PortalShell>
    )
  }

  if (q.isError) {
    return (
      <PortalShell>
        <QueryLoadErrorState
          icon={LayoutGrid}
          title={t('common:errors.loadFailed')}
          error={q.error}
          description={t('noModules.description')}
          action={{
            label: t('common:actions.retry'),
            onClick: () => void q.refetch(),
          }}
        />
      </PortalShell>
    )
  }

  const modules = q.data?.modules ?? []

  if (modules.length === 0) {
    return (
      <PortalShell>
        <EmptyState
          icon={LayoutGrid}
          title={t('noModules.title')}
          description={t('noModules.description')}
          action={{
            label: t('noModules.openSettings'),
            onClick: () => navigate('/settings'),
          }}
        />
      </PortalShell>
    )
  }

  return (
    <PortalShell>
      <PortalModuleGrid modules={modules} onOpen={openModule} />
    </PortalShell>
  )
}
