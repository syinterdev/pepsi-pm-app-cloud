import { describe, expect, it } from 'vitest'
import { buildWoTechnicianStatusRows } from './wo-technician-status'

describe('buildWoTechnicianStatusRows', () => {
  it('marks closed technicians as done', () => {
    const rows = buildWoTechnicianStatusRows({
      assignees: [{ kind: 'person', code: 'PAC001', displayName: 'ช่าง A' }],
      personnelCloses: [{ wkctr: 'PAC001', displayName: 'ช่าง A' }],
      supervisorCloses: [],
    })
    expect(rows).toHaveLength(1)
    expect(rows[0]?.status).toBe('done')
    expect(rows[0]?.statusLabel).toBe('Completed')
  })

  it('marks unclosed assignees as pending', () => {
    const rows = buildWoTechnicianStatusRows({
      assignees: [{ kind: 'person', code: 'PAC002', displayName: 'ช่าง B' }],
      personnelCloses: [],
      supervisorCloses: [],
    })
    expect(rows[0]?.status).toBe('pending')
    expect(rows[0]?.statusLabel).toBe('Pending')
  })
})
