import { describe, expect, it } from 'vitest'
import { navPathsForRolePreview, rolePreviewHidesAdminRoutes } from '@/lib/rbac-role-nav-preview'

const plannerPerms = [
  'dashboard.read',
  'planning.read',
  'planning.assign',
  'work-orders.read',
  'calendar.read',
  'backlog.read',
  'personnel.read',
  'manhours.read',
  'reports.read',
  'confirmation.read',
]

const technicianPerms = [
  'dashboard.read',
  'calendar.read',
  'work-orders.read',
  'confirmation.read',
  'confirmation.write',
  'manhours.read',
]

const managerPerms = [
  'dashboard.read',
  'planning.read',
  'work-orders.read',
  'confirmation.read',
  'confirmation.write',
  'confirmation.close',
  'reports.read',
  'manhours.read',
]

describe('rbac-role-nav-preview', () => {
  it('planner U sees planning and confirmation but not admin', () => {
    const paths = navPathsForRolePreview('U', plannerPerms)
    expect(paths).toContain('/planning')
    expect(paths).toContain('/confirmation')
    expect(paths).not.toContain('/admin/users')
    expect(rolePreviewHidesAdminRoutes(plannerPerms)).toBe(true)
  })

  it('technician W sees confirmation but not planning or admin', () => {
    const paths = navPathsForRolePreview('W', technicianPerms)
    expect(paths).toContain('/confirmation')
    expect(paths).not.toContain('/planning')
    expect(paths).not.toContain('/admin/roles')
  })

  it('manager H sees confirmation without admin routes', () => {
    const paths = navPathsForRolePreview('H', managerPerms)
    expect(paths).toContain('/confirmation')
    expect(paths).not.toContain('/admin/branding')
    expect(rolePreviewHidesAdminRoutes(managerPerms)).toBe(true)
  })
})
