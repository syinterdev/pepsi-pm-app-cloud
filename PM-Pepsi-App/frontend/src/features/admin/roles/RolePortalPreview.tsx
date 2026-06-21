import { Badge } from '@/components/ui/badge'
import { resolveRoleDisplayLabel } from '@/lib/role-display'
import {
  hasPortalViewPermission,
  portalModuleCodesForPermissions,
  PORTAL_MODULE_DEFS,
} from '@/lib/portal-rbac-preview'
import { getRbacPreviewSnapshot, subscribeRbacPreview } from '@/lib/rbac-preview'
import { useAppLocale } from '@/providers/I18nProvider'
import { Bell, Box, Package, Wrench } from 'lucide-react'
import { useMemo, useSyncExternalStore } from 'react'
import { useTranslation } from 'react-i18next'

const ICONS = {
  wrench: Wrench,
  package: Package,
  bell: Bell,
  box: Box,
} as const

export function RolePortalPreview() {
  const { t } = useTranslation(['admin', 'portal'])
  const { locale } = useAppLocale()
  const preview = useSyncExternalStore(subscribeRbacPreview, getRbacPreviewSnapshot, () => null)

  const modules = useMemo(() => {
    if (!preview) return []
    return portalModuleCodesForPermissions(preview.permissions)
  }, [preview?.permissions])

  if (!preview) return null

  const showPortal = hasPortalViewPermission(preview.permissions) || modules.length > 0
  const displayName = resolveRoleDisplayLabel(preview, locale)

  return (
    <div className="app-tone-info rounded-card border px-4 py-3 text-body-sm">
      <p className="font-medium">
        {t('admin:roles.portalPreviewTitle', {
          code: preview.roleCode,
          name: displayName,
        })}
      </p>
      <p className="app-tone-info-muted mt-1 text-xs">{t('admin:roles.portalPreviewDesc')}</p>
      {!showPortal ? (
        <p className="mt-2 text-xs text-app-muted">{t('admin:roles.portalPreviewNone')}</p>
      ) : (
        <div className="mt-2 flex flex-wrap gap-2">
          {modules.length === 0 ? (
            <Badge variant="outline" className="text-badge">
              {t('admin:roles.portalPreviewNoModules')}
            </Badge>
          ) : (
            modules.map((code) => {
              const def = PORTAL_MODULE_DEFS.find((m) => m.code === code)
              const Icon = def ? ICONS[def.iconKey] : Box
              const title =
                t(`portal:modules.${code}.title`, { defaultValue: code }) || code
              return (
                <Badge
                  key={code}
                  variant="outline"
                  className="gap-1 bg-[var(--admin-surface)] font-normal text-badge"
                >
                  <Icon className="size-3.5 shrink-0" aria-hidden />
                  {title}
                </Badge>
              )
            })
          )}
        </div>
      )}
      <p className="mt-2 text-xs text-app-muted">{t('admin:roles.portalPreviewIdentity')}</p>
    </div>
  )
}
