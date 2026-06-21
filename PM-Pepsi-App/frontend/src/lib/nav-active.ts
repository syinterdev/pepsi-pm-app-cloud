function normalizePath(path: string): string {
  const trimmed = path.replace(/\/+$/, '') || '/'
  return trimmed || '/'
}

/** NavLink-style active match for sidebar QA (U4g.10 nested routes) */
export function isNavPathActive(pathname: string, to: string, end?: boolean): boolean {
  const base = normalizePath(to)
  const path = normalizePath(pathname)
  if (end) return path === base
  if (path === base) return true
  return path.startsWith(`${base}/`)
}

/** NavRouteGuard — allowed menu path covers current URL (parent → child) */
export function pathAllowedForUser(pathname: string, allowedPaths: string[]): boolean {
  const path = normalizePath(pathname)
  return allowedPaths.some((raw) => {
    const base = normalizePath(raw.split('?')[0] ?? raw)
    if (path === base) return true
    if (base !== '/' && path.startsWith(`${base}/`)) return true
    return false
  })
}
