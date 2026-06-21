import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const ROUTES_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../routes',
)

/** Route modules that must use createRequirePermission (not bare requireAuth on business APIs). */
const RBAC_ROUTE_FILES = [
  'dashboard.ts',
  'backlog.ts',
  'calendar.ts',
  'iw37n.ts',
  'reports.ts',
  'planning.ts',
  'scheduling.ts',
  'master-data.ts',
  'work-orders.ts',
  'personnel.ts',
  'manhours.ts',
]

/** Public or session-only routes — no tbl_permission gate. */
const EXEMPT_NO_RBAC = new Set([
  'auth.ts',
  'profile.ts',
  'nav.ts',
  'user-pref.ts',
  'announcements.ts',
  'health.ts',
  'settings.ts',
])

function hasRbacGate(src: string): boolean {
  return (
    src.includes('createRequirePermission') ||
    src.includes('createRequireKioskOrPermission')
  )
}

describe('RBAC route coverage', () => {
  it('business route modules use permission or kiosk-or-permission gate', () => {
    for (const file of RBAC_ROUTE_FILES) {
      const src = fs.readFileSync(path.join(ROUTES_DIR, file), 'utf8')
      expect(hasRbacGate(src), file).toBe(true)
      expect(src, file).not.toMatch(/const requireAuth = createRequireApiAuth/)
    }
  })

  it('exempt modules are not forced to use createRequirePermission', () => {
    for (const file of EXEMPT_NO_RBAC) {
      const full = path.join(ROUTES_DIR, file)
      expect(fs.existsSync(full), file).toBe(true)
    }
  })
})
