import { describe, expect, it, beforeEach } from 'vitest'
import {
  dismissAnnouncement,
  readDismissedAnnouncements,
} from '@/lib/announcement-dismiss'

describe('announcement-dismiss', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('starts empty', () => {
    expect(readDismissedAnnouncements().size).toBe(0)
  })

  it('persists dismissed ids', () => {
    const next = dismissAnnouncement(42)
    expect(next.has(42)).toBe(true)
    expect(readDismissedAnnouncements().has(42)).toBe(true)
  })
})
