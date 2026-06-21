import { Badge } from '@/components/ui/badge'
import { resolveRoleDisplayLabel } from '@/lib/role-display'
import { navPathsForRolePreview } from '@/lib/rbac-role-nav-preview'
import { getRbacPreviewSnapshot, subscribeRbacPreview } from '@/lib/rbac-preview'
import { useAppLocale } from '@/providers/I18nProvider'
import { useMemo, useSyncExternalStore } from 'react'
import { useTranslation } from 'react-i18next'

export function RoleNavPreview() {
  const { t } = useTranslation('admin')
  const { locale } = useAppLocale()
  const preview = useSyncExternalStore(subscribeRbacPreview, getRbacPreviewSnapshot, () => null)

  const paths = useMemo(() => {
    if (!preview) return []
    return navPathsForRolePreview(preview.roleCode, preview.permissions)
  }, [preview?.roleCode, preview?.permissions])

  if (!preview) return null

  const adminPaths = paths.filter((p) => p.startsWith('/admin'))

  return (
    <div className="app-tone-info rounded-card border px-4 py-3 text-body-sm">
      <p className="font-medium">
        {t('roles.navPreviewTitle', {
          code: preview.roleCode,
          name: resolveRoleDisplayLabel(preview, locale),
        })}
      </p>
      <p className="app-tone-info-muted mt-1 text-xs">
        {t('roles.navPreviewMeta', {
          paths: paths.length,
          perms: preview.permissions.length,
        })}
      </p>
      <div className="mt-2 flex max-h-32 flex-wrap gap-1 overflow-y-auto">
        {paths.map((p) => (
          <Badge
            key={p}
            variant="outline"
            className={
              p.startsWith('/admin')
                ? 'border-[color-mix(in_srgb,var(--admin-primary)_50%,var(--admin-border))] bg-[var(--admin-surface)] font-mono text-badge'
                : 'bg-[var(--admin-surface)] font-mono text-badge'
            }
          >
            {p}
          </Badge>
        ))}
      </div>
      {adminPaths.length === 0 ? (
        <p className="app-tone-success-strong mt-2 text-xs">{t('roles.navPreviewNoAdmin')}</p>
      ) : null}
    </div>
  )
}
