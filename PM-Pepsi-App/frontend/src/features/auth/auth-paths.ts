import type { LoginMode } from '@/features/auth/login-api'
import {
  isPortalEnabled,
  PORTAL_DEFERRED_PATH_KEY,
  PORTAL_PATH,
} from '@/lib/portal-enabled'
import { resolvePostLoginPathForUserst } from '@/lib/primary-roles'

/** หลัง login work center — default ช่าง → plan-calendar (หรือ /portal เมื่อเปิด portal) */
export const POST_LOGIN_PATH_WORKCENTER = '/plan-calendar'

/** หลัง login สมาชิก — ไปหน้าแรก */
export const POST_LOGIN_PATH_MEMBER = '/'

function roleDefaultPath(mode: LoginMode, userst?: string | null): string {
  if (isPortalEnabled()) return PORTAL_PATH
  return mode === 'member'
    ? POST_LOGIN_PATH_MEMBER
    : resolvePostLoginPathForUserst(userst, POST_LOGIN_PATH_WORKCENTER)
}

export function resolvePostLoginPath(
  fromPath: string | undefined,
  mode: LoginMode = 'workcenter',
  userst?: string | null,
): string {
  const roleDefault = roleDefaultPath(mode, userst)

  if (!fromPath || fromPath === '/login' || fromPath === '/logout') {
    return roleDefault
  }

  if (isPortalEnabled() && fromPath !== PORTAL_PATH) {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(PORTAL_DEFERRED_PATH_KEY, fromPath)
    }
    return PORTAL_PATH
  }

  if (mode === 'member' && fromPath === '/') {
    return roleDefault
  }
  return fromPath
}
