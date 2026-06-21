/** สิทธิ์ module บน Portal — สอดคล้อง migration 102 / tbl_app_module.perm_code */
export const PORTAL_MODULE_DEFS = [
  {
    code: 'pm',
    permCode: 'module.pm',
    iconKey: 'wrench' as const,
  },
  {
    code: 'store',
    permCode: 'module.store',
    iconKey: 'package' as const,
  },
  {
    code: 'repair',
    permCode: 'module.repair',
    iconKey: 'bell' as const,
  },
] as const

export type PortalModuleCode = (typeof PORTAL_MODULE_DEFS)[number]['code']

/** การ์ดที่ role จะเห็นบน /portal จาก permission codes */
export function portalModuleCodesForPermissions(permissions: string[]): PortalModuleCode[] {
  const set = new Set(permissions)
  return PORTAL_MODULE_DEFS.filter((m) => set.has(m.permCode)).map((m) => m.code)
}

export function hasPortalViewPermission(permissions: string[]): boolean {
  return permissions.includes('portal.view')
}
