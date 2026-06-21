import { describe, expect, it } from 'vitest'
import { groupPmReadingsForBoard } from './pm-readings-query.js'

describe('groupPmReadingsForBoard', () => {
  it('groups by wo+machine+pmlist+kind and keeps trend points', () => {
    const base = {
      wkorder: '4001',
      team: 'EE',
      mntplan: 'M1',
      machine: 'PUMP',
      pmlist: 'Check current',
      kind: 'current_3phase',
      unit: 'A',
      warning_limit: null,
      alarm_limit: null,
      wkctr: 'PRO001',
      pm_note: null,
    }
    const t1 = new Date('2026-05-26T08:00:00Z')
    const t2 = new Date('2026-05-26T10:00:00Z')
    const groups = groupPmReadingsForBoard(
      [
        { ...base, measured_at: t1, v1: '90', v2: '91', v3: '89' },
        { ...base, measured_at: t2, v1: '97', v2: '98', v3: '96' },
      ],
      8,
    )
    expect(groups).toHaveLength(1)
    expect(groups[0]?.points).toHaveLength(2)
    expect(groups[0]?.latestV1).toBe(97)
  })
})
