import {
  apiNavItemsToEntries,
  collectNavPaths,
  fetchNavMenu,
  getFallbackNav,
  stripDeprecatedNavEntries,
  supplementNavFromFallback,
} from '@/lib/nav-menu-api'
import { effectivePermissions } from '@/lib/permissions'
import { filterNavForUser } from '@/lib/nav-rbac'
import { getRbacPreviewSnapshot, subscribeRbacPreview } from '@/lib/rbac-preview'
import { useAuthUser } from '@/lib/use-permission'
import type { NavEntry } from '@/components/layout/nav-config'
import { useQuery } from '@tanstack/react-query'
import { localizeNavEntries } from '@/lib/localize-nav'
import { arrayLength } from '@/lib/coerce-array'
import { useAppLocale } from '@/providers/I18nProvider'
import { useMemo, useSyncExternalStore } from 'react'
import { useTranslation } from 'react-i18next'

function useRbacPreview() {
  return useSyncExternalStore(subscribeRbacPreview, getRbacPreviewSnapshot, () => null)
}

export function useAppNav() {
  const { t, i18n } = useTranslation()
  const { locale } = useAppLocale()
  const authUser = useAuthUser()
  const preview = useRbacPreview()
  const navPerms = effectivePermissions(authUser)
  const permissionKey = `${preview?.roleCode ?? ''}|${navPerms?.join('|') ?? ''}`

  const q = useQuery({
    queryKey: ['nav-menu', authUser?.userst, permissionKey],
    queryFn: fetchNavMenu,
    enabled: Boolean(authUser),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })

  const entries: NavEntry[] = useMemo(() => {
    if (!authUser) return []
    const base =
      arrayLength(q.data?.items) > 0
        ? supplementNavFromFallback(apiNavItemsToEntries(q.data!.items), getFallbackNav())
        : getFallbackNav()
    const navUserst = preview?.roleCode ?? authUser.userst
    return stripDeprecatedNavEntries(
      filterNavForUser(navUserst, base, navPerms, {
        rbacStrict: (navPerms?.length ?? 0) > 0,
      }),
    )
  }, [authUser, permissionKey, q.data])

  const localizedEntries = useMemo(
    () => localizeNavEntries(entries, t, locale),
    [entries, t, locale, i18n.language],
  )

  const allowedPaths = useMemo(() => collectNavPaths(localizedEntries), [localizedEntries])

  return {
    entries: localizedEntries,
    allowedPaths,
    isLoading: q.isLoading,
    isError: q.isError,
    source: arrayLength(q.data?.items) > 0 ? ('api' as const) : ('fallback' as const),
  }
}
