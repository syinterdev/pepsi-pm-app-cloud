import { describe, expect, it } from 'vitest'
import {
  extractJobDetailFromPayload,
  extractResourceFromPayload,
  extractTimeRangeFromPayload,
  formatActivityResourceLabel,
} from './activity-log-enrich.js'

describe('activity-log-enrich', () => {
  it('extracts wkctr resource from close payload', () => {
    expect(
      extractResourceFromPayload(null, { wkctr: 'PAC009', startD: '01.05.2026' }),
    ).toBe('PAC009')
  })

  it('extracts job detail from operationshorttext', () => {
    expect(
      extractJobDetailFromPayload(null, { operationshorttext: 'เปลี่ยนลูกปืน' }),
    ).toBe('เปลี่ยนลูกปืน')
  })

  it('extracts start/end from mass confirm before payload', () => {
    expect(
      extractTimeRangeFromPayload(
        {
          startD: '01.05.2026',
          startT: '08:00',
          endD: '01.05.2026',
          endT: '12:00',
        },
        null,
      ),
    ).toEqual({
      startedAt: '01.05.2026 08:00',
      endedAt: '01.05.2026 12:00',
    })
  })

  it('formats resource label with table fallback', () => {
    expect(formatActivityResourceLabel('tbcofirm', '12345', null, null)).toBe('Confirm · 12345')
    expect(formatActivityResourceLabel('tbiw37n', '99', 'PRO012', null)).toBe('PRO012')
  })
})
