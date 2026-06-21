import { describe, expect, it } from 'vitest'
import {
  personnelAdminItemSchema,
  personnelDashboardResponseSchema,
} from '@/api/schemas'

describe('personnel schemas', () => {
  it('requires explicit userrole for Admin CRUD rows', () => {
    const parsed = personnelAdminItemSchema.parse({
      idwkctr: 'HR001',
      titlewkctr: null,
      namewkctr: 'Somchai',
      surnamewkctr: null,
      titlewkctreng: null,
      namewkctreng: null,
      surnamewkctreng: null,
      startwork: null,
      wkctrdate: null,
      iddepartment: null,
      department: null,
      idposition: null,
      position: null,
      wkctr: 'PAC001',
      plnt: null,
      cat: null,
      resp: null,
      idwkctrgroup: null,
      wkctrgroup: null,
      idwkctrtype: null,
      wkctrtype: null,
      idwklevel: null,
      wklevel: null,
      wkctrtel: null,
      wkctrmail: null,
      labourcost: 0,
      userst: 'H',
      userrole: 'manager',
      workstatus: 'ACTIVE',
      imgmember: null,
      imgmemberMime: 'image/webp',
      imgmemberBytes: 0,
      hasImage: false,
    })

    expect(parsed.userrole).toBe('manager')
  })

  it('keeps profile.userRole aligned with dashboard role for role-based dashboard sections', () => {
    const parsed = personnelDashboardResponseSchema.parse({
      role: 'technician',
      roleLabel: 'ช่าง (Technician)',
      profile: {
        accountType: 'workcenter',
        idwkctr: 'HR002',
        username: 'HR002',
        displayName: 'Technician User',
        wkctr: 'PAC002',
        userst: 'W',
        userRole: 'technician',
      },
      planning: {
        openCount: 1,
        closedCount: 2,
        recent: [],
      },
      confirmation: {
        totalClose: 2,
        totalMinutes: 120,
        recent: [],
      },
      worktime: null,
      roleData: {},
    })

    expect(parsed.profile.userRole).toBe(parsed.role)
  })
})
