import type { AuthUser } from '@/api/schemas'
import { AUTH_CHANGED_EVENT, getStoredAuthUserSnapshot } from '@/features/auth/login-api'
import { useSyncExternalStore } from 'react'
import {
  effectivePermissions,
  hasAnyPermission,
  hasPermission,
  legacyHasPermission,
} from '@/lib/permissions-core'

export { legacyHasPermission, hasPermission, effectivePermissions, hasAnyPermission }

function subscribeAuth(onStoreChange: () => void) {
  window.addEventListener(AUTH_CHANGED_EVENT, onStoreChange)
  return () => window.removeEventListener(AUTH_CHANGED_EVENT, onStoreChange)
}

/** Reactive session user (updates on login/logout/refreshAuthSession). */
export function useAuthUser(): AuthUser | null {
  return useSyncExternalStore(subscribeAuth, getStoredAuthUserSnapshot, () => null)
}

/** True when the current session has the given RBAC permission code. */
export function usePermission(code: string): boolean {
  const user = useAuthUser()
  return hasPermission(user, code)
}

/** True when the session has at least one of the listed permissions. */
export function useAnyPermission(codes: readonly string[]): boolean {
  const user = useAuthUser()
  return hasAnyPermission(user, codes)
}
