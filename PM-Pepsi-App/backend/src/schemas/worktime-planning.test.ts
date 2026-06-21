import { describe, expect, it } from 'vitest'
import { worktimePlanningItemSchema, worktimePlanningResponseSchema } from './manhours.js'

describe('worktime planning schema', () => {
  it('parses W_worktime_view row contract', () => {
    const parsed = worktimePlanningResponseSchema.parse({
      idwkctr: 'HR001',
      items: [
        {
          idplanw: 1,
          idiw37: 100,
          mntplan: 'MP-2026-01',
          wkorder: 'WO123',
          startDate: '2026-05-01',
          endDate: '2026-05-10',
          assigner: 'SUP01',
          comment: 'note',
        },
      ],
    })
    expect(worktimePlanningItemSchema.parse(parsed.items[0]).wkorder).toBe('WO123')
  })
})
