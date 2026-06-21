import { describe, expect, it } from 'vitest'
import { dashboardClosedWhere } from './dashboard-closed-filter.js'

describe('dashboardClosedWhere', () => {
  it('requires actfinish and approved QC', () => {
    const sql = dashboardClosedWhere('i')
    expect(sql).toContain('i.actfinish IS NOT NULL')
    expect(sql).toContain("confirm_qc_status, ''))) = 'approved'")
  })

  it('supports custom alias', () => {
    expect(dashboardClosedWhere('wo')).toContain('wo.actfinish')
  })
})
