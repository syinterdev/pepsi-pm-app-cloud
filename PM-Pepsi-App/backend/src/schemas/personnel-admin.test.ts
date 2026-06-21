import { describe, expect, it } from 'vitest'
import {
  personnelAdminItemSchema,
  personnelAdminUpsertBodySchema,
} from './personnel-admin.js'

describe('personnel admin schema', () => {
  it('accepts explicit userrole and expanded legacy userst A/H/U/W', () => {
    const parsed = personnelAdminUpsertBodySchema.parse({
      idwkctr: 'HR001',
      wkctr: 'PAC001',
      userst: 'H',
      userrole: 'manager',
      labourcost: 120,
    })

    expect(parsed.userst).toBe('H')
    expect(parsed.userrole).toBe('manager')
  })

  it('defaults new personnel to planner role and U menuright context', () => {
    const parsed = personnelAdminUpsertBodySchema.parse({
      idwkctr: 'HR002',
      wkctr: 'PAC002',
    })

    expect(parsed.userst).toBe('U')
    expect(parsed.userrole).toBe('planner')
  })

  it('rejects unsupported role values before they reach the database', () => {
    const parsed = personnelAdminUpsertBodySchema.safeParse({
      idwkctr: 'HR003',
      wkctr: 'PAC003',
      userrole: 'head',
    })

    expect(parsed.success).toBe(false)
  })

  it('requires userrole in list items so Admin UI can render explicit role badges', () => {
    const parsed = personnelAdminItemSchema.safeParse({
      idwkctr: 'HR004',
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
      wkctr: 'PAC004',
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
      userst: 'U',
      userrole: 'planner',
      workstatus: 'ACTIVE',
      imgmember: null,
      imgmemberMime: 'image/webp',
      imgmemberBytes: 0,
      hasImage: false,
    })

    expect(parsed.success).toBe(true)
  })
})
