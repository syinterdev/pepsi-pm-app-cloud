import { describe, expect, it } from 'vitest'
import {
  announcementItemSchema,
  createAnnouncementBodySchema,
} from '../schemas/admin-announcement.js'

describe('admin-announcement schemas', () => {
  it('parses announcement item', () => {
    const item = announcementItemSchema.parse({
      id: 1,
      level: 'warn',
      title: 'Test',
      body: 'Hello',
      startsAt: '2026-01-01T00:00:00.000Z',
      endsAt: null,
      dismissable: true,
      active: true,
      createdBy: 'admin',
      createdAt: '2026-01-01T00:00:00.000Z',
    })
    expect(item.level).toBe('warn')
  })

  it('defaults create body level and flags', () => {
    const body = createAnnouncementBodySchema.parse({ title: 'Hi' })
    expect(body.level).toBe('info')
    expect(body.dismissable).toBe(true)
    expect(body.active).toBe(true)
  })

  it('rejects empty title', () => {
    expect(() => createAnnouncementBodySchema.parse({ title: '   ' })).toThrow()
  })
})
