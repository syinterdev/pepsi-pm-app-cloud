import { describe, expect, it } from 'vitest'
import { deriveLatestPmNote, type WoPmNoteEntry } from './wo-pm-note-entry.js'

describe('deriveLatestPmNote', () => {
  it('returns empty when no entries', () => {
    expect(deriveLatestPmNote([])).toEqual({
      note: '',
      noteUpdatedAt: null,
      noteWkctr: '',
    })
  })

  it('uses last entry in chronological list', () => {
    const notes: WoPmNoteEntry[] = [
      {
        identry: 1,
        note: 'แผนออกแต่เครื่องหยุด',
        wkctr: 'PRO001',
        createdBy: 'PRO001',
        createdAt: '2026-05-26T08:00:00.000Z',
      },
      {
        identry: 2,
        note: 'เลื่อนทำวันที่ 29.05',
        wkctr: 'EE002',
        createdBy: 'EE002',
        createdAt: '2026-05-27T09:00:00.000Z',
      },
    ]
    expect(deriveLatestPmNote(notes)).toEqual({
      note: 'เลื่อนทำวันที่ 29.05',
      noteUpdatedAt: '2026-05-27T09:00:00.000Z',
      noteWkctr: 'EE002',
    })
  })
})
