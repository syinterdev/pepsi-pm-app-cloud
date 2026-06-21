import { describe, expect, it } from 'vitest'
import { MASTER_ENTITIES, MASTER_ENTITY_IDS, masterDataHref } from './master-entities'

/** Mirrors backend `SUPPORTED_MASTER_ENTITIES` in schemas/master-data.ts */
const API_ENTITIES = [
  'activitytype',
  'department',
  'equipment',
  'functional',
  'reason',
  'workstatus',
  'worktype',
  'zb',
  'lineproduct',
  'zone',
  'machine',
  'material',
  'level',
  'position',
  'group',
  'tasklist',
  'lineschdul',
] as const

describe('master entities hub', () => {
  it('lists 17 entities aligned with API', () => {
    expect(MASTER_ENTITIES).toHaveLength(17)
    expect([...MASTER_ENTITY_IDS].sort()).toEqual([...API_ENTITIES].sort())
  })

  it('builds master-data deep links', () => {
    expect(masterDataHref('department')).toBe('/master-data?entity=department')
    expect(masterDataHref('line product')).toBe('/master-data?entity=line%20product')
  })
})
