import { adminBreadcrumbTrail } from '@/lib/admin-breadcrumb'
import { cn } from '@/lib/utils'
import { ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router-dom'

export function AdminBreadcrumb({ className }: { className?: string }) {
  const { t } = useTranslation('admin')
  const { pathname } = useLocation()
  const crumbs = adminBreadcrumbTrail(pathname, t)

  return (
    <nav aria-label="breadcrumb" className={cn('admin-breadcrumb', className)}>
      <ol className="flex flex-wrap items-center gap-1">
        {crumbs.map((crumb, i) => (
          <li key={`${crumb.label}-${i}`} className="flex items-center gap-1">
            {i > 0 ? (
              <ChevronRight className="size-3.5 shrink-0 opacity-50" aria-hidden />
            ) : null}
            {crumb.current || !crumb.to ? (
              <span
                className="font-medium text-[var(--admin-text)]"
                aria-current={crumb.current ? 'page' : undefined}
              >
                {crumb.label}
              </span>
            ) : (
              <Link to={crumb.to} className="admin-breadcrumb__link">
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
