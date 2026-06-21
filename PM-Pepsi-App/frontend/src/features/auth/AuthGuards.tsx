import {
  POST_LOGIN_PATH_WORKCENTER,
  resolvePostLoginPath,
} from '@/features/auth/auth-paths'
import { resolvePostLoginPathForUserst } from '@/lib/primary-roles'
import { getStoredAuthUser, isLoggedIn, refreshAuthSession } from '@/features/auth/login-api'
import { HttpErrorPage } from '@/features/errors/HttpErrorPage'
import { ADMIN_READ_PERMISSIONS } from '@/lib/admin-sections'
import { pathAllowedForUser } from '@/lib/nav-active'
import { permissionForRoute, PUBLIC_NAV_PATHS } from '@/lib/nav-route-permissions'
import { hasPermission } from '@/lib/permissions'
import { useAppNav } from '@/lib/use-app-nav'
import { useAnyPermission, useAuthUser } from '@/lib/use-permission'
import { useEffect, useState, type ReactNode } from 'react'
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'

export {
  POST_LOGIN_PATH_WORKCENTER as POST_LOGIN_PATH,
  POST_LOGIN_PATH_MEMBER,
  POST_LOGIN_PATH_WORKCENTER,
  resolvePostLoginPath,
} from '@/features/auth/auth-paths'

export function RequireAuth() {
  const location = useLocation()
  const [checking, setChecking] = useState(true)
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      if (!isLoggedIn()) {
        if (!cancelled) {
          setAuthed(false)
          setChecking(false)
        }
        return
      }
      const ok = await refreshAuthSession()
      if (!cancelled) {
        setAuthed(ok)
        setChecking(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [location.key])

  if (checking) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[var(--app-bg)] text-caption">
        กำลังตรวจสอบเซสชัน…
      </div>
    )
  }

  if (!authed) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}

/** กัน deep link ไป route ที่ role ไม่มีสิทธิ์ (เมนูจาก tbmenu หรือ fallback) */
export function NavRouteGuard() {
  const location = useLocation()
  const navigate = useNavigate()
  const authUser = useAuthUser()
  const { allowedPaths, isLoading } = useAppNav()
  const allowedPathsKey = allowedPaths.join('\0')

  const routePerm = permissionForRoute(location.pathname)
  const isPublicRoute = [...PUBLIC_NAV_PATHS].some(
    (p) => location.pathname === p || location.pathname.startsWith(`${p}/`),
  )
  const hasRoutePerm = isPublicRoute || !routePerm || hasPermission(authUser, routePerm)

  useEffect(() => {
    if (!authUser || isLoading) return
    if (routePerm && !hasRoutePerm) return
    if (allowedPaths.length === 0) return
    if (pathAllowedForUser(location.pathname, allowedPaths)) return

    const fallback =
      allowedPaths.find((p) => p === resolvePostLoginPathForUserst(authUser.userst)) ??
      allowedPaths.find((p) => p === POST_LOGIN_PATH_WORKCENTER) ??
      allowedPaths[0]
    if (!fallback || location.pathname === fallback) return

    navigate(fallback, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- allowedPathsKey tracks path list
  }, [authUser, allowedPathsKey, hasRoutePerm, isLoading, location.pathname, navigate, routePerm])

  if (authUser && routePerm && !hasRoutePerm) {
    return <HttpErrorPage forcedCode={403} />
  }

  return <Outlet />
}

export function GuestOnly() {
  const location = useLocation()
  const from = (location.state as { from?: { pathname?: string } } | null)?.from

  if (isLoggedIn()) {
    const user = getStoredAuthUser()
    const mode = user?.accountType === 'member' ? 'member' : 'workcenter'
    return (
      <Navigate to={resolvePostLoginPath(from?.pathname, mode, user?.userst)} replace />
    )
  }
  return <Outlet />
}

export function RequireRole({
  role,
  children,
}: {
  role: 'admin'
  children: ReactNode
}) {
  const user = useAuthUser()
  const canAdmin = useAnyPermission([...ADMIN_READ_PERMISSIONS, 'personnel.write'])

  if (!user) return <Navigate to="/login" replace />
  if (role === 'admin' && !canAdmin) return <HttpErrorPage forcedCode={403} />
  return <>{children}</>
}

