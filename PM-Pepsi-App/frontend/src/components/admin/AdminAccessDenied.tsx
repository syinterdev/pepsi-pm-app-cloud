import { AdminPageContent } from '@/components/admin/AdminPageContent'
import type { ReactNode } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

export function AdminAccessDenied({
  message,
  permission,
}: {
  message?: ReactNode
  /** Permission code shown in denial message (e.g. admin.branding.read) */
  permission?: string
}) {
  const { t } = useTranslation('admin')

  const body =
    message ??
    (permission ? (
      <Trans
        t={t}
        i18nKey="accessDenied.missingPermission"
        values={{ permission }}
        components={{ code: <code className="text-xs" /> }}
      />
    ) : (
      t('accessDenied.default')
    ))

  return (
    <AdminPageContent>
      <p className="text-caption text-[var(--admin-text-muted)]">{body}</p>
      <Link
        to="/admin"
        className="mt-2 inline-block text-body-sm text-[var(--admin-primary)] underline"
      >
        {t('accessDenied.backToConsole')}
      </Link>
    </AdminPageContent>
  )
}
