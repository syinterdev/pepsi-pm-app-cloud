import { describe, expect, it } from 'vitest'
import { mergeBoardActivityItems } from './board-activity.js'

describe('mergeBoardActivityItems', () => {
  it('merges assigned + closed by time desc and caps limit', () => {
    const items = mergeBoardActivityItems(
      [
        {
          source_id: 'assign-1',
          kind: 'assigned',
          event_unix: 1_700_000_000,
          wkorder: '100',
          idwkctr: '1',
          wkctr: 'PAC010',
          display_name: 'Narit',
          has_image: true,
        },
        {
          source_id: 'close-2',
          kind: 'closed',
          event_unix: 1_700_000_100,
          wkorder: '200',
          idwkctr: '2',
          wkctr: 'PAC011',
          display_name: 'A',
          has_image: false,
        },
        {
          source_id: 'assign-3',
          kind: 'assigned',
          event_unix: 1_600_000_000,
          wkorder: '300',
          idwkctr: '3',
          wkctr: 'PAC012',
          display_name: null,
          has_image: false,
        },
      ],
      2,
    )
    expect(items).toHaveLength(2)
    expect(items[0]?.kind).toBe('closed')
    expect(items[0]?.label).toBe('ปิดงาน')
    expect(items[1]?.kind).toBe('assigned')
    expect(items[1]?.label).toBe('รับงาน')
  })

  it('skips rows without valid unix', () => {
    expect(
      mergeBoardActivityItems(
        [
          {
            source_id: 'assign-x',
            kind: 'assigned',
            event_unix: null,
            wkorder: '1',
            idwkctr: '1',
            wkctr: 'A',
            display_name: null,
            has_image: false,
          },
        ],
        12,
      ),
    ).toHaveLength(0)
  })
})
