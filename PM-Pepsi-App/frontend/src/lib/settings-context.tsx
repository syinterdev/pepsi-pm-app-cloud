import type { PublicSettings } from '@/api/schemas'
import { applyDocumentTitle, applyFavicon } from '@/lib/apply-public-settings'
import { applyBrandingAssetCss } from '@/lib/branding-asset-css'
import { fetchPublicSettings } from '@/lib/settings-api'
import { useQuery } from '@tanstack/react-query'
import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

export type SettingsContextValue = {
  settings: PublicSettings | undefined
  isLoading: boolean
  isError: boolean
  /** ใช้ bust cache รูป branding (โลโก้ / พื้นหลัง login) */
  brandingCacheKey: number
  refetch: () => void
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

function MaintenanceBanner({ message }: { message: string }) {
  const { t } = useTranslation()
  return (
    <div
      role="alert"
      className="app-announcement--warn border-b px-4 py-2 text-center text-body-sm"
    >
      {message.trim() || t('shell.maintenance')}
    </div>
  )
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const q = useQuery({
    queryKey: ['settings', 'public'],
    queryFn: fetchPublicSettings,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })

  useEffect(() => {
    applyDocumentTitle(q.data?.appName)
  }, [q.data?.appName])

  useEffect(() => {
    applyFavicon(q.data?.hasFavicon, {
      cacheKey: q.dataUpdatedAt,
      sizePx: q.data?.faviconSizePx,
    })
  }, [q.data?.hasFavicon, q.data?.faviconSizePx, q.dataUpdatedAt])

  useEffect(() => {
    applyBrandingAssetCss(q.data)
  }, [q.data?.logoNavHeightPx, q.data?.logoLoginHeightPx, q.data?.faviconSizePx])

  const value = useMemo<SettingsContextValue>(
    () => ({
      settings: q.data,
      isLoading: q.isLoading,
      isError: q.isError,
      brandingCacheKey: q.dataUpdatedAt,
      refetch: () => void q.refetch(),
    }),
    [q.data, q.isLoading, q.isError, q.dataUpdatedAt, q.refetch],
  )

  return (
    <SettingsContext.Provider value={value}>
      {q.data?.maintenance.enabled ? (
        <MaintenanceBanner message={q.data.maintenance.message} />
      ) : null}
      {children}
    </SettingsContext.Provider>
  )
}

export function usePublicSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext)
  if (!ctx) {
    throw new Error('usePublicSettings must be used within SettingsProvider')
  }
  return ctx
}

/** Shorthand for RBAC-style permission checks on public branding flags. */
export function useAppSettings() {
  return usePublicSettings()
}

