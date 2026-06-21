import { describe, expect, it } from 'vitest'
import { mapRevisionToHubItem } from './revision-display.js'
import type { RevisionRow } from './resource-revision.js'

const baseRow: RevisionRow = {
  id: '1',
  resourceType: 'calendar_event',
  resourceId: '99',
  revisionNo: 2,
  actorId: 'WC01',
  actorRole: 'U',
  changeKind: 'move_plan',
  beforeJson: { displayDate: '2026-05-28' },
  afterJson: { targetDate: '2026-06-02', reasonCode: 'R01', comment: 'เครื่องหยุด', mpcount: 2 },
  createdAt: '2026-06-01T10:00:00.000Z',
  wkorder: '4001558092',
  operationshorttext: 'Pump check',
}

describe('revision-display', () => {
  it('maps move_plan revision to hub item', () => {
    const item = mapRevisionToHubItem(baseRow)
    expect(item.changeLabel).toBe('ย้ายวันแผน')
    expect(item.summary).toContain('2026-05-28')
    expect(item.summary).toContain('2026-06-02')
    expect(item.workOrder).toBe('4001558092')
  })
})
