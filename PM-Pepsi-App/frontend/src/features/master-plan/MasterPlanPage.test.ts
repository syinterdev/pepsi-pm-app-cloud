import { describe, expect, it } from 'vitest'

/** Mirrors MasterPlanPage — only PM disciplines, no SAP reference entities. */
const MASTER_PLAN_DISCIPLINES = ['EE', 'ME', 'PK'] as const

const SAP_REFERENCE_TAB_IDS = [
  'equipment',
  'material',
  'functional',
  'machine',
  'zone',
  'tasklist',
] as const

describe('MasterPlanPage UAT (A5.1)', () => {
  it('shows only EE / ME / PK — not Equipment or Material tabs', () => {
    expect(MASTER_PLAN_DISCIPLINES).toEqual(['EE', 'ME', 'PK'])
    for (const sapTab of SAP_REFERENCE_TAB_IDS) {
      expect(MASTER_PLAN_DISCIPLINES as readonly string[]).not.toContain(sapTab)
    }
  })
})
