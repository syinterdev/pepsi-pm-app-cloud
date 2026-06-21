import { usePermission } from '@/lib/use-permission'
import type { ReactNode } from 'react'

type CanPermissionProps = {
  permission: string
  children: ReactNode
  fallback?: ReactNode
}

/** Render children only when the current user has the permission (FE aligns with BE requirePermission). */
export function CanPermission({ permission, children, fallback = null }: CanPermissionProps) {
  const allowed = usePermission(permission)
  return allowed ? <>{children}</> : <>{fallback}</>
}
