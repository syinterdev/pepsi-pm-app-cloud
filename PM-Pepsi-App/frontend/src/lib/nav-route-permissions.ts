/**
 * Maps React routes to RBAC permission codes (tbl_permission).
 * Used when filtering sidebar fallback nav and API nav items client-side.
 */
/** เปิดได้โดยไม่ผ่าน NavRouteGuard (kiosk / public) */
export const PUBLIC_NAV_PATHS = new Set<string>(['/board'])

export const NAV_ROUTE_PERMISSION: Record<string, string> = {
  '/': 'dashboard.read',
  '/plan-calendar': 'planning.read',
  '/calendar': 'calendar.read',
  '/backlog': 'backlog.read',
  '/work-orders': 'work-orders.read',
  '/pm-vibration': 'confirmation.read',
  '/confirmation': 'confirmation.read',
  '/planning': 'planning.read',
  '/integration': 'iw37n.read',
  '/iw37n': 'iw37n.read',
  '/master-plan': 'master-data.read',
  '/master-data': 'master-data.read',
  '/manhours': 'manhours.read',
  '/worktime': 'manhours.read',
  '/personnel': 'personnel.read',
  '/personnel/admin': 'personnel.write',
  '/personnel/confirm': 'confirmation.read',
  '/reports': 'reports.read',
  '/reports/audit': 'reports.read',
  '/activity-log': 'reports.read',
  '/manhours-hr': 'manhours.read',
  '/summary-weekly': 'reports.read',
  '/user-log': 'user-log.read',
  '/settings': 'admin.settings.read',
  '/admin': 'admin.settings.read',
  '/admin/branding': 'admin.branding.read',
  '/admin/settings': 'admin.settings.read',
  '/admin/audit': 'admin.audit.read',
  '/admin/health': 'admin.health.read',
  '/admin/backup': 'admin.backup.read',
  '/admin/announcements': 'admin.announcement.read',
  '/admin/telegram': 'admin.telegram.read',
  '/admin/users': 'admin.users.read',
  '/admin/roles': 'admin.roles.read',
  '/admin/menu': 'admin.menu.read',
  '/admin/master': 'master-data.read',
  '/admin/security': 'admin.security.read',
  '/admin/about': 'admin.about.read',
}

export function permissionForRoute(path: string): string | undefined {
  if (NAV_ROUTE_PERMISSION[path]) return NAV_ROUTE_PERMISSION[path]
  const sorted = Object.keys(NAV_ROUTE_PERMISSION).sort((a, b) => b.length - a.length)
  for (const prefix of sorted) {
    if (prefix !== '/' && path.startsWith(`${prefix}/`)) {
      return NAV_ROUTE_PERMISSION[prefix]
    }
  }
  return undefined
}
