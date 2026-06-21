import { AdminCard } from '@/components/admin/AdminCard'
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export type AdminKpiTone = 'default' | 'success' | 'warning' | 'danger' | 'info'

export function AdminKpiCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'default',
  className,
}: {
  label: ReactNode
  value: ReactNode
  hint?: ReactNode
  icon?: LucideIcon
  tone?: AdminKpiTone
  className?: string
}) {
  return (
    <AdminCard
      data-tone={tone}
      className={cn(
        'admin-kpi-card transition-[transform,box-shadow] duration-300',
        className,
      )}
    >
      <CardHeader className="admin-kpi-card__header pb-2">
        <CardDescription className="admin-kpi-card__label flex items-center gap-2 text-[var(--admin-text-muted)]">
          {Icon ? <Icon className="size-3.5 shrink-0 opacity-80" aria-hidden /> : null}
          {label}
        </CardDescription>
        <CardTitle className="admin-kpi-card__value text-[var(--admin-text)]">{value}</CardTitle>
      </CardHeader>
      {hint ? (
        <CardContent className="admin-kpi-card__hint pt-0 text-xs text-[var(--admin-text-muted)]">
          {hint}
        </CardContent>
      ) : null}
    </AdminCard>
  )
}
